import * as tar from 'tar-stream';
import * as zlib from 'zlib';
import { KindleNotebook } from '../types';

interface NotebookPage {
    pageNumber: number;
    content: string;
}

interface NotebookContent {
    metadata: {
        currentPage: number;
        modificationTime: number;
        title: string;
        totalPages: number;
    };
    pages: NotebookPage[];
}

interface NotebookMetadata {
    currentPage: number;
    modificationTime: number;
    title: string;
    totalPages: number;
}

export class NotebookConverter {
    /**
     * Decompresses gzipped data
     * @param data The compressed data
     * @returns The decompressed data
     */
    private static async gunzip(data: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, result) => {
                if (err) {
                    reject(new Error(`Failed to decompress data: ${err.message}`));
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Extracts the notebook content from a TAR archive
     * @param tarData The raw TAR data as a Buffer
     * @returns The extracted notebook content
     */
    static async extractNotebookContent(tarData: Buffer): Promise<NotebookContent> {
        return new Promise((resolve, reject) => {
            try {
                const extract = tar.extract();
                const files: { [key: string]: Buffer } = {};
                let metadata: any = null;

                extract.on('entry', (header, stream, next) => {
                    const chunks: Buffer[] = [];
                    console.log('Processing entry:', header);
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => {
                        // Store the file with its full path
                        files[header.name] = Buffer.concat(chunks);
                        console.log('Found file in TAR:', header.name);
                        next();
                    });
                    stream.on('error', (err) => {
                        reject(new Error(`Error reading TAR entry: ${err.message}`));
                    });
                });

                extract.on('finish', () => {
                    try {
                        console.log('TAR extraction complete. Files found:', Object.keys(files));

                        // Look for metadata in various possible locations
                        const possibleMetadataPaths = [
                            'metadata.json',
                            'image/metadata.json',
                            'data/metadata.json'
                        ];

                        let metadataFile: Buffer | undefined;
                        for (const path of possibleMetadataPaths) {
                            if (files[path]) {
                                metadataFile = files[path];
                                console.log('Found metadata at:', path);
                                break;
                            }
                        }

                        if (!metadataFile) {
                            // If no metadata file is found, try to infer from the image files
                            const imageFiles = Object.keys(files).filter(name => name.endsWith('.png'));
                            console.log('Found image files:', imageFiles);
                            
                            if (imageFiles.length === 0) {
                                reject(new Error('No metadata.json or image files found in TAR archive'));
                                return;
                            }

                            // Create basic metadata from the image files
                            metadata = {
                                title: 'Untitled Notebook',
                                totalPages: imageFiles.length,
                                modificationTime: Date.now() / 1000,
                                currentPage: 1
                            };
                        } else {
                            metadata = JSON.parse(metadataFile.toString());
                        }

                        const pages: NotebookPage[] = [];
                        const imageFiles = Object.keys(files).filter(name => name.endsWith('.png'));

                        // Process each image file
                        imageFiles.forEach((imagePath, index) => {
                            pages.push({
                                pageNumber: index + 1,
                                content: files[imagePath].toString('base64')
                            });
                        });

                        resolve({
                            metadata,
                            pages
                        });
                    } catch (error) {
                        reject(new Error(`Failed to process TAR contents: ${error instanceof Error ? error.message : 'Unknown error'}`));
                    }
                });

                extract.on('error', (err) => {
                    reject(new Error(`Error extracting TAR: ${err.message}`));
                });

                // Write the TAR data to the extractor
                extract.end(tarData);
            } catch (error) {
                reject(new Error(`Failed to process TAR data: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        });
    }

    /**
     * Converts notebook content to Markdown format
     * @param content The notebook content
     * @returns Markdown formatted string
     */
    static convertToMarkdown(content: NotebookContent): string {
        try {
            const lines: string[] = [];

            // Add title
            lines.push(`# ${content.metadata.title}\n`);

            // Add metadata
            lines.push('## Metadata');
            lines.push(`- Last Modified: ${new Date(content.metadata.modificationTime * 1000).toLocaleString()}`);
            lines.push(`- Total Pages: ${content.metadata.totalPages}\n`);

            // Add pages
            lines.push('## Pages\n');
            content.pages.forEach(page => {
                lines.push(`### Page ${page.pageNumber}`);
                lines.push(`![Page ${page.pageNumber}](data:image/png;base64,${page.content})\n`);
            });

            return lines.join('\n');
        } catch (error: unknown) {
            console.error('Failed to convert to Markdown:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to convert to Markdown: ${errorMessage}`);
        }
    }

    /**
     * Processes a notebook's content and converts it to markdown
     * @param content The notebook content containing metadata and pages
     * @returns The markdown representation of the notebook
     */
    static async processTarToMarkdown(content: { metadata: NotebookMetadata; pages: Buffer[] }): Promise<string> {
        try {
            const { metadata, pages } = content;
            
            // Create the markdown content
            let markdown = `# ${metadata.title}\n\n`;
            markdown += `Last modified: ${new Date(metadata.modificationTime * 1000).toLocaleString()}\n\n`;

            // Process each page
            for (let i = 0; i < pages.length; i++) {
                const pageNumber = i + 1;
                const pageImage = pages[i];
                
                // Add page header
                markdown += `## Page ${pageNumber}\n\n`;
                
                // Add the image
                const base64Image = pageImage.toString('base64');
                markdown += `![Page ${pageNumber}](data:image/png;base64,${base64Image})\n\n`;
            }

            return markdown;
        } catch (error) {
            console.error('Failed to process notebook to markdown:', error);
            throw new Error(`Failed to process notebook to markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 