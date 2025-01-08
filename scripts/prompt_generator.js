import nlp from 'compromise';

const characterMemory = {};

export default function generatePrompt(scene) {
    const { description, action, environment } = scene;

    // Use NLP to analyze the description and action
    const doc = nlp(description + ' ' + action);

    // Extract entities and key phrases
    const characters = doc.people().out('array');
    const places = doc.places().out('array');
    const actions = doc.verbs().out('array');

    // Update character memory based on the description
    characters.forEach(character => {
        if (character === "Haruto") {
            characterMemory["Haruto"] = "a young anime boy age 20 with short, messy dark hair and kind, gentle eyes. Haruto has a warm, caring nature, always looking out for others. His bond with the kitten grows stronger each day as he provides it with love and care.";
        }
        if (character === "kitten") {
            characterMemory["kitten"] = "a tiny, black kitten";
        }
    });

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
        Action: ${actions.join(', ') || 'No specific action in this scene.'}
    `;
}