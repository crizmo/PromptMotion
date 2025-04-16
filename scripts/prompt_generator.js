import nlp from 'compromise';

// Enhanced character memory with detailed physical trait tracking
const characterMemory = {};
const characterVisualDetails = {};

// Scene memory to maintain consistency across frames
const sceneMemory = {
    previousEnvironment: null,
    storyElements: [],
    visualStyle: null,
    plotProgress: [],
    cameraAngle: null,
    lighting: null,
    sceneObjects: {}
};

export default function generatePrompt(scene, index, totalScenes) {
    const { description, action, environment, style, subtitle } = scene;
    
    // Use NLP to analyze the description and action
    const doc = nlp(description + ' ' + action);

    // Extract entities and key phrases
    const characters = doc.people().out('array');
    const places = doc.places().out('array');
    const objects = doc.nouns().not(doc.people()).out('array');
    
    // Store important scene elements for continuity - prioritize keeping items from previous frame
    sceneMemory.storyElements = [...new Set([...objects, ...sceneMemory.storyElements])].slice(0, 8);
    
    // Track plot progression for storytelling continuity
    if (subtitle) {
        sceneMemory.plotProgress.push(subtitle.split('\n')[0]);
        if (sceneMemory.plotProgress.length > 3) {
            sceneMemory.plotProgress.shift(); // Keep only last 3 plot points
        }
    }
    
    // Extract and remember character information including visual details
    characters.forEach(character => {
        // Initialize character visual details if first appearance
        if (!characterVisualDetails[character]) {
            // Extract key visual elements from description
            const hairMatch = description.match(new RegExp(`${character}.*?(\\w+\\s+hair|hair\\s+\\w+)`, 'i'));
            const eyesMatch = description.match(new RegExp(`${character}.*?(\\w+\\s+eyes|eyes\\s+\\w+)`, 'i'));
            const clothingMatch = description.match(new RegExp(`${character}.*?(wearing|dressed in)\\s+([^.,]+)`, 'i'));
            const ageMatch = description.match(new RegExp(`${character}.*?(young|old|middle-aged|teenage|elderly)`, 'i'));

            characterVisualDetails[character] = {
                hair: hairMatch ? hairMatch[1] : "distinctive hair",
                eyes: eyesMatch ? eyesMatch[1] : "expressive eyes",
                clothing: clothingMatch ? clothingMatch[2] : "characteristic clothing",
                age: ageMatch ? ageMatch[1] : "indeterminate age",
                firstSeenIn: index
            };
        }

        // Update character narrative memory
        const characterInfoMatch = description.match(new RegExp(`${character}[,]? (.*?)(?:\\.|$)`));
        if (characterInfoMatch) {
            characterMemory[character] = characterMemory[character] 
                ? `${characterMemory[character]}, and now ${characterInfoMatch[1]}` 
                : characterInfoMatch[1];
        }
    });

    // Set visual style if not already set
    if (!sceneMemory.visualStyle) {
        sceneMemory.visualStyle = style || process.env.DEFAULT_STYLE || 'realistic';
    }

    // Set lighting and camera angle if not already set
    if (!sceneMemory.lighting && description.match(/(bright|dim|dark|shadowy|sunlit|moonlit|glowing)/i)) {
        const lightingMatch = description.match(/(bright|dim|dark|shadowy|sunlit|moonlit|glowing)/i);
        sceneMemory.lighting = lightingMatch ? lightingMatch[1] : null;
    }

    if (!sceneMemory.cameraAngle) {
        // Default to medium shot for character scenes, wide shot for environments
        sceneMemory.cameraAngle = characters.length > 0 ? "medium shot" : "wide shot";
    }

    // Track significant objects in the scene
    objects.forEach(object => {
        if (!sceneMemory.sceneObjects[object]) {
            sceneMemory.sceneObjects[object] = {
                firstSeen: index,
                description: description.match(new RegExp(`(the|a|an)\\s+${object}\\s+([^.,]+)`, 'i')) || object
            };
        }
    });

    // Generate detailed character descriptions with consistent visual traits
    let characterDescriptions = characters.map(character => {
        const visualDetails = characterVisualDetails[character];
        const narrative = characterMemory[character] || "";
        
        if (visualDetails) {
            return `${character} with ${visualDetails.hair}, ${visualDetails.eyes}, ${visualDetails.age}, wearing ${visualDetails.clothing}, ${narrative}`;
        }
        return character + (narrative ? `, ${narrative}` : "");
    }).join(', ') || "no specific characters";

    // Generate environment with transition from previous scene
    let sceneEnvironment;
    if (places.length > 0) {
        sceneEnvironment = `a scene set in ${places.join(', ')}`;
    } else if (environment) {
        sceneEnvironment = environment;
    } else {
        sceneEnvironment = description.split('.')[0];
    }
    
    // Create narrative continuity with environmental consistency
    let continuityContext = "";
    if (sceneMemory.previousEnvironment && sceneMemory.previousEnvironment !== sceneEnvironment) {
        continuityContext = `transitioning from ${sceneMemory.previousEnvironment} to ${sceneEnvironment}`;
    } else if (sceneMemory.previousEnvironment) {
        continuityContext = `continuing in ${sceneEnvironment}`;
    } else {
        continuityContext = `in ${sceneEnvironment}`;
    }
    
    // Remember the current environment for next frame
    sceneMemory.previousEnvironment = sceneEnvironment;

    // Calculate story progression for tone adjustment
    const progressionStage = index / totalScenes;
    let narrativeTone = 'neutral';
    if (progressionStage < 0.3) narrativeTone = 'establishing';
    else if (progressionStage < 0.7) narrativeTone = 'developing';
    else narrativeTone = 'concluding';

    // Generate object consistency strings
    const objectContinuityElements = Object.keys(sceneMemory.sceneObjects)
        .filter(obj => objects.includes(obj) || index - sceneMemory.sceneObjects[obj].firstSeen < 3)
        .map(obj => typeof sceneMemory.sceneObjects[obj].description === 'string' 
            ? sceneMemory.sceneObjects[obj].description 
            : obj)
        .join(', ');
    
    // Include previous plot elements for narrative flow
    const narrativeFlow = sceneMemory.plotProgress.length > 0
        ? `Following from: "${sceneMemory.plotProgress.join(' → ')}"` 
        : '';
    
    // Generate character continuity string for consistent appearance
    const characterContinuity = characters
        .filter(char => characterVisualDetails[char] && characterVisualDetails[char].firstSeenIn < index)
        .map(char => {
            const details = characterVisualDetails[char];
            return `${char} looks exactly the same as before with ${details.hair}, ${details.clothing}`;
        })
        .join(', ');
    
    // Use process.env for style configuration
    const styleModifier = process.env.STYLE_INTENSITY || 'strong';
    const visualQuality = process.env.VISUAL_QUALITY || 'highly detailed';
    
    // Build a comprehensive prompt with strict visual continuity guidance
    const prompt = `${sceneMemory.visualStyle} style image, ${visualQuality}, ${narrativeTone} tone. 
        ${sceneMemory.lighting ? `${sceneMemory.lighting} lighting,` : ''} ${sceneMemory.cameraAngle} view.
        Depicting: ${description}.
        ${narrativeFlow}
        The scene shows ${characterDescriptions} 
        ${continuityContext}. 
        The action happening is: ${action}.
        ${objectContinuityElements ? `With consistent objects: ${objectContinuityElements}.` : ''}
        ${characterContinuity ? `IMPORTANT FOR CONSISTENCY: ${characterContinuity}.` : ''}
        MAINTAIN EXACT consistent visual style, character appearance, and environmental elements with previous frames.`;

    return prompt.replace(/\s+/g, ' ').trim();
}