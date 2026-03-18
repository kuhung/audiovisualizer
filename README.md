# 3D Audio Visualizer

Based on the tutorial "How To Create A 3D Audio Visualizer Using Three.js" by WaelYasmina: https://youtu.be/qDIF2z_VtHs

This project demonstrates a 3D audio visualizer built with Three.js, WebGL shaders, and the Web Audio API. It has been refactored into a modular structure for better maintainability and understanding.

A Chinese version of this README is available at [README_zh.md](README_zh.md).

🎮 [Live Demo](https://av.kuhungio.me/)

![Online Example](online_example.gif)

## Features

* Real-time 3D visualization reacting to audio frequency.
* **New:** Particle effect simulating water ripples, particles generate from the center and spread outward based on audio frequency.
* Uses Perlin noise in the vertex shader for mesh displacement.
* Applies a Bloom post-processing effect.
* Allows users to upload their own audio files.
* Interactive controls for color and bloom parameters via dat.gui.

## Tech Stack

* **Three.js** - 3D graphics rendering
* **Web Audio API** - Audio processing and analysis
* **WebGL Shaders** - GLSL shaders for visual effects
* **dat.GUI** - Interactive control interface
* **Parcel** - Project bundling and building

## Project Structure

```
audiovisualizer/
├── dist/              # Build output directory
├── src/
│   ├── js/
│   │   ├── core/      # Core Three.js setup (SceneManager)
│   │   ├── audio/     # Audio loading and analysis (AudioManager)
│   │   ├── effects/   # Post-processing effects (PostProcessor)
│   │   ├── gui/       # UI controls (GuiManager)
│   │   └── main.js    # Main application entry point & loop
│   ├── shaders/     # GLSL shader files (vertex.glsl, fragment.glsl)
│   └── index.html     # Main HTML file
├── static/            # Static assets (if any)
├── .gitignore
├── .parcelrc          # Parcel bundler configuration
├── package.json       # Project dependencies and scripts
└── README.md          # This file
```

## Key Modules

* **`main.js`**: Initializes all modules, manages the main animation loop, and coordinates interactions between modules.
* **`core/SceneManager.js`**: Sets up the Three.js scene, camera, renderer, and the main visualizer mesh (Icosahedron). Manages shader uniforms.
* **`audio/AudioManager.js`**: Handles audio file uploads, decoding, playback using the Web Audio API, and real-time frequency analysis via `THREE.AudioAnalyser`.
* **`gui/GuiManager.js`**: Creates the `dat.gui` interface for controlling visual parameters (colors, bloom effect).
* **`effects/PostProcessor.js`**: Manages the post-processing pipeline using `THREE.EffectComposer`, including the `UnrealBloomPass`.
* **`shaders/vertex.glsl`**: Vertex shader implementing Perlin noise for mesh displacement based on time and audio frequency.
* **`shaders/fragment.glsl`**: Simple fragment shader applying colors based on uniforms.

## Setup and Running

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```
2. **Run the development server:**

   ```bash
   npm start
   # or
   yarn start
   ```

   This will start the Parcel development server and open the visualizer in your default browser.
3. **Build for production:**

   ```bash
   npm run build
   # or
   yarn build
   ```

   This will create an optimized build in the `dist/` directory.

## Usage

* Click the "Choose File" button to upload an audio file (e.g., MP3, WAV).
* Use the controls in the top-right corner (dat.gui panel) to adjust the colors and the intensity/radius/threshold of the bloom effect.
* Move the mouse to slightly change the camera angle.

### Parameter Adjustment Guide

* **Color Settings**

  - Background Color: Adjust the scene background color
  - Primary Color: Adjust the main color of the visualization mesh
  - Secondary Color: Adjust the color of particle effects
* **Bloom Effect**

  - Intensity: Control the overall strength of the bloom effect
  - Radius: Control the spread range of the bloom effect
  - Threshold: Control the brightness threshold for bloom effect

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

* [WaelYasmina](https://www.youtube.com/@WaelYasmina) - Original tutorial creator
* [Three.js](https://threejs.org/) - 3D graphics library
* [dat.GUI](https://github.com/dataarts/dat.gui) - Lightweight UI controls library
