import * as THREE from 'three';

/**
 * Manages audio loading, playback, and analysis using the Web Audio API
 * integrated with Three.js (THREE.AudioListener, THREE.Audio, THREE.AudioAnalyser).
 * Also handles the file input element for loading audio.
 */
export default class AudioManager {
    /**
     * Creates an AudioManager instance.
     * @param {THREE.Camera} camera - The main scene camera to attach the AudioListener to.
     */
    constructor(camera) {
        if (!camera) {
            throw new Error('AudioManager requires a THREE.Camera instance.');
        }
        /** @type {THREE.AudioListener} Listens to audio events, needs to be attached to the camera */
        this.listener = new THREE.AudioListener();
        camera.add(this.listener); // Attach listener to the camera provided by SceneManager

        /** @type {THREE.Audio} Represents the audio source being played */
        this.sound = new THREE.Audio(this.listener);
        /** @type {THREE.AudioAnalyser | null} Analyzes the audio frequency data */
        this.audioAnalyser = null;
        /** @type {AudioContext | null} The underlying Web Audio API context */
        this.audioContext = null; 
        /** @type {MediaStreamAudioSourceNode | null} Source node for microphone input */
        this.microphoneSource = null;
        /** @type {AnalyserNode | null} The underlying Web Audio API AnalyserNode */
        this.nativeAnalyser = null;

        // Create and manage the file input element
        // REMOVED: this._createFileInput(); // Input creation moved to main.js/GuiManager
    }

    /**
     * Initializes the AudioContext if it doesn't exist or is closed.
     * Resumes the context if it's suspended.
     * @returns {Promise<AudioContext>} A promise that resolves with the active AudioContext.
     * @private
     */
    async _ensureAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.listener.context = this.audioContext; // Link listener to this context
            console.log("AudioContext created.");
        } else if (this.audioContext.state === 'suspended') {
            console.log("AudioContext suspended. Resuming...");
            await this.audioContext.resume();
            console.log("AudioContext resumed.");
        }
        return this.audioContext;
    }

    /**
     * Loads the selected audio file, decodes it, and starts playback.
     * This method is now intended to be called externally with a File object.
     * @param {File} file - The audio file to load.
     */
    loadAndPlayFile(file) { // Renamed from _handleFileUpload and takes file directly
        // const file = event.target.files[0]; // REMOVED: File comes from parameter now
        if (!file) return; // Exit if no file was provided

        // Basic validation
        if (!file.type.startsWith('audio/')) {
            console.warn('Invalid file type. Please upload an audio file.');
            alert('请上传音频文件！'); // User feedback in Chinese
            // event.target.value = null; // REMOVED: Input is managed externally
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const audioData = e.target.result; // Audio data as ArrayBuffer

            // --- Cleanup existing audio --- 
            if (this.sound.isPlaying) {
                this.sound.stop(); // Stop previous audio if playing
            }
             if (this.audioAnalyser) {
                 if (this.audioAnalyser.analyser) {
                    try {
                        // Disconnect the analyser node to prevent memory leaks
                        this.audioAnalyser.analyser.disconnect();
                    } catch (error) {
                        console.warn("Error disconnecting previous analyser:", error);
                    }
                 }
                 this.audioAnalyser = null; // Clear reference
             }

            // --- Setup Audio Context --- 
            // Reuse or create the AudioContext. Crucial for browser compatibility and resource management.
            this._setupAndPlay(audioData);
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('文件读取失败！'); // User feedback
            // event.target.value = null; // REMOVED: Input is managed externally
        };

        // Read the file contents as an ArrayBuffer
        reader.readAsArrayBuffer(file);
        // event.target.value = null; // REMOVED: Input is managed externally
    }
    
    /**
     * Sets up the THREE.Audio object with the decoded buffer, configures
     * the AudioAnalyser, and starts playback.
     * @param {ArrayBuffer} audioData - The audio data to decode and play.
     * @private
     */
    async _setupAndPlay(audioData) {
        const context = await this._ensureAudioContext(); // Ensure context is active and get it

        // --- Stop microphone if active ---
        this._disconnectMicrophone(); 

        try {
            // Decode the ArrayBuffer into an AudioBuffer
            const audioBuffer = await context.decodeAudioData(audioData);

            // --- Stop previous sound before setting new buffer ---
            if (this.sound.isPlaying) {
                this.sound.stop();
            }
             // --- Cleanup analyser before setting new buffer ---
             if (this.audioAnalyser) {
                 if (this.audioAnalyser.analyser) {
                    try {
                        // Disconnect the analyser node to prevent memory leaks or issues
                        this.audioAnalyser.analyser.disconnect();
                    } catch (error) {
                        console.warn("Error disconnecting previous analyser before decode:", error);
                    }
                 }
                 this.audioAnalyser = null; // Clear reference
             }


            this.sound.setBuffer(audioBuffer); // Assign the decoded AudioBuffer
            this.sound.setLoop(true); // Loop the audio
            this.sound.setVolume(0.5); // Set a default volume
            

            // Create a new THREE analyser for the currently playing sound
            const fftSize = 64; 
            // Use THREE.AudioAnalyser for file playback
            this.audioAnalyser = new THREE.AudioAnalyser(this.sound, fftSize); 
            // Clear native analyser reference if it exists from mic input
            this.nativeAnalyser = null; 
            console.log(`File audio decoded and playing. Analyser FFT size: ${fftSize}.`);
            
            // Start playback *after* setting up the buffer and analyser
            this.sound.play(); 

        } catch (error) {
            console.error('Error decoding audio data:', error);
            alert('无法解码音频文件！请尝试其他文件或格式。'); // User feedback
        }
    }

    /**
     * Requests microphone access, creates an audio source, and connects it for analysis.
     */
    async startMicrophoneInput() {
        try {
            await this._ensureAudioContext(); // Ensure context is active

            // --- Stop file playback if active ---
            if (this.sound && this.sound.isPlaying) {
                this.sound.stop();
                console.log("Stopped file playback for microphone input.");
            }
            // Disconnect THREE's analyser if it exists
            if (this.audioAnalyser) {
                try {
                   if (this.audioAnalyser.analyser) {
                       this.audioAnalyser.analyser.disconnect();
                   }
                } catch(e) { console.warn("Error disconnecting THREE analyser:", e);}
                this.audioAnalyser = null; 
            }
            // --- Cleanup previous microphone source ---
            this._disconnectMicrophone();


            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            console.log("Microphone access granted.");

            this.microphoneSource = this.audioContext.createMediaStreamSource(stream);
            
            // Use the native Web Audio API AnalyserNode directly for mic input
            const fftSize = 64;
            this.nativeAnalyser = this.audioContext.createAnalyser();
            this.nativeAnalyser.fftSize = fftSize;

            // Connect microphone source to the native analyser
            this.microphoneSource.connect(this.nativeAnalyser);
            
            // DO NOT connect the microphone source to the listener's destination 
            // unless you want to hear the microphone input through the speakers.
            // this.microphoneSource.connect(this.listener.context.destination); 

            console.log(`Microphone input started. Native Analyser FFT size: ${fftSize}.`);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('无法访问麦克风，请检查权限。'); // User feedback
            // Handle error (e.g., show a message to the user)
        }
    }

    /**
     * Disconnects the microphone source and analyser node if they exist.
     * @private
     */
    _disconnectMicrophone() {
        if (this.microphoneSource) {
            // Disconnect from all destinations
            this.microphoneSource.disconnect(); 
            // Stop the tracks to release the microphone
            this.microphoneSource.mediaStream.getTracks().forEach(track => track.stop());
            this.microphoneSource = null;
            console.log("Microphone source disconnected and tracks stopped.");
        }
         if (this.nativeAnalyser) {
             this.nativeAnalyser.disconnect(); // Disconnect analyser as well
             this.nativeAnalyser = null;
             console.log("Native analyser disconnected.");
         }
    }

    /**
     * Gets the average frequency value from the active AudioAnalyser (THREE or native).
     * @returns {number} The average frequency value (typically 0-255), or 0 if unavailable.
     */
    getAverageFrequency() {
        // Prioritize native analyser if mic is active
        if (this.nativeAnalyser) {
            // Need a buffer to store the frequency data
            const bufferLength = this.nativeAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.nativeAnalyser.getByteFrequencyData(dataArray); // Fill the array

            // Calculate the average
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            return sum / bufferLength;
        } 
        // Fallback to THREE's analyser if file is playing
        else if (this.audioAnalyser) {
            return this.audioAnalyser.getAverageFrequency();
        }
        return 0; // Return 0 if no analyser is active
    }

    /**
     * Loads audio from a URL, decodes it, and starts playback.
     * @param {string} url - The URL of the audio file to load.
     */
    async loadAndPlayUrl(url) {
        console.log(`Attempting to load audio from URL: ${url}`);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const audioData = await response.arrayBuffer(); // Get data as ArrayBuffer

            console.log(`Audio data fetched successfully from ${url}. Size: ${audioData.byteLength} bytes.`);

            // --- Cleanup existing audio (similar to loadAndPlayFile) ---
            if (this.sound.isPlaying) {
                this.sound.stop();
                console.log("Stopped previous sound for URL playback.");
            }
            if (this.audioAnalyser) {
                if (this.audioAnalyser.analyser) {
                   try {
                       this.audioAnalyser.analyser.disconnect();
                   } catch (error) {
                       console.warn("Error disconnecting previous analyser before URL load:", error);
                   }
                }
                this.audioAnalyser = null; 
            }
             // --- Stop microphone if active ---
             this._disconnectMicrophone(); 

            // --- Setup and Play ---
            // Use the existing private method to handle decoding and playback
             console.log("Calling _setupAndPlay for URL audio...");
            await this._setupAndPlay(audioData); 
            console.log(`Successfully started playback for ${url}.`);

        } catch (error) {
            console.error(`Error loading or playing audio from URL ${url}:`, error);
            // Optionally show a user-friendly error message
             alert(`无法从URL加载默认音频：${error.message}`);
        }
    }

    // --- Optional Playback Controls --- 
    // play() { 
    //     if (this.sound && !this.sound.isPlaying && this.sound.buffer) { 
    //          // Resume context if needed before playing
    //         if (this.audioContext && this.audioContext.state === 'suspended') {
    //             this.audioContext.resume().then(() => this.sound.play());
    //         } else {
    //              this.sound.play(); 
    //         }
    //     }
    // }
    // stop() { if (this.sound && this.sound.isPlaying) this.sound.stop(); }
    // setVolume(value) { if(this.sound) this.sound.setVolume(value); }
} 