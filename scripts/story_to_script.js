import fs from "fs";
import path from "path";
import nlp from "compromise";

export default function generateScriptFromStory(story, style) {
    const doc = nlp(story);

    // Split the story into sentences
    const sentences = doc.sentences().out('array');

    // Generate scenes from sentences
    const scenes = sentences.map((sentence, index) => {
        const doc = nlp(sentence);
        const description = doc.sentences().out('text');
        const action = doc.verbs().out('text');
        const characters = doc.people().out('array');
        const places = doc.places().out('array');
        const environment = places.length > 0 ? places.join(', ') : "Default environment description";

        // Generate a more detailed description
        const detailedDescription = generateDetailedDescription(description, characters, action, environment);

        // Split long sentences into shorter ones for subtitles
        const subtitle = splitSubtitle(sentence);

        return {
            description: detailedDescription,   
            action: action,
            environment: environment,
            style: style,
            subtitle: subtitle
        };
    });

    // Write the scenes to script.json
    const scriptFilePath = path.resolve('script.json');
    fs.writeFileSync(scriptFilePath, JSON.stringify(scenes, null, 2));
    console.log(`Script generated and saved to ${scriptFilePath}`);
}

function generateDetailedDescription(description, characters, action, environment) {
    let detailedDescription = description;

    if (characters.length > 0) {
        detailedDescription += ` The characters involved are: ${characters.join(', ')}.`;
    }

    if (action) {
        detailedDescription += ` The main actions are: ${action}.`;
    }

    if (environment) {
        detailedDescription += ` The scene takes place in: ${environment}.`;
    }

    return detailedDescription;
}

function splitSubtitle(sentence) {
    const maxLength = 50; // Reduce the maximum length for a subtitle
    if (sentence.length <= maxLength) {
        return sentence;
    }

    const words = sentence.split(' ');
    let subtitle = '';
    let currentLength = 0;

    for (const word of words) {
        if (currentLength + word.length + 1 > maxLength) {
            subtitle += '\n';
            currentLength = 0;
        }
        subtitle += (currentLength === 0 ? '' : ' ') + word;
        currentLength += word.length + 1;
    }

    return subtitle;
}