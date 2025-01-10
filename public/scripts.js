document.addEventListener("DOMContentLoaded", () => {
    const scriptEditor = document.getElementById("scriptEditor");
    const saveScriptButton = document.getElementById("saveScript");
    const generateButton = document.getElementById("generate");
    const imagesContainer = document.getElementById("images");
    const videoOutput = document.getElementById("videoOutput");
    const styleDropdown = document.getElementById("styleDropdown");

    // Load the script from the server
    fetch("/story.txt")
        .then(response => response.text())
        .then(text => {
            scriptEditor.value = text;
        });

    // Save the script to the server
    saveScriptButton.addEventListener("click", () => {
        const script = scriptEditor.value;
        const style = styleDropdown.value;
        fetch("/save-script", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ script, style })
        }).then(response => {
            if (response.ok) {
                alert("Script saved successfully!");
            } else {
                alert("Failed to save script.");
            }
        });
    });

    // Generate images and video
    generateButton.addEventListener("click", () => {
        fetch("/generate")
            .then(response => response.json())
            .then(data => {
                // Display generated images
                imagesContainer.innerHTML = "";
                data.images.forEach(imagePath => {
                    const img = document.createElement("img");
                    img.src = imagePath;
                    imagesContainer.appendChild(img);
                });

                // Display final video
                videoOutput.src = data.video;
            });
    });
});