import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export default function assembleVideo(imagePaths, outputPath, subtitles, backgroundMusicPath) {
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

        const totalFrames = imagePaths.length
        const videoDuration = totalFrames * 5;
        const framerate = totalFrames / videoDuration;

        const ffmpegCommand = ffmpeg()
            .input(inputPattern)
            .inputOptions([`-framerate ${framerate}`])
            .outputOptions([
                '-c:v libx264', 
                '-pix_fmt yuv420p', 
                '-movflags +faststart',
                '-vf "fade=t=in:st=0:d=1,fade=t=out:st=24:d=1"' // Add fade-in and fade-out transitions
            ]);

        // Add background music if provided
        if (backgroundMusicPath) {
            ffmpegCommand.input(backgroundMusicPath)
                .outputOptions([
                    '-c:a aac',
                    '-b:a 192k',
                    '-shortest' // Ensure the video and audio are the same length
                ]);
        }

        // Add subtitles if provided
        if (subtitles && subtitles.length > 0) {
            const subtitleFilePath = path.join(tempDir, "subtitles.srt");
            const subtitleContent = subtitles.map((subtitle, index) => {
                const startTime = new Date(index * (videoDuration / subtitles.length) * 1000).toISOString().substr(11, 8);
                const endTime = new Date((index + 1) * (videoDuration / subtitles.length) * 1000).toISOString().substr(11, 8);
                return `${index + 1}\n${startTime},000 --> ${endTime},000\n${subtitle}\n`;
            }).join("\n");

            fs.writeFileSync(subtitleFilePath, subtitleContent);
            ffmpegCommand.outputOptions([`-vf subtitles=${subtitleFilePath}`]);
        }

        ffmpegCommand
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