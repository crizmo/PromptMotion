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

        subtitles.forEach((subtitle, index) => {
            // Remove newline characters from the subtitle
            const cleanedSubtitle = subtitle.replace(/\n/g, " ");
            const gttsInstance = new gtts(cleanedSubtitle, "en-us");

            const audioPath = path.join(outputDir, `audio_${String(index).padStart(3, "0")}.mp3`);
            audioPaths.push(audioPath);

            gttsInstance.save(audioPath, (err) => {
                if (err) {
                    console.error(`Error generating audio for subtitle ${index}:`, err);
                    reject(err);
                } else {
                    // console.log(`Generated audio for subtitle ${index}: ${audioPath}`);
                    completed++;
                    if (completed === subtitles.length) {
                        resolve(audioPaths);
                    }
                }
            });
        });
    });
}