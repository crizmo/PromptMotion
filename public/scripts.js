document.addEventListener("DOMContentLoaded", () => {
    const scriptEditor = document.getElementById("scriptEditor");
    const saveScriptButton = document.getElementById("saveScript");
    const generateButton = document.getElementById("generate");
    const stopButton = document.getElementById("stop");
    const carouselInner = document.getElementById("carouselInner");
    const videoOutput = document.getElementById("videoOutput");
    const styleDropdown = document.getElementById("styleDropdown");
    const progressBar = document.getElementById("progressBar");
    const progressPercentage = document.getElementById("progressPercentage");
    const popup = document.getElementById("popup");
    const popupImage = document.getElementById("popupImage");
    const popupClose = document.getElementById("popupClose");
    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");
    const darkModeSwitch = document.getElementById("darkModeSwitch");

    const socket = io();
    let currentIndex = 0;
    let isGenerating = false;
    let generatedImages = []; // Store references to all generated images

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
        if (isGenerating) return;

        isGenerating = true;
        generatedImages = []; // Reset generated images array
        stopButton.disabled = false;
        generateButton.disabled = true;
        carouselInner.innerHTML = ""; // Clear previous images
        videoOutput.src = ""; // Clear previous video
        progressBar.style.width = "0%"; // Reset progress bar
        progressPercentage.textContent = "0%"; // Reset percentage text

        // Add initial placeholder boxes
        for (let i = 0; i < 4; i++) {
            const placeholderBox = document.createElement("div");
            placeholderBox.className = "carousel-item placeholder-box";
            placeholderBox.textContent = "Generating...";
            carouselInner.appendChild(placeholderBox);
        }

        socket.emit("generate");

        socket.off("progress");
        socket.off("complete");
        socket.off("stopped");
        socket.off("error");

        socket.on("progress", (data) => {
            if (data.imagePath) {
                // Store image reference
                generatedImages.push(data.imagePath);
                
                // Only render images near the current view
                updateCarouselImages();
                
                // Update progress bar and percentage text
                const progress = ((data.index + 1) / data.total) * 100;
                progressBar.style.width = `${progress}%`;
                progressPercentage.textContent = `${Math.round(progress)}%`;
                
                // If this was an error frame, show a warning indicator
                if (data.error) {
                    const errorNotice = document.createElement("div");
                    errorNotice.className = "error-notice";
                    errorNotice.textContent = "Frame retried due to content filter";
                    document.querySelector(".progress-bar-container").appendChild(errorNotice);
                    
                    // Remove the notice after 3 seconds
                    setTimeout(() => {
                        if (errorNotice.parentNode) {
                            errorNotice.parentNode.removeChild(errorNotice);
                        }
                    }, 3000);
                }
            }
        });

        socket.on("complete", (data) => {
            if (data.video) {
                // Display final video
                videoOutput.src = data.video;
                progressBar.style.width = "100%"; // Complete progress bar
                progressPercentage.textContent = "100%";
            }
            isGenerating = false;
            stopButton.disabled = true;
            generateButton.disabled = false;
        });

        socket.on("stopped", () => {
            isGenerating = false;
            stopButton.disabled = true;
            generateButton.disabled = false;
            alert("Generation process stopped.");

            // Clear the carousel and progress bar
            carouselInner.innerHTML = "";
            progressBar.style.width = "0%";
            progressPercentage.textContent = "0%";
            generatedImages = [];
        });

        socket.on("error", (message) => {
            alert(message);
            isGenerating = false;
            stopButton.disabled = true;
            generateButton.disabled = false;
        });
    });

    // Stop the generation process
    stopButton.addEventListener("click", () => {
        if (!isGenerating) return;

        socket.emit("stop");
        isGenerating = false;
        stopButton.disabled = true;
        generateButton.disabled = false;
    });

    // Carousel controls
    prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    nextButton.addEventListener("click", () => {
        const maxPages = Math.ceil(generatedImages.length / 4);
        if (currentIndex < maxPages - 1) {
            currentIndex++;
            updateCarousel();
        }
    });

    // Update carousel position without reloading all images
    function updateCarousel() {
        updateCarouselImages();
        const offset = -currentIndex * 100;
        carouselInner.style.transform = `translateX(${offset}%)`;
    }

    // Efficiently load only images that are currently visible or nearby
    function updateCarouselImages() {
        // Clear current carousel
        carouselInner.innerHTML = "";
        
        // Calculate which images should be visible
        const startIdx = Math.max(0, currentIndex * 4 - 4); // Include previous page
        const endIdx = Math.min(generatedImages.length, (currentIndex + 2) * 4); // Include next page
        
        // Create placeholders for all images
        for (let i = 0; i < generatedImages.length; i++) {
            const carouselItem = document.createElement("div");
            carouselItem.className = "carousel-item";
            
            // Only load images that are in view or nearby
            if (i >= startIdx && i < endIdx) {
                const img = document.createElement("img");
                img.src = generatedImages[i];
                img.loading = "lazy"; // Use browser's lazy loading
                img.addEventListener("click", () => {
                    popupImage.src = generatedImages[i];
                    popup.style.display = "block";
                });
                carouselItem.appendChild(img);
            } else {
                // Use placeholder for images that are far from current view
                carouselItem.classList.add("placeholder-box");
                carouselItem.textContent = `Frame ${i+1}`;
                carouselItem.dataset.imageIndex = i; // Store index for later loading
            }
            
            carouselInner.appendChild(carouselItem);
        }
        
        // Add placeholder boxes if there are no images yet
        if (generatedImages.length === 0) {
            for (let i = 0; i < 4; i++) {
                const placeholderBox = document.createElement("div");
                placeholderBox.className = "carousel-item placeholder-box";
                placeholderBox.textContent = "Generating...";
                carouselInner.appendChild(placeholderBox);
            }
        }
        
        // Update carousel buttons state
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= Math.ceil(generatedImages.length / 4) - 1;
    }

    // Close the popup when the close button is clicked
    popupClose.addEventListener("click", () => {
        popup.style.display = "none";
    });

    // Close the popup when clicking outside of the image
    window.addEventListener("click", (event) => {
        if (event.target === popup) {
            popup.style.display = "none";
        }
    });

    // Toggle dark mode
    darkModeSwitch.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        document.querySelector("header").classList.toggle("dark-mode");
        document.querySelector(".editor").classList.toggle("dark-mode");
        document.querySelector(".output").classList.toggle("dark-mode");
        scriptEditor.classList.toggle("dark-mode");
        styleDropdown.classList.toggle("dark-mode");
        saveScriptButton.classList.toggle("dark-mode");
        generateButton.classList.toggle("dark-mode");
        stopButton.classList.toggle("dark-mode");
        progressBar.classList.toggle("dark-mode");
        progressPercentage.classList.toggle("dark-mode");
        popup.classList.toggle("dark-mode");
        popupClose.classList.toggle("dark-mode");
        prevButton.classList.toggle("dark-mode");
        nextButton.classList.toggle("dark-mode");
    });
});