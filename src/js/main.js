import * as THREE from 'three';
import SceneManager from './core/SceneManager';
import AudioManager from './audio/AudioManager';
import GuiManager from './gui/GuiManager';
import PostProcessor from './effects/PostProcessor';

/**
 * Main application entry point.
 * Initializes all modules (Scene, Audio, GUI, PostProcessing)
 * and runs the main animation loop.
 */

console.log('main.js loaded');

// --- Global Variables & Parameters ---

/** @type {number} Normalized mouse X position (-1 to 1, approx) */
let mouseX = 0;
/** @type {number} Normalized mouse Y position (-1 to 1, approx) */
let mouseY = 0;

// Central object to hold parameters controllable by the GUI.
// This makes it easy to pass initial values and link GUI updates.
const effectParams = {
	red: 1.0,       // Initial red color component for the shader
	green: 1.0,     // Initial green color component
	blue: 1.0,      // Initial blue color component
	threshold: 0.3, // Adjusted bloom effect threshold
	strength: 0.25,  // Adjusted bloom effect strength
	radius: 0.8,    // Initial bloom effect radius
	visualEffect: 'icosahedron' // Change default to icosahedron
};

// --- Module Instances ---
// Declare module variables in the outer scope
/** @type {SceneManager | null} */
let sceneManager = null;
/** @type {AudioManager | null} */
let audioManager = null;
/** @type {GuiManager | null} */
let guiManager = null;
/** @type {PostProcessor | null} */
let postProcessor = null;
/** @type {THREE.Clock} Used for getting delta time and elapsed time */
const clock = new THREE.Clock();
/** @type {HTMLInputElement | null} Hidden file input for audio */
let hiddenFileInput = null;

// --- Initialization Function ---
/**
 * Initializes all application modules and starts the animation loop.
 */
function init() {
    // --- Create Hidden File Input ---
    hiddenFileInput = document.createElement('input');
    hiddenFileInput.type = 'file';
    hiddenFileInput.accept = 'audio/*';
    hiddenFileInput.style.display = 'none'; // Keep it hidden
    hiddenFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && audioManager) {
            audioManager.loadAndPlayFile(file);
        }
        // Reset the input value to allow uploading the same file again
        event.target.value = null; 
    });
    document.body.appendChild(hiddenFileInput); // Add it to the DOM

    // 1. Initialize Core Scene
    sceneManager = new SceneManager(); 
    
    // 2. Initialize Audio (needs the camera from SceneManager for the listener)
    audioManager = new AudioManager(sceneManager.getCamera()); 

    // Load and play the default greeting audio
    // Using .then() because loadAndPlayUrl is async, although we don't strictly need to wait here.
    audioManager.loadAndPlayUrl('assets/multilingual_greetings.mp3')
        .then(() => console.log('Default audio playback initiated.'))
        .catch(err => console.error('Failed to initiate default audio playback:', err));
    
    // 3. Initialize Post-Processing (needs renderer, scene, camera, and initial params)
    postProcessor = new PostProcessor(
        sceneManager.getRenderer(), 
        sceneManager.getScene(), 
        sceneManager.getCamera(),
        {
            threshold: effectParams.threshold,
            strength: effectParams.strength,
            radius: effectParams.radius
        } // Pass initial bloom params
    );

    // 4. Initialize GUI
    // Define callback functions that GuiManager will call when sliders change.
    const guiCallbacks = {
        /** Updates shader color uniforms via SceneManager */
        onColorChange: (colorParams) => {
            if (sceneManager) {
                 sceneManager.updateShaderUniforms(colorParams);
            }
        },
        /** Updates bloom effect parameters via PostProcessor */
        onBloomChange: (bloomParams) => {
            if (postProcessor) {
                 postProcessor.updateParams(bloomParams);
            }
        },
        /** Switches the active visual effect via SceneManager */
        onEffectChange: (effectName) => {
            console.log('Switching effect to:', effectName);
            if (sceneManager) {
                sceneManager.setActiveEffect(effectName); 
            }
        },
        /** Triggers the hidden file input click */
        onFileUploadRequest: () => {
            if (hiddenFileInput) {
                hiddenFileInput.click();
            }
        },
        /** Triggers the microphone input start */
        onMicInputRequest: () => {
            // Call startMicrophoneInput on the audioManager instance
            // Use optional chaining and an arrow function to preserve `this` context implicitly
            if (audioManager) {
                audioManager.startMicrophoneInput(); 
            }
        }
    };
    // Create the GUI, passing the initial parameters and the callbacks
    guiManager = new GuiManager(effectParams, guiCallbacks);

    // Explicitly set the initial effect based on params
    if (sceneManager) {
        sceneManager.setActiveEffect(effectParams.visualEffect);
    }

    // 5. Setup Event Listeners
    setupEventListeners();
    
    // 6. Start the Animation Loop
    startAnimationLoop(); 
    console.log('Initialization complete.');
}

