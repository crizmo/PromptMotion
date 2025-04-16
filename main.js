import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import generatePrompt from "./scripts/prompt_generator.js";
import generateImages from "./scripts/image_generator.js";
import assembleVideo from "./scripts/video_assembler.js";
import generateScriptFromStory from "./scripts/story_to_script.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

let isGenerating = false;
let stopRequested = false;

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("generate", async () => {
        if (isGenerating) return;
    
        isGenerating = true;
        stopRequested = false;
    
        try {
            // Create references directory if it doesn't exist
            const referencesDir = path.resolve("references");
            if (!fs.existsSync(referencesDir)) {
                fs.mkdirSync(referencesDir);
            }
            
            // Ensure frames directory exists
            const framesDir = path.resolve("frames");
            if (!fs.existsSync(framesDir)) {
                fs.mkdirSync(framesDir);
            }
            
            // Read story and script
            const scriptFilePath = path.resolve("script.json");
            const scriptJson = fs.readFileSync(scriptFilePath, "utf8");
            const scriptData = JSON.parse(scriptJson);
    
            const imagePaths = [];
            const subtitles = [];
            let generationErrors = 0;
            
            for (let i = 0; i < scriptData.length; i++) {
                if (stopRequested) break;
    
                const scene = scriptData[i];
                
                try {
                    const prompt = generatePrompt(scene, i, scriptData.length);
                    const imagePath = await generateImages(prompt, i, scriptData.length);
                    imagePaths.push(imagePath);
                    subtitles.push(scene.subtitle);
    
                    // Send progress update to the client
                    socket.emit("progress", { 
                        imagePath: `/frames/${path.basename(imagePath)}`, 
                        index: i, 
                        total: scriptData.length 
                    });
                } catch (error) {
                    console.error(`Error generating frame ${i}:`, error);
                    generationErrors++;
                    
                    // Create a placeholder for this frame
                    const placeholderPath = path.resolve(`frames/frame_${String(i).padStart(3, "0")}.png`);
                    
                    // If placeholder doesn't exist, create a basic one
                    if (!fs.existsSync(placeholderPath)) {
                        try {
                            // Create an empty file as placeholder (the actual placeholder creation is handled in image_generator.js)
                            fs.writeFileSync(placeholderPath, "");
                        } catch (err) {
                            console.error("Failed to create placeholder file:", err);
                        }
                    }
                    
                    imagePaths.push(placeholderPath);
                    subtitles.push(scene.subtitle || `Frame ${i+1}`);
                    
                    // Inform the client about the error but continue processing
                    socket.emit("progress", { 
                        imagePath: `/frames/${path.basename(placeholderPath)}`, 
                        index: i, 
                        total: scriptData.length,
                        error: true
                    });
                    
                    // If too many errors occur consecutively, consider stopping
                    if (generationErrors >= 3 && generationErrors === i) {
                        socket.emit("error", "Multiple consecutive generation failures. Please check your API key and prompts.");
                        break;
                    }
                }
            }
            
            if (!stopRequested && imagePaths.length > 0) {
                try {
                    const videoPath = await assembleVideo(imagePaths, "output/video.mp4", subtitles);
                    socket.emit("complete", { video: `/output/video.mp4` });
                } catch (videoError) {
                    console.error("Error assembling video:", videoError);
                    socket.emit("error", "Video assembly failed, but images were generated successfully.");
                }
            } else {
                if (stopRequested) {
                    socket.emit("stopped");
                    console.log("Generation stopped by user");
                    
                    // clear the frames directory if generation was stopped
                    fs.readdir(framesDir, (err, files) => {
                        if (err) {
                            console.error("Error reading frames directory:", err);
                        } else {
                            for (const file of files) {
                                fs.unlink(path.join(framesDir, file), (err) => {
                                    if (err) {
                                        console.error("Error deleting frame:", err);
                                    }
                                });
                            }
                        }
                    });
                } else {
                    socket.emit("error", "No images could be generated. Please check your API key and connection.");
                }
            }
        } catch (error) {
            console.error("Error generating content:", error);
            socket.emit("error", "Error generating content: " + (error.message || error));
        } finally {
            isGenerating = false;
            stopRequested = false;
        }
    });

    socket.on("stop", () => {
        stopRequested = true;
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});