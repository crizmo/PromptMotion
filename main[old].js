import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import generatePrompt from "./scripts/prompt_generator.js";
import generateImages from "./scripts/image_generator.js";
import assembleVideo from "./scripts/video_assembler.js";
import generateScriptFromStory from "./scripts/story_to_script.js";

dotenv.config();

(async () => {
    // Example short story
    const storyFilePath = path.resolve("story.txt");
    let shortStory;
    try {
        shortStory = fs.readFileSync(storyFilePath, "utf8");
    } catch (error) {
        console.error("Error reading the story file:", error);
        return;
    }

    // Generate script.json from the short story
    generateScriptFromStory(shortStory);

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
    const subtitles = [];
    // 1. when we want to generate images then we will use this loop
    for (let i = 0; i < scriptData.length; i++) {
        const scene = scriptData[i];

        const prompt = generatePrompt(scene);
        const imagePath = await generateImages(prompt, i);
        imagePaths.push(imagePath);
        subtitles.push(scene.subtitle);
    }

    // 2. when the images are already generated then we will use this loop
    // for (let i = 0; i < scriptData.length; i++) {
    //     const scene = scriptData[i];
    //     const imagePath = path.resolve(`frames/frame_${i.toString().padStart(3, "0")}.png`);
    //     imagePaths.push(imagePath);
    //     subtitles.push(scene.subtitle);
    // }

    console.log("Assembling video...");
    // const backgroundMusicPath = path.resolve("music.mp3");
    // const videoPath = await assembleVideo(imagePaths, "output/video.mp4", subtitles, backgroundMusicPath);

    // const backgroundMusicPath = path.resolve("music.mp3");
    const videoPath = await assembleVideo(imagePaths, "output/video.mp4", subtitles);

    console.log("Video assembled at:", videoPath);
})();