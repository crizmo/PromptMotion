import dotenv from "dotenv";
dotenv.config();

import Together from "together-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from 'sharp';

// Convert the import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use __dirname to get the correct path for the frames directory
const framesDir = path.join(__dirname, "../frames");

// Ensure the frames directory exists
if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir);
}

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });


export default async function generateImages(prompt, index) {
    const response = await together.images.create({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt,
        width: 1024,
        height: 768,
        steps: 4,  // Steps set between 1 and 4
        n: 1,
        response_format: "b64_json",
        seed: 500
    });

    // Get the base64 image data
    const imageBase64 = response.data[0].b64_json;

    // Clean the base64 string by removing any prefix like "data:image/png;base64,"
    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '');

    // Define the output path for the generated PNG file
    const outputPath = path.join(framesDir, `frame_${String(index).padStart(3, "0")}.png`);

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    try {
        // Convert to PNG using sharp if the original is JPEG
        await sharp(buffer)
            .toFormat('png')
            .toFile(outputPath);
        console.log(`Generated frame: ${outputPath}`);
    } catch (error) {
        console.error(`Error writing frame ${index}:`, error);
    }

    // Verify that the file was written correctly
    if (fs.existsSync(outputPath)) {
        console.log(`Frame ${index} saved successfully.`);
    } else {
        console.error(`Failed to save frame ${index}.`);
    }

    return outputPath;
}
