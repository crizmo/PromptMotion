import dotenv from "dotenv";
import parseScript from "./scripts/script_parser.js";
import generatePrompt from "./scripts/prompt_generator.js";
import generateImages from "./scripts/image_generator.js";
import assembleVideo from "./scripts/video_assembler.js";

dotenv.config();

(async () => {
    const script = `
        The sun sets over the tranquil beach, painting the sky in hues of orange and pink. 
        A gentle breeze rustles the palm trees as the waves softly lap against the shore.

        Hana, a shy and artistic girl with long, flowing hair, sits on a blanket, sketching the beautiful scenery. 
        Her eyes sparkle with inspiration as she captures the essence of the moment on her canvas.

        Slowly, Hana's gaze shifts as she hears footsteps approaching. She looks up to see Kaito, a charming and kind-hearted boy with a warm smile, walking toward her, his footsteps soft in the sand.
        He carries a small bouquet of wildflowers, freshly picked from the nearby dunes.

        Kaito approaches slowly, his eyes locking with Hana's as he nears. He sits down beside her on the blanket, offering her the flowers. She blushes slightly, accepting them with a shy smile. 
        The two exchange a moment of quiet understanding as they sit in comfortable silence, watching the sun dip below the horizon.

        The soft evening breeze whispers through the palm trees, as stars begin to twinkle in the sky. Kaito gently takes Hana's hand in his, his voice soft and sincere, "Hana, I've admired you for so long. Your art, your kindness, everything about you."

        Hana's heart races as she looks into his eyes, her cheeks flushed. She squeezes his hand gently, her voice barely above a whisper, "Kaito, I feel the same way."

        The camera pans out slowly, capturing the two of them sitting side by side, hand in hand, under the starlit sky. The waves continue their gentle dance, the moonlight casting a peaceful glow over the scene, marking the beginning of their beautiful romance.
    `;

    console.log("Parsing the script...");
    const scenes = parseScript(script);

    console.log("Generating images...");
    const imagePaths = [];
    for (let i = 0; i < scenes.length; i++) {
        const prompt = generatePrompt(scenes[i]);
        const imagePath = await generateImages(prompt, i);
        imagePaths.push(imagePath);
    }

    console.log("Assembling video...");
    const videoPath = await assembleVideo(imagePaths, "output/video.mp4");

    console.log(`Video created successfully: ${videoPath}`);
})();
