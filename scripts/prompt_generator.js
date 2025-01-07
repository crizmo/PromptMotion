const characterMemory = {};

export default function generatePrompt(scene) {
    const { description, action, environment } = scene;

    // Update character memory based on the description
    if (description.includes("Haruto")) {
        characterMemory["Haruto"] = "a young anime boy with short, messy dark hair and kind, gentle eyes. Haruto has a warm, caring nature, always looking out for others. His bond with the kitten, kitten, grows stronger each day as he provides it with love and care.";
    }
    if (description.includes("kitten")) {
        characterMemory["kitten"] = "a tiny, black kitten with golden eyes. kitten is initially wary but quickly becomes playful and affectionate toward Haruto. Despite its small size, kitten's curiosity and energy are endless.";
    }
    if (description.includes("room")) {
        characterMemory["room"] = "a cozy, inviting space with soft lighting, warm blankets, and a homely atmosphere. The scent of rain or freshly brewed tea often fills the air, adding to the tranquility of the room.";
    } 
    if(description.includes("home")) {
        characterMemory["home"] = "a comfortable, welcoming place filled with memories and warmth. The walls are adorned with photos and artwork, reflecting the character's personality and interests. The home is a sanctuary, a place of peace and solace.";
    }

    // Ensure gradual transition and consistency in descriptions
    let characterDescription = "a generic character";
    if (characterMemory["Haruto"]) {
        characterDescription = characterMemory["Haruto"];
    } else if (characterMemory["kitten"]) {
        characterDescription = characterMemory["kitten"];
    }

    // Use the environment provided in the scene or fall back to the default
    const defaultEnvironment = "near a school on a quiet afternoon, with a soft breeze rustling the leaves. The schoolyard is almost empty, except for Haruto, who finds a small kitten hiding under a bench. Later, at home, the room is warm and cozy, filled with the scent of fresh blankets and the soft patter of rain outside.";
    const sceneEnvironment = environment || defaultEnvironment;

    // Return the prompt that includes all components
    return `
        Scene:
        Description: ${description}
        Environment: ${sceneEnvironment}
        Characters: ${characterDescription}
        Action: ${action ? action : 'No specific action in this scene.'}
    `;
}
