import { request } from 'obsidian';
import { KindleSyncSettings } from '../settings';
import { KindleNotebook } from '../types';
import { NotebookConverter } from './notebookConverter';
import * as tar from 'tar-stream';
import * as zlib from 'zlib';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface NotebookMetadata {
    currentPage: number;
    modificationTime: number;
    title: string;
    totalPages: number;
}

interface OpenNotebookResponse {
    metadata: NotebookMetadata;
    readingSessionId: string;
    renderingToken: string;
}

interface KindleItem {
    id: string;
    title: string;
    type: 'folder' | 'notebook';
    parentFolder: string;
    items: KindleItem[];
}

interface KindleResponse {
    itemsList: KindleItem[];
    responseStatus: string;
}

interface TarHeader {
    name: string;
    size: number;
    mode: number;
    uid: number;
    gid: number;
    mtime: Date;
    type: string;
    linkname?: string;
    uname?: string;
    gname?: string;
    devmajor?: number;
    devminor?: number;
}

export class AmazonKindleAPI {
    private baseUrl: string;
    private cookies: string;
    private tempDir: string;

    constructor(settings: KindleSyncSettings) {
        this.baseUrl = 'https://read.amazon.com/kindle-notebook/';
        this.cookies = settings.amazonCookies;
        this.tempDir = path.join(os.tmpdir(), 'kindle-sync');
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    private async makeRequest(path: string, method: string = 'GET', body?: any, additionalHeaders?: Record<string, string>, isBinary: boolean = false): Promise<any> {
        const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': isBinary ? 'application/x-tar' : 'application/json',
            'Origin': 'https://read.amazon.com',
            'Referer': 'https://read.amazon.com/kindle-notebook?ref_=neo_mm_yn_na_kfa',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Cookie': this.cookies,
            ...additionalHeaders
        };

        // Create curl command for debugging
        // const headerArgs = Object.entries(headers)
        //     .map(([key, value]) => `-H '${key}: ${value}'`)
        //     .join(' ');
        
        // const bodyArg = body ? `-d '${JSON.stringify(body)}'` : '';
        // const methodArg = method !== 'GET' ? `-X ${method}` : '';
        
        // console.log('Curl command:');
        // console.log(`curl ${methodArg} ${headerArgs} ${bodyArg} '${url}'`);

        try {
            const response = await request({
                url,
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            if (isBinary) {
                // For binary responses, we need to ensure we have valid TAR data
                if (!response || response.length === 0) {
                    throw new Error('Empty response received for binary request');
                }
                
                // Convert response to Buffer if it's not already
                const responseBuffer = Buffer.isBuffer(response) ? response : Buffer.from(response);
                
                // Check if the response starts with the TAR magic number
                const tarMagic = Buffer.from([0x75, 0x73, 0x74, 0x61, 0x72]); // "ustar"
                if (!responseBuffer.slice(257, 262).equals(tarMagic)) {
                    console.error('Invalid TAR data received:', {
                        url,
                        responseLength: responseBuffer.length,
                        firstBytes: responseBuffer.slice(0, 10).toString('hex')
                    });
                    throw new Error('Invalid TAR data received');
                }
                
                return responseBuffer;
            }

            console.log('Response:', response);
            // Try to parse as JSON, but don't throw if it's not JSON
            try {
                return JSON.parse(response);
            } catch (e) {
                // If it's not JSON, return the raw response
                return response;
            }
        } catch (error) {
            console.error('Request failed:', {
                url,
                method,
                headers,
                error
            });
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            // Test the main page first
            const response = await this.makeRequest('api/notes');
            if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
                console.log('Successfully accessed main page');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    private processKindleItems(items: KindleItem[]): KindleNotebook[] {
        const notebooks: KindleNotebook[] = [];
        
        for (const item of items) {
            if (item.type === 'notebook') {
                notebooks.push({
                    id: item.id,
                    name: item.title,
                    lastModified: new Date().toISOString(),
                    path: this.getNotebookPath(item)
                });
            }
            
            // Recursively process items in folders
            if (item.items && item.items.length > 0) {
                notebooks.push(...this.processKindleItems(item.items));
            }
        }
        console.log('Notebooks:', notebooks);
        return notebooks;
    }

    private getNotebookPath(item: KindleItem): string {
        const pathParts: string[] = [item.title];
        let currentItem = item;
        
        // Traverse up the parent folder chain
        while (currentItem.parentFolder && currentItem.parentFolder !== 'root') {
            // Note: In a real implementation, we would need to maintain a map of folder IDs to names
            // For now, we'll just use the folder ID as part of the path
            pathParts.unshift(currentItem.parentFolder);
            // In a real implementation, we would look up the parent folder's details here
            break; // Prevent infinite loop since we don't have the full folder hierarchy
        }
        
        return pathParts.join('/');
    }

    async getNotebooks(): Promise<KindleNotebook[]> {
        try {
            // Get the notebooks
            const response = await this.makeRequest('api/notes') as KindleResponse;
            if (!response.itemsList) {
                throw new Error('Invalid response format from notes API');
            }
            
            return this.processKindleItems(response.itemsList);
        } catch (error) {
            console.error('Failed to get notebooks:', error);
            throw error;
        }
    }

    /**
     * Gets the content of a specific notebook
     * @param notebookId The ID of the notebook to get
     * @returns An object containing the metadata and an array of page images
     */
    async getNotebookContent(notebookId: string): Promise<{ metadata: NotebookMetadata; pages: Buffer[] }> {
        // First, open the notebook to get the rendering token and metadata
        const openResponse = await this.makeRequest(
            `https://read.amazon.com/openNotebook?notebookId=${notebookId}&marketplaceId=ATVPDKIKX0DER`
        ) as OpenNotebookResponse;
        console.log('Open response:', openResponse);

        if (!openResponse.renderingToken) {
            throw new Error('Failed to get rendering token');
        }

        const pages: Buffer[] = [];

        // Process all pages
        const pageResponse = await this.makeRequest(
            `https://read.amazon.com/renderPage?startPage=0&endPage=${openResponse.metadata.totalPages-1}&width=388&height=663&dpi=160`,
            'GET',
            undefined,
            {
                'x-amzn-karamel-notebook-rendering-token': openResponse.renderingToken,
                'Accept-Encoding': 'gzip, deflate, br'
            },
            true // Set isBinary to true for TAR response
        );

        const extractOptions: tar.ExtractOptions = {
            allowUnknownFormat: true,
            filenameEncoding: 'utf-8'
        };

        // Extract the PNG from the page's TAR
        const pageExtract = tar.extract(extractOptions);

        let pageImages: Buffer[];
        let pageMetadata: String[];
        console.log('Starting extraction process for notebook:', notebookId);

        pageExtract.on('entry', (header, stream, next) => {
            // const chunks: Buffer[] = [];
            console.log('Entry:', header);

            // Handle stream errors for this entry
            // stream.on('error', (err) => {
            //     console.warn(`Error processing entry ${header.name}:`, err);
            //     reject(err); // Continue with next entry
            // });

            // stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => {
                console.log('Stream end');
                // try {
                //     const content = Buffer.concat(chunks);
                //     console.log('Content:', content);
                //     console.log('Header:', header);
                //     if (header.name.endsWith('.png')) {
                //         // Store the PNG data
                //         pageImage = content;
                //     } else if (header.name.endsWith('.json')) {
                //         // Parse and store the metadata
                //         try {
                //             pageMetadata = JSON.parse(content.toString('utf-8'));
                //             console.log(`Page ${pageNum} metadata:`, pageMetadata);
                //         } catch (e) {
                //             console.warn(`Failed to parse metadata for page ${pageNum}:`, e);
                //         }
                //     }
                //     console.log('Process finished');
                // } catch (err) {
                //     console.warn(`Error processing content for entry ${header.name}:`, err);
                // }
                next(); // Always continue to next entry
            });
            stream.resume();
        });

        pageExtract.on('finish', () => {
            console.log('Page extract finish');
            //pages = pageImages;
            console.log(`Successfully extracted images `);
        });

        pageExtract.on('error', (err) => {
            console.warn(`TAR extraction error for notebook ${notebookId}:`, err);
            // Don't reject, just log the error and continue
        });

        // Process the TAR data
        pageExtract.end(pageResponse);

        

        return {
            metadata: openResponse.metadata,
            pages
        };
    }

    async uploadNotebookContent(notebookId: string, content: any): Promise<void> {
        try {
            await this.makeRequest(`/api/notes/${notebookId}`, 'POST', content);
        } catch (error) {
            console.error(`Failed to upload content for notebook ${notebookId}:`, error);
            throw error;
        }
    }
} 