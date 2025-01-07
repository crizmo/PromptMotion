
# PromptMotion

PromptMotion is a powerful tool that generates smooth, cinematic animations based on script-based descriptions. The generated animations are composed of frames that bring your story to life, capturing emotional moments with characters and scenes. PromptMotion is perfect for creating animated videos from custom-written scripts, bringing art and stories together seamlessly.

## Features

- **Script-based Animation**: Provide a script describing your scenes, and PromptMotion will generate corresponding visuals for each scene.
- **Character Memory**: Characters are recognized and remembered across scenes, ensuring consistency in visual representation.
- **Customization**: Customize prompts and scene descriptions to tailor the animation style.
- **Seamless Transitions**: The generated animations flow smoothly from one scene to the next, capturing the essence of cinematic storytelling.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/crizmo/PromptMotion.git
   cd PromptMotion
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   TOGETHER_API_KEY=your_api_key
   ```

4. Run the application:
   ```
   node main.js
   ```

## Usage

- Write your script in a natural, descriptive language. Edit the scripts/script.json file to add your script.
- Let PromptMotion handle the rest—generating prompts, creating images, and assembling the video.

### Example Script:
```text
The sun sets over the tranquil beach, painting the sky in hues of orange and pink. 
A gentle breeze rustles the palm trees as the waves softly lap against the shore.
```

## Contributing

Feel free to fork this project and make contributions! To suggest new features or report issues, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
