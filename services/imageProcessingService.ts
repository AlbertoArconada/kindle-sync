export class ImageProcessingService {
    async processImage(imageData: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Set canvas size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Convert to base64
                const processedImage = canvas.toDataURL('image/jpeg', 0.8);
                resolve(processedImage);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageData;
        });
    }
} 