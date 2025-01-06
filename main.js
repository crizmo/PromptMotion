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

    // const imagePaths = [];
    // for (let i = 0; i < scriptData.length; i++) {
    //     const scene = scriptData[i];

    //     // Generate the prompt using the scene data from JSON
    //     const prompt = generatePrompt(scene);
        
    //     // Generate the image based on the prompt
    //     const imagePath = await generateImages(prompt, i);
    //     imagePaths.push(imagePath);
    // }

    // now the image paths when the images are already generated
    const imagePaths = [
        "frames/frame_000.png",
        "frames/frame_001.png",
        "frames/frame_002.png",
        "frames/frame_003.png",
        "frames/frame_004.png",
        "frames/frame_005.png",
        "frames/frame_006.png",
        "frames/frame_007.png",
        "frames/frame_008.png",
        "frames/frame_009.png",
        "frames/frame_010.png",
        "frames/frame_011.png",
        "frames/frame_012.png",
        "frames/frame_013.png",
        "frames/frame_014.png",
        "frames/frame_015.png",
        "frames/frame_016.png",
        "frames/frame_017.png",
        "frames/frame_018.png",
        "frames/frame_019.png",
        "frames/frame_020.png",
        "frames/frame_021.png",
        "frames/frame_022.png",
        "frames/frame_023.png"
    ];
    console.log("Assembling video...");
    const videoPath = await assembleVideo(imagePaths, "output/video.mp4");

    console.log("Video assembled at:", videoPath);
})();
