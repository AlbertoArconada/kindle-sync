import { TextRecognitionService } from '../services/textRecognitionService';
import * as fs from 'fs';
import * as path from 'path';

async function testTextRecognition() {
    try {
        // Initialize the service
        const service = new TextRecognitionService();
        
        // Load a test image (you'll need to provide a sample image)
        const imagePath = path.join(__dirname, 'test-image.jpg');
        const imageBuffer = fs.readFileSync(imagePath);
        
        console.log('Starting text recognition test...');
        
        // Test the recognition
        const result = await service.recognizeText(imageBuffer);
        
        console.log('Recognition result:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testTextRecognition(); 