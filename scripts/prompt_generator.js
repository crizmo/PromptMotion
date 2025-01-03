const characterMemory = {};

export default function generatePrompt(scene) {
    const { description, action } = scene;

    // Update character memory based on the description
    if (description.includes("Hana")) {
        characterMemory["Hana"] = "a shy and artistic girl with long, flowing hair";
    }
    if (description.includes("Kaito")) {
        characterMemory["Kaito"] = "a charming and kind-hearted boy with a warm smile";
    }

    // Ensure gradual transition and consistency in descriptions
    let characterDescription = "a generic character";
    if (characterMemory["Hana"]) {
        characterDescription = characterMemory["Hana"];
    } else if (characterMemory["Kaito"]) {
        characterDescription = characterMemory["Kaito"];
    }

    // Define the environment to be used in all prompts
    const environment = "on a serene beach at sunset, surrounded by gentle waves and swaying palm trees";

    // Return the prompt that includes the environment for the scene setting
    return `A cinematic illustration of ${description} in a peaceful, tranquil environment ${environment}. Focus on ${characterDescription} in an emotional, serene atmosphere, resembling the mood of 'A Silent Voice' anime movie. ${action ? `Action: ${action}.` : ''}`;
}
