import * as tf from '@tensorflow/tfjs';
import * as tesseract from 'tesseract.js';
import { createCanvas, loadImage } from 'canvas';

export class TextRecognitionService {
    private model: tf.LayersModel | null = null;

    constructor() {
        this.initializeModel();
    }

    private async initializeModel() {
        try {
            // Load a pre-trained model for handwritten text recognition
            // This is a placeholder - you would need to use a specific model
            // trained for handwritten text recognition
            this.model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/handwriting_recognition/model.json');
        } catch (error) {
            console.error('Failed to load handwriting recognition model:', error);
        }
    }

    async recognizeText(imageBuffer: Buffer): Promise<string> {
        try {
            // First try using Tesseract OCR
            const result = await tesseract.recognize(
                imageBuffer,
                'eng',
                {
                    logger: m => console.log(m),
                }
            );

            // If the confidence is low, try using the handwriting recognition model
            if (result.data.confidence < 60 && this.model) {
                // Load image using node-canvas
                const image = await loadImage(imageBuffer);
                const canvas = createCanvas(224, 224);
                const ctx = canvas.getContext('2d');
                
                // Draw and resize image
                ctx.drawImage(image, 0, 0, 224, 224);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, 224, 224);
                
                // Convert to tensor
                const tensor = tf.tensor3d(
                    new Uint8Array(imageData.data),
                    [224, 224, 4]
                ).slice([0, 0, 0], [224, 224, 3]) // Remove alpha channel
                 .div(255.0)
                 .expandDims(0);

                // Make prediction
                const prediction = await this.model.predict(tensor) as tf.Tensor;
                const text = await this.decodePrediction(prediction);
                
                // Clean up
                tensor.dispose();
                prediction.dispose();

                return text;
            }

            return result.data.text;
        } catch (error) {
            console.error('Text recognition failed:', error);
            return '';
        }
    }

    private async decodePrediction(prediction: tf.Tensor): Promise<string> {
        // Convert model output to text
        // This is a placeholder - the actual implementation would depend on
        // the specific model architecture and output format
        const values = await prediction.data();
        return this.convertToText(values.toString());
    }

    public async convertToText(handwriting: string): Promise<string> {
        // Placeholder: just return the input string
        return handwriting;
    }
} 