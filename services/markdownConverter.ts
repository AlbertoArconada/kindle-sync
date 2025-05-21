import { ImageProcessingService } from './imageProcessingService';

export class MarkdownConverter {
    constructor() {}

    async convertToMarkdown(text: string, image: string): Promise<string> {
        const markdownParts: string[] = [];

        // Process the text
        if (text) {
            markdownParts.push(this.processText(text));
        }

        // Process the image (assume image is already a base64 data URL string)
        if (image) {
            markdownParts.push(`![Page Image](${image})`);
        }

        return markdownParts.join('\n\n');
    }

    private processText(text: string): string {
        // Split text into lines
        const lines = text.split('\n');

        // Process each line
        return lines.map(line => {
            // Detect and convert lists
            if (line.match(/^[-*]\s/)) {
                return line;
            }

            // Detect and convert headings
            if (line.match(/^#+\s/)) {
                return line;
            }

            // Detect and convert tables
            if (line.includes('|')) {
                return this.processTableLine(line);
            }

            // Detect and convert code blocks
            if (line.match(/^```/)) {
                return line;
            }

            // Detect and convert inline code
            if (line.includes('`')) {
                return this.processInlineCode(line);
            }

            // Detect and convert links
            if (line.match(/https?:\/\/[^\s]+/)) {
                return this.processLinks(line);
            }

            // Regular text
            return line;
        }).join('\n');
    }

    private processTableLine(line: string): string {
        // Ensure proper table formatting
        return line
            .split('|')
            .map(cell => cell.trim())
            .join(' | ');
    }

    private processInlineCode(line: string): string {
        // Ensure proper inline code formatting
        return line.replace(/`([^`]+)`/g, '`$1`');
    }

    private processLinks(line: string): string {
        // Convert URLs to markdown links
        return line.replace(
            /(https?:\/\/[^\s]+)/g,
            '[$1]($1)'
        );
    }

    convertFromMarkdown(markdown: string): { text: string; image?: Buffer } {
        const result: { text: string; image?: Buffer } = { text: '' };

        // Split markdown into lines
        const lines = markdown.split('\n');

        // Process each line
        const processedLines = lines.map(line => {
            // Remove markdown formatting
            return this.removeMarkdownFormatting(line);
        });

        result.text = processedLines.join('\n');

        // Extract image if present
        const imageMatch = markdown.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/);
        if (imageMatch) {
            const base64Data = imageMatch[1].split(',')[1];
            result.image = Buffer.from(base64Data, 'base64');
        }

        return result;
    }

    private removeMarkdownFormatting(line: string): string {
        // Remove headings
        line = line.replace(/^#+\s/, '');

        // Remove bold and italic
        line = line.replace(/\*\*(.*?)\*\*/g, '$1');
        line = line.replace(/\*(.*?)\*/g, '$1');

        // Remove inline code
        line = line.replace(/`(.*?)`/g, '$1');

        // Remove links
        line = line.replace(/\[(.*?)\]\(.*?\)/g, '$1');

        return line;
    }
} 