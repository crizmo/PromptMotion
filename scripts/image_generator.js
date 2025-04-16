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

// Use a consistent seed for all frames to improve visual consistency
const baseSeed = parseInt(process.env.INITIAL_SEED || 700);

export default async function generateImages(prompt, index, totalImages) {
    // Always use the same base seed for strongest character consistency
    let seed = baseSeed + (index % 5); // Add minor variations to handle NSFW retries
    
    // Get parameters from environment variables
    const imageWidth = parseInt(process.env.IMAGE_WIDTH || 1008);
    const imageHeight = parseInt(process.env.IMAGE_HEIGHT || 1792);
    const maxSteps = 4; // FLUX.1-schnell-Free has a hard limit of 4 steps
    const baseSteps = Math.min(parseInt(process.env.GENERATION_STEPS || 4), maxSteps);
    const modelName = process.env.MODEL || "black-forest-labs/FLUX.1-schnell-Free";
    
    // Use maximum steps for key frames but stay within API limits
    const isKeyFrame = index === 0 || index === totalImages - 1 || 
                     index === Math.floor(totalImages / 2) ||
                     index % 5 === 0; // Consider every 5th frame a key frame too
    const frameSteps = isKeyFrame ? maxSteps : baseSteps;
    
    console.log(`Generating frame ${index+1}/${totalImages} with seed ${seed} and ${frameSteps} steps...`);

    // Build consistency-enhancing prompt modifications
    let enhancedPrompt = prompt;

    // For non-first frames, add explicit continuity instructions
    if (index > 0) {
        enhancedPrompt = `${enhancedPrompt}, CONSISTENCY CRITICAL: exactly same character appearance as previous frames, same clothing, same hair, same facial features`;
    }

    // For key frames, add more emphasis on quality while maintaining consistency
    const adjustedPrompt = isKeyFrame 
        ? `${enhancedPrompt}, (masterpiece:1.2), (best quality:1.2), (detailed:1.2), (perfect composition:1.2)` 
        : enhancedPrompt;

    // Add negative prompt elements to avoid inconsistency and NSFW content
    const negativePrompt = "inconsistent appearance, changing clothes, different hairstyle, different facial features, deformed, distorted, nude, naked, nsfw, inappropriate content, sexual content, realistic face";

    // Maximum retry attempts for NSFW or other errors
    const maxRetries = 3;
    let retries = 0;
    let success = false;
    let outputPath = "";
    let lastError = null;

    // Try generating with retries for NSFW errors
    while (!success && retries < maxRetries) {
        try {
            // Generate the image
            const response = await together.images.create({
                model: modelName,
                prompt: adjustedPrompt + (retries > 0 ? ", family-friendly content only, G-rated, safe for work" : ""),
                negative_prompt: negativePrompt + (retries > 0 ? ", nudity, sexuality, suggestive content, revealing clothing" : ""),
                width: imageWidth,
                height: imageHeight,
                steps: frameSteps,
                n: 1,
                response_format: "b64_json",
                seed: seed + retries, // Slightly change seed on retries
                cfg_scale: parseFloat(process.env.CFG_SCALE || 7.5) + (retries * 0.2) // Increase CFG scale slightly on retries
            });

            // Get the base64 image data
            const imageBase64 = response.data[0].b64_json;

            // Clean the base64 string by removing any prefix like "data:image/png;base64,"
            const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '');

            // Define the output path for the generated PNG file
            outputPath = path.join(framesDir, `frame_${String(index).padStart(3, "0")}.png`);

            // Convert base64 to buffer
            const buffer = Buffer.from(base64Data, 'base64');

            // Convert to PNG using sharp
            await sharp(buffer)
                .resize(parseInt(process.env.OUTPUT_WIDTH || 1080), 
                        parseInt(process.env.OUTPUT_HEIGHT || 1920), {
                    fit: sharp.fit.cover,
                    position: sharp.strategy.entropy
                })
                .toFormat('png')
                .toFile(outputPath);
            
            console.log(`Generated frame: ${outputPath}`);
            
            // For the first frame, save a reference copy to help with character appearance matching
            if (index === 0) {
                const referenceDir = path.join(__dirname, "../references");
                if (!fs.existsSync(referenceDir)) {
                    fs.mkdirSync(referenceDir);
                }
                await sharp(buffer).toFile(path.join(referenceDir, "character_reference.png"));
            }

            success = true;
        } catch (error) {
            lastError = error;
            retries++;

            // If error is NSFW related, modify the prompt to be more conservative
            if (error.status === 422 && error.error?.error?.message?.includes('NSFW')) {
                console.log(`NSFW content detected on try ${retries}. Retrying with more conservative prompt...`);
                seed += 10; // Change seed more significantly
                // Add more safety terms to the negative prompt next time
            } else {
                console.error(`Error generating frame ${index} (attempt ${retries}):`, error.message || error);
                // Wait a moment before retrying for rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }

            // If we've hit the retry limit, we need to create a placeholder image
            if (retries >= maxRetries) {
                console.log(`Failed to generate frame ${index} after ${maxRetries} attempts. Creating placeholder...`);
                
                // Create a placeholder image with error text
                outputPath = await createPlaceholderImage(index, `Frame ${index+1} - Could not generate`);
                success = true; // We'll consider this a "success" to continue processing
            }
        }
    }

    return outputPath;
}

// Function to create a placeholder image when generation fails
async function createPlaceholderImage(index, message = "Image Generation Failed") {
    const width = parseInt(process.env.OUTPUT_WIDTH || 1080);
    const height = parseInt(process.env.OUTPUT_HEIGHT || 1920);
    const outputPath = path.join(framesDir, `frame_${String(index).padStart(3, "0")}.png`);
    
    try {
        // Create a basic placeholder image with text
        await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 50, g: 50, b: 50, alpha: 1 }
            }
        })
        .composite([
            {
                input: {
                    text: {
                        text: message,
                        font: 'sans',
                        fontSize: 48,
                        rgba: true
                    }
                },
                gravity: 'center'
            }
        ])
        .png()
        .toFile(outputPath);
        
        console.log(`Created placeholder image: ${outputPath}`);
        return outputPath;
    } catch (err) {
        console.error("Error creating placeholder image:", err);
        // As a last resort, create an empty file
        fs.writeFileSync(outputPath, "");
        return outputPath;
    }
}