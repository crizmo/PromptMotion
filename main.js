import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import generatePrompt from "./scripts/prompt_generator.js";
import generateImages from "./scripts/image_generator.js";
import assembleVideo from "./scripts/video_assembler.js";

dotenv.config();

(async () => {
    // Correct path to the script file
    const scriptFilePath = path.resolve("script.json");

    let scriptData;
    try {
        const scriptJson = fs.readFileSync(scriptFilePath, "utf8");
        scriptData = JSON.parse(scriptJson);
    } catch (error) {
        console.error("Error reading or parsing the JSON file:", error);
        return;
    }

    console.log("Generating prompts and images...");

    const imagePaths = [];
    for (let i = 0; i < scriptData.length; i++) {
        const scene = scriptData[i];

        // Generate the prompt using the scene data from JSON
        const prompt = generatePrompt(scene);
        
        // Generate the image based on the prompt
        const imagePath = await generateImages(prompt, i);
        imagePaths.push(imagePath);
    }

    console.log("Assembling video...");
    const videoPath = await assembleVideo(imagePaths, "output/video.mp4");

    console.log("Video assembled at:", videoPath);
})();