// --- Event Listeners Setup ---
/**
 * Sets up global event listeners (window resize, mouse move).
 */
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    // Add touch event listener for mobile compatibility
    document.addEventListener('touchmove', onTouchMove, { passive: false }); 
    // Note: File input is now triggered via GuiManager and handled in init()
}

/**
 * Handles window resize events.
 * Notifies relevant modules (SceneManager, PostProcessor) to update their sizes.
 */
function onWindowResize() {
    console.log('Window resized');
    if (sceneManager) {
        sceneManager.onResize(); // Updates camera aspect, renderer size
    }
    if (postProcessor) {
        postProcessor.onResize(); // Updates composer size
    }
}

/**
 * Handles mouse movement events.
 * Updates normalized mouse coordinates (mouseX, mouseY).
 * @param {MouseEvent} event
 */
function onMouseMove(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1 range approx)
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    mouseX = (event.clientX - windowHalfX) / windowHalfX; // Normalize X
    mouseY = (event.clientY - windowHalfY) / windowHalfY; // Normalize Y (inverted for typical 3D coordinate systems)
    // Adjust sensitivity/scaling if needed: e.g., mouseX /= 2;
}

/**
 * Handles touch movement events on mobile devices.
 * Updates normalized mouse coordinates (mouseX, mouseY) based on the first touch point.
 * Prevents default scroll behavior.
 * @param {TouchEvent} event
 */
function onTouchMove(event) {
    // Prevent the default touch action (like scrolling)
    event.preventDefault(); 

    if (event.touches.length > 0) {
        const touch = event.touches[0]; // Get the first touch point
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        mouseX = (touch.clientX - windowHalfX) / windowHalfX; // Normalize X
        mouseY = (touch.clientY - windowHalfY) / windowHalfY; // Normalize Y 
    }
}

// --- Animation Loop ---
/**
 * Starts the main animation loop using requestAnimationFrame.
 */
function startAnimationLoop() {
    /**
     * The main animation loop function.
     * Called recursively via requestAnimationFrame.
     */
    function animate() {
        requestAnimationFrame(animate); // Schedule the next frame

        // Calculate time delta and elapsed time for animations
        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // --- Get Input Data ---
        // Fetch the latest average audio frequency from the AudioManager
        const audioFrequency = audioManager ? audioManager.getAverageFrequency() : 0;
        
        // --- Update Modules ---
        if (sceneManager) {
            // Update scene elements (e.g., camera position based on mouse)
            sceneManager.update(deltaTime, elapsedTime, { mouseX, mouseY });
            // Pass time and audio data to update shader uniforms
            sceneManager.updateShaderUniforms({ u_time: elapsedTime, u_frequency: audioFrequency });
        }
        // AudioManager might have internal updates if needed (e.g., smoothing audio data)
        // if (audioManager) audioManager.update(deltaTime);
        // GuiManager typically doesn't need updates within the loop

        // --- Render --- 
        // Render the scene through the post-processing pipeline
        if (postProcessor) {
            postProcessor.render(); 
        } else if (sceneManager) {
            // Fallback: Render directly if post-processor failed to initialize
            sceneManager.getRenderer().render(sceneManager.getScene(), sceneManager.getCamera());
        }
    }
    animate(); // Start the loop
}

// --- Start the application --- 
// Ensure DOM is ready or run after DOMContentLoaded if necessary, though modules handle DOM appending.
init(); 