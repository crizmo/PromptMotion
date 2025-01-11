import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import generateAudio from "./generate_audio.js";
import sharp from "sharp";

export default async function assembleVideo(imagePaths, outputPath, subtitles) {
    return new Promise(async (resolve, reject) => {
        try {
            const tempDir = path.join(path.dirname(imagePaths[0]), "temp_frames");

            // Ensure the temporary directory exists
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            // Resize and copy images to the temporary directory
            const resizedImagePaths = [];
            for (let index = 0; index < imagePaths.length; index++) {
                const imagePath = imagePaths[index];
                const tempPath = path.join(tempDir, `frame_${String(index).padStart(3, "0")}.png`);
                await sharp(imagePath)
                    .resize(1080, 1920, {
                        fit: sharp.fit.cover,
                        position: sharp.strategy.entropy
                    })
                    .toFile(tempPath);
                resizedImagePaths.push(tempPath);
            }

            const inputPattern = path.join(tempDir, "frame_%03d.png");
            console.log("Input pattern:", inputPattern);

            // Generate audio files from subtitles
            const audioPaths = await generateAudio(subtitles, tempDir);

            // Calculate the duration of each audio file
            const audioDurations = await Promise.all(audioPaths.map(audioPath => {
                return new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(audioPath, (err, metadata) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(metadata.format.duration);
                        }
                    });
                });
            }));

            // Create a concat file for the video frames with their respective durations
            const concatFilePath = path.join(tempDir, "concat.txt");
            const concatFileContent = resizedImagePaths.map((imagePath, index) => {
                const duration = audioDurations[index];
                return `file '${path.basename(imagePath)}'\nduration ${duration}`;
            }).join("\n");

            fs.writeFileSync(concatFilePath, concatFileContent);

            // Combine frames into a video
            const ffmpegCommand = ffmpeg()
                .input(concatFilePath)
                .inputOptions(["-f concat", "-safe 0"])
                .outputOptions([
                    "-c:v libx264",
                    "-pix_fmt yuv420p",
                    "-movflags +faststart",
                    "-vf scale=1080:1920"
                ]);

            // Add subtitles if provided
            let subtitleFilePath;
            if (subtitles && subtitles.length > 0) {
                subtitleFilePath = path.join(tempDir, "subtitles.srt");
                const subtitleContent = subtitles.map((subtitle, index) => {
                    const startTime = new Date(audioDurations.slice(0, index).reduce((a, b) => a + b, 0) * 1000)
                        .toISOString()
                        .substr(11, 8);
                    const endTime = new Date(audioDurations.slice(0, index + 1).reduce((a, b) => a + b, 0) * 1000)
                        .toISOString()
                        .substr(11, 8);
                    return `${index + 1}\n${startTime},000 --> ${endTime},000\n${subtitle}\n`;
                }).join("\n");

                fs.writeFileSync(subtitleFilePath, subtitleContent);
                ffmpegCommand.outputOptions([`-vf subtitles=${subtitleFilePath}:force_style='FontSize=10'`]); // Adjust the font size here
            }

            // Combine audio into one file
            const combinedAudioPath = path.join(tempDir, "combined_audio.mp3");
            const audioConcatFile = path.join(tempDir, "audio_concat.txt");

            fs.writeFileSync(audioConcatFile, audioPaths.map(audioPath => `file '${audioPath}'`).join("\n"));
            await new Promise((resolveAudio, rejectAudio) => {
                ffmpeg()
                    .input(audioConcatFile)
                    .inputOptions(["-f concat", "-safe 0"])
                    .outputOptions(["-c copy"])
                    .save(combinedAudioPath)
                    .on("end", resolveAudio)
                    .on("error", rejectAudio);
            });

            // Add audio to the video
            ffmpegCommand.input(combinedAudioPath).outputOptions([
                "-c:a aac",
                "-b:a 192k",
                "-shortest"
            ]);

            // Run ffmpeg command to generate video
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
                    reject(err);
                })
                .run();
        } catch (error) {
            console.error("Error assembling video:", error);
            reject(error);
        }
    });
}