export default function parseScript(script) {
    const scenes = script.split("\n").filter(line => line.trim());
    return scenes.map((scene, index) => {
        const [description, action] = scene.split(".");
        return {
            id: index,
            description: description.trim(),
            action: action ? action.trim() : "",
        };
    });
}
