import nlp from 'compromise';

const characterMemory = {};

export default function generatePrompt(scene) {
    const { description, action, environment, style } = scene;
    // console.log("Generating prompt for scene:", scene);

    // Use NLP to analyze the description and action
    const doc = nlp(description + ' ' + action);

    // Extract entities and key phrases
    const characters = doc.people().out('array');
    const places = doc.places().out('array');
    // const actions = doc.verbs().out('array');

    // Extract character information from the description
    characters.forEach(character => {
        const characterInfoMatch = description.match(new RegExp(`${character}, (.*?)(?:\\.|$)`));
        if (characterInfoMatch) {
            characterMemory[character] = characterInfoMatch[1];
        }
    });

    // Ensure gradual transition and consistency in descriptions
    let characterDescription = "a generic character";
    characters.forEach(character => {
        if (characterMemory[character]) {
            characterDescription = `${character}, ${characterMemory[character]}`;
        }
    });

    // Generate a dynamic environment description
    let sceneEnvironment = "a generic environment";
    if (places.length > 0) {
        sceneEnvironment = `a scene set in ${places.join(', ')}`;
    } else if (environment) {
        sceneEnvironment = environment;
    } else {
        sceneEnvironment = description;
    }

    // Generate a proper English sentence
    const prompt = `In a ${style} style, the scene is described as: ${description}. The environment is ${sceneEnvironment}. The characters involved are ${characterDescription}.`;

    // console.log("Generated prompt:", prompt);

    // Return the prompt that includes all components
    return prompt;
}