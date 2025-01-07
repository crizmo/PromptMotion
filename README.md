
# PromptMotion

PromptMotion is a powerful AI-powered tool that generates multiple frames from script-based descriptions. These frames, when combined, create a story-driven animation sequence, capturing emotional moments with characters and scenes. PromptMotion is ideal for creating animated videos from custom-written scripts, bringing art and storytelling together in a unique way.

## Features

- **Script-based Animation**: Provide a script describing your scenes, and PromptMotion will generate corresponding visuals for each scene.
- **Character Memory**: Characters are recognized and remembered across scenes, ensuring consistency in visual representation.
- **Customization**: Customize prompts and scene descriptions to tailor the animation style.
- **Frame-Based Storytelling**: The generated frames, when compiled together, create a seamless flow that tells your story in an animated format.

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/crizmo/PromptMotion.git
   cd PromptMotion
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory and add your API keys:
   ```bash
   TOGETHER_API_KEY=your_api_key
   ```

4. **Run the application**:
   ```bash
   node main.js
   ```

## Usage

1. **Write Your Script**:
   - Write your script in a natural, descriptive language. Edit the `script.json` file to add your script.
   - Example script:
     ```json
     [
         {
             "description": "Scene description here.",
             "action": "Action happening in the scene.",
             "subtitle": "Subtitle for the scene."
         }
     ]
     ```

2. **Generate Prompts and Images**:
   - The application will generate prompts based on the script and create images for each scene.

3. **Assemble the Video**:
   - The generated images will be assembled into a video with optional subtitles and background music.

## Dependencies

- **compromise**: Natural language processing (NLP) library for JavaScript.
- **Together API**: API for generating images based on text descriptions.
- **ffmpeg**: Tool for assembling images into videos.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Feel free to fork this project and make contributions! To suggest new features or report issues, please open an issue or submit a pull request.