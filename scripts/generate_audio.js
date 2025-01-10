import gtts from "gtts";
import fs from "fs";
import path from "path";

export default function generateAudio(subtitles, outputDir) {
    return new Promise((resolve, reject) => {
        const audioPaths = [];
        let completed = 0;

        if (!subtitles || subtitles.length === 0) {
            resolve(audioPaths);
            return;
        }

        // Concatenate subtitles into larger chunks
        const chunkSize = 3; // Adjust the chunk size as needed
        const subtitleChunks = [];
        for (let i = 0; i < subtitles.length; i += chunkSize) {
            subtitleChunks.push(subtitles.slice(i, i + chunkSize).join(" "));
        }

        subtitleChunks.forEach((chunk, index) => {
            const gttsInstance = new gtts(chunk, "en-uk");

            const audioPath = path.join(outputDir, `audio_${String(index).padStart(3, "0")}.mp3`);
            audioPaths.push(audioPath);

            gttsInstance.save(audioPath, (err) => {
                if (err) {
                    console.error(`Error generating audio for chunk ${index}:`, err);
                    reject(err);
                } else {
                    completed++;
                    if (completed === subtitleChunks.length) {
                        resolve(audioPaths);
                    }
                }
            });
        });
    });
}