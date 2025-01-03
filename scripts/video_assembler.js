import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export default function assembleVideo(imagePaths, outputPath) {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(path.dirname(imagePaths[0]), "temp_frames");

        // Ensure the temporary directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Copy and rename files to the temporary directory
        imagePaths.forEach((imagePath, index) => {
            const tempPath = path.join(tempDir, `frame_${String(index).padStart(3, "0")}.png`);
            fs.copyFileSync(imagePath, tempPath);
        });

        const inputPattern = path.join(tempDir, "frame_%03d.png");
        console.log("Input pattern:", inputPattern);

        const totalFrames = imagePaths.length;
        const videoDuration = 10; // desired video duration in seconds
        const framerate = totalFrames / videoDuration;

        ffmpeg()
            .input(inputPattern)
            .inputOptions([`-framerate ${framerate}`])
            .output(outputPath)
            .on("end", () => {
                console.log(`Video created successfully: ${outputPath}`);
                // Clean up temporary directory
                fs.rmSync(tempDir, { recursive: true, force: true });
                resolve(outputPath);
            })
            .on("error", (err) => {
                console.error("Error creating video:", err);
                // Clean up temporary directory
                fs.rmSync(tempDir, { recursive: true, force: true });
                reject(err);
            })
            .run();
    });
}