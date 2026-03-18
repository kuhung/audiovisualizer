import { GUI } from 'lil-gui';

/**
 * Manages the dat.gui interface for controlling visual parameters.
 * It takes initial parameters and callbacks to notify other modules of changes.
 */
export default class GuiManager {
    /**
     * Creates a GuiManager instance and sets up the GUI controls.
     * @param {object} params - An object containing the initial values for the GUI controls.
     * @param {object} callbacks - An object containing callback functions to execute when GUI values change.
     * @param {function(object): void} callbacks.onColorChange - Called when color parameters change.
     * @param {function(object): void} callbacks.onBloomChange - Called when bloom parameters change.
     * @param {function(string): void} callbacks.onEffectChange - Called when the visual effect selection changes.
     * @param {function(): void} callbacks.onFileUploadRequest - Called when the user clicks the upload button.
     * @param {function(): void} callbacks.onMicInputRequest - Called when the user clicks the microphone input button.
     */
    constructor(params, callbacks) {
        /** @type {GUI} The dat.gui instance */
        this.gui = new GUI();
        /** @type {object} Local copy or reference to the parameters controlled by the GUI */
        this.params = params; // Store initial parameters
        /** @type {object} Callbacks to invoke on parameter changes */
        this.callbacks = callbacks; // Store callbacks for updates

        this._setupColorControls();
        this._setupBloomControls();
        this._setupEffectControls();
        this._setupUploadControl();
        this._setupMicInputControl();
    }

    /**
     * Sets up the dat.gui controls for color parameters.
     * @private
     */
    _setupColorControls() {
        const colorsFolder = this.gui.addFolder('Colors');
        // Link GUI control for 'red' to params.red
        colorsFolder.add(this.params, 'red', 0, 1).name('Red').onChange((value) => {
            // When the slider changes, call the registered callback
            if (this.callbacks.onColorChange) {
                this.callbacks.onColorChange({ u_red: Number(value) }); // Pass updated value
            }
        });
         // Link GUI control for 'green' to params.green
        colorsFolder.add(this.params, 'green', 0, 1).name('Green').onChange((value) => {
            if (this.callbacks.onColorChange) {
                this.callbacks.onColorChange({ u_green: Number(value) });
            }
        });
         // Link GUI control for 'blue' to params.blue
        colorsFolder.add(this.params, 'blue', 0, 1).name('Blue').onChange((value) => {
            if (this.callbacks.onColorChange) {
                this.callbacks.onColorChange({ u_blue: Number(value) });
            }
        });
        // colorsFolder.open(); // Optional: Keep the folder open by default
    }

    /**
     * Sets up the dat.gui controls for bloom effect parameters.
     * @private
     */
    _setupBloomControls() {
        const bloomFolder = this.gui.addFolder('Bloom');
         // Link GUI control for 'threshold' to params.threshold
        bloomFolder.add(this.params, 'threshold', 0, 1).name('Threshold').onChange((value) => {
            if (this.callbacks.onBloomChange) {
                this.callbacks.onBloomChange({ threshold: Number(value) });
            }
        });
         // Link GUI control for 'strength' to params.strength
        bloomFolder.add(this.params, 'strength', 0, 1).name('Strength').onChange((value) => {
            if (this.callbacks.onBloomChange) {
                this.callbacks.onBloomChange({ strength: Number(value) });
            }
        });
         // Link GUI control for 'radius' to params.radius
        bloomFolder.add(this.params, 'radius', 0, 1).name('Radius').onChange((value) => {
            if (this.callbacks.onBloomChange) {
                this.callbacks.onBloomChange({ radius: Number(value) });
            }
        });
        // bloomFolder.open(); // Optional: Keep the folder open by default
    }

    /**
     * Sets up the dat.gui control for selecting the visual effect.
     * @private
     */
    _setupEffectControls() {
        // Add control directly to the main GUI, not in a folder
        this.gui.add(this.params, 'visualEffect', ['icosahedron', 'particles'])
            .name('Visual Effect')
            .onChange((value) => {
                 if (this.callbacks.onEffectChange) {
                     this.callbacks.onEffectChange(value); // Pass the selected effect name string
                 }
            });
    }

    /**
     * Sets up the dat.gui control for triggering the audio file upload.
     * @private
     */
    _setupUploadControl() {
        // Add a simple object with a function property to act as the button's action
        const uploadTrigger = {
            upload: () => {
                if (this.callbacks.onFileUploadRequest) {
                    this.callbacks.onFileUploadRequest();
                }
            }
        };
        // Add the button to the main GUI
        this.gui.add(uploadTrigger, 'upload').name('Upload Audio');
    }

    /**
     * Sets up the dat.gui control for triggering microphone input.
     * @private
     */
    _setupMicInputControl() {
        const micTrigger = {
            startMic: () => {
                if (this.callbacks.onMicInputRequest) {
                    console.log("Mic input button clicked, requesting mic input...");
                    this.callbacks.onMicInputRequest();
                }
            }
        };
        // Add the button to the main GUI
        this.gui.add(micTrigger, 'startMic').name('Use Microphone');
    }

    // Optional: Method to hide/show GUI
    // toggleVisibility() { ... }
} 