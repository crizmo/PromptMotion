const characterMemory = {};

export default function generatePrompt(scene) {
    const { description, action } = scene;

    // Update character memory based on the description
    if (description.includes("Naruto")) {
        characterMemory["Naruto"] = "a young anime boy with messy orange hair, wearing a casual black hoodie, and light shorts. Naruto has an adventurous spirit, always seeking new experiences, and a reflective side that comes out in moments of tranquility like this beach walk.";
    }
    if (description.includes("Lily")) {
        characterMemory["Lily"] = "a cheerful girl with long brown hair and bright, curious eyes. Lily is playful and full of energy, often bringing a lighthearted touch to moments of reflection with Naruto, adding joy to their shared experiences.";
    }

    // Ensure gradual transition and consistency in descriptions
    let characterDescription = "a generic character";
    if (characterMemory["Naruto"]) {
        characterDescription = characterMemory["Naruto"];
    } else if (characterMemory["Lily"]) {
        characterDescription = characterMemory["Lily"];
    }

    // Define the environment to be used in all prompts
    const environment = "on a serene beach with golden sand, gentle waves, and the sound of seagulls flying above. The sky is filled with the colors of sunset and the night gradually sets in, with the stars appearing in the sky.";

    // Return the prompt that includes the environment for the scene setting
    return `A cinematic scene of ${description} ${environment}. Focus on ${characterDescription} in a calm, reflective moment. ${action ? `Action: ${action}.` : ''}`;
}
