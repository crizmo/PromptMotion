const characterMemory = {};

export default function generatePrompt(scene) {
    const { description, action, environment } = scene;

    // Update character memory based on the description
    if (description.includes("Haruto")) {
        characterMemory["Haruto"] = "a young anime boy with short, messy dark hair and kind, gentle eyes. Haruto has a warm, caring nature, always looking out for others. His bond with the kitten, Kuro, grows stronger each day as he provides it with love and care.";
    }
    if (description.includes("Kuro")) {
        characterMemory["Kuro"] = "a tiny, black kitten with golden eyes. Kuro is initially wary but quickly becomes playful and affectionate toward Haruto. Despite its small size, Kuro's curiosity and energy are endless.";
    }
    if (description.includes("room")) {
        // Add additional context for the room setting if necessary
        characterMemory["room"] = "a cozy, inviting space with soft lighting, warm blankets, and a homely atmosphere. The scent of rain or freshly brewed tea often fills the air, adding to the tranquility of the room.";
    }

    // Ensure gradual transition and consistency in descriptions
    let characterDescription = "a generic character";
    if (characterMemory["Haruto"]) {
        characterDescription = characterMemory["Haruto"];
    } else if (characterMemory["Kuro"]) {
        characterDescription = characterMemory["Kuro"];
    }

    // Use the environment provided in the scene or fall back to the default
    const defaultEnvironment = "near a school on a quiet afternoon, with a soft breeze rustling the leaves. The schoolyard is almost empty, except for Haruto, who finds a small kitten hiding under a bench. Later, at home, the room is warm and cozy, filled with the scent of fresh blankets and the soft patter of rain outside.";
    const sceneEnvironment = environment || defaultEnvironment;

    // Return the prompt that includes the environment for the scene setting
    return `A cinematic scene of ${description} ${sceneEnvironment}. Focus on ${characterDescription} in a calm, reflective moment. ${action ? `Action: ${action}.` : ''}`;
}
