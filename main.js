import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import generatePrompt from "./scripts/prompt_generator.js";
import generateImages from "./scripts/image_generator.js";
import assembleVideo from "./scripts/video_assembler.js";
import generateScriptFromStory from "./scripts/story_to_script.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

// Serve the frames and output directories
app.use("/frames", express.static(path.resolve("frames")));
app.use("/output", express.static(path.resolve("output")));

app.get("/", (req, res) => {
    res.sendFile(path.resolve("public/index.html"));
});

app.get("/story.txt", (req, res) => {
    const storyFilePath = path.resolve("story.txt");
    fs.readFile(storyFilePath, "utf8", (err, data) => {
        if (err) {
            res.status(500).send("Error reading story file.");
        } else {
            res.send(data);
        }
    });
});

app.post("/save-script", (req, res) => {
    const { script, style } = req.body;
    const storyFilePath = path.resolve("story.txt");

    fs.writeFile(storyFilePath, script, "utf8", (err) => {
        if (err) {
            res.status(500).send("Error saving script.");
        } else {
            // Generate script.json from the short story
            generateScriptFromStory(script, style);
            res.send("Script and style saved successfully.");
        }
    });
});

app.get("/generate", async (req, res) => {
    try {
        const storyFilePath = path.resolve("story.txt");
        const shortStory = fs.readFileSync(storyFilePath, "utf8");

        // Generate script.json from the short story
        const scriptFilePath = path.resolve("script.json");
        const scriptJson = fs.readFileSync(scriptFilePath, "utf8");
        const scriptData = JSON.parse(scriptJson);

        const imagePaths = [];
        const subtitles = [];
        for (let i = 0; i < scriptData.length; i++) {
            const scene = scriptData[i];
            const prompt = generatePrompt(scene);
            const imagePath = await generateImages(prompt, i);
            imagePaths.push(imagePath);
            subtitles.push(scene.subtitle);
        }

        const videoPath = await assembleVideo(imagePaths, "output/video.mp4", subtitles);

        res.json({
            images: imagePaths.map(imagePath => `/frames/${path.basename(imagePath)}`),
            video: `/output/video.mp4`
        });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).send("Error generating content.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});