// Professional Photo Editor - Bulletproof Implementation (Fixed)
class ProPhotoEditor {
    constructor() {
        this.originalImage = null;
        this.currentCanvas = null;
        this.ctx = null;
        this.isProcessing = false;
        
        // Simple editing parameters
        this.settings = {
            brightness: 0,
            contrast: 0,
            glow: 0,
            saturation: 0,
            clarity: 0,
            shadows: 0,
            highlights: 0
        };
        
        // Preset configurations
        this.presets = {
            auto: { brightness: 10, contrast: 15, glow: 20, saturation: 5 },
            glow: { glow: 40, brightness: 5, contrast: 10 },
            bright: { brightness: 20, shadows: 25, glow: 15 }
        };
        
        this.init();
    }

    init() {
        try {
            console.log('Initializing ProPhotoEditor...');
            this.setupElements();
            this.setupEventListeners();
            console.log('ProPhotoEditor initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    setupElements() {
        // Get canvas element
        this.currentCanvas = document.getElementById('imageCanvas');
        if (this.currentCanvas) {
            this.ctx = this.currentCanvas.getContext('2d');
            console.log('Canvas initialized');
        } else {
            console.error('Canvas not found');
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // File upload - Fixed implementation
        const browseBtn = document.getElementById('browseBtn');
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (browseBtn && fileInput) {
            console.log('Setting up browse button');
            browseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Browse button clicked');
                fileInput.click();
            });
        } else {
            console.error('Browse button or file input not found');
        }

        if (fileInput) {
            console.log('Setting up file input');
            fileInput.addEventListener('change', (e) => {
                console.log('File input changed');
                if (e.target.files && e.target.files.length > 0) {
                    console.log('File selected:', e.target.files[0].name);
                    this.loadImage(e.target.files[0]);
                }
            });
        }

        if (uploadArea) {
            console.log('Setting up upload area');
            
            // Click handler for upload area
            uploadArea.addEventListener('click', (e) => {
                // Only trigger if clicking on the upload area itself, not the browse button
                if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
                    console.log('Upload area clicked');
                    if (fileInput) {
                        fileInput.click();
                    }
                }
            });

            // Drag and drop handlers
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
                console.log('File dropped');
                
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    console.log('Processing dropped file:', files[0].name);
                    this.loadImage(files[0]);
                }
            });
        }

        // Control buttons
        this.setupControlButtons();
        
        // Sliders
        this.setupSliders();

        // Preset buttons
        this.setupPresetButtons();
    }

    setupControlButtons() {
        const showOriginalBtn = document.getElementById('showOriginalBtn');
        const resetBtn = document.getElementById('resetBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        if (showOriginalBtn) {
            showOriginalBtn.addEventListener('click', () => {
                this.toggleOriginal();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAll();
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadImage();
            });
        }
    }

    setupSliders() {
        const sliders = [
            'brightnessSlider', 'contrastSlider', 'glowSlider', 
            'saturationSlider', 'claritySlider', 'shadowsSlider', 'highlightsSlider'
        ];

        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const param = sliderId.replace('Slider', '');
                    this.updateSetting(param, parseInt(e.target.value));
                });
            }
        });
    }

    setupPresetButtons() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const preset = btn.dataset.preset;
                console.log('Applying preset:', preset);
                this.applyPreset(preset);
            });
        });
    }

    showLoading(show) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            if (show) {
                loader.classList.remove('hidden');
            } else {
                loader.classList.add('hidden');
            }
        }
    }

    async loadImage(file) {
        if (this.isProcessing) {
            console.log('Already processing, ignoring new request');
            return;
        }
        
        console.log('Loading image:', file.name);
        
        try {
            this.isProcessing = true;
            this.showLoading(true);

            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file (JPG, PNG, WebP)');
            }

            // Create image element
            const img = new Image();
            
            // Load image with promise
            console.log('Creating image URL...');
            const imageUrl = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log('Image loaded successfully:', img.width, 'x', img.height);
                    resolve();
                };
                img.onerror = () => {
                    console.error('Failed to load image');
                    reject(new Error('Failed to load image'));
                };
                img.src = imageUrl;
            });

            // Store original image
            this.originalImage = img;

            // Set up canvas
            this.setupCanvas(img);

            // Draw original image
            this.drawImage(img);

            // Quick analysis
            this.performQuickAnalysis();

            // Show editor
            this.showEditor();

            // Clean up
            URL.revokeObjectURL(imageUrl);
            console.log('Image processing complete');

        } catch (error) {
            console.error('Error loading image:', error);
            alert(error.message || 'Error loading image. Please try another file.');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    setupCanvas(img) {
        if (!this.currentCanvas || !this.ctx) {
            console.error('Canvas not available');
            return;
        }

        console.log('Setting up canvas for image:', img.width, 'x', img.height);

        // Calculate display size
        const maxWidth = 800;
        const maxHeight = 500;
        
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        if (ratio < 1) {
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        this.currentCanvas.width = width;
        this.currentCanvas.height = height;
        this.currentCanvas.style.width = width + 'px';
        this.currentCanvas.style.height = height + 'px';
        
        console.log('Canvas setup complete:', width, 'x', height);
    }

    drawImage(img = this.originalImage) {
        if (!img || !this.ctx) {
            console.error('Cannot draw image - missing image or context');
            return;
        }

        try {
            this.ctx.clearRect(0, 0, this.currentCanvas.width, this.currentCanvas.height);
            this.ctx.drawImage(img, 0, 0, this.currentCanvas.width, this.currentCanvas.height);
            console.log('Image drawn to canvas');
        } catch (error) {
            console.error('Error drawing image:', error);
        }
    }

    performQuickAnalysis() {
        if (!this.ctx) {
            console.error('Cannot perform analysis - no context');
            return;
        }

        try {
            const imageData = this.ctx.getImageData(0, 0, this.currentCanvas.width, this.currentCanvas.height);
            const data = imageData.data;
            
            let totalBrightness = 0;
            const pixelCount = data.length / 4;

            // Simple brightness analysis
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                totalBrightness += brightness;
            }

            const avgBrightness = totalBrightness / pixelCount;
            console.log('Analysis complete - average brightness:', avgBrightness);

            // Update analysis display
            this.updateAnalysisDisplay(avgBrightness);

        } catch (error) {
            console.error('Analysis error:', error);
        }
    }

    updateAnalysisDisplay(brightness) {
        const brightnessEl = document.getElementById('brightnessValue');
        const contrastEl = document.getElementById('contrastValue');
        const sharpnessEl = document.getElementById('sharpnessValue');

        if (brightnessEl) {
            if (brightness < 85) {
                brightnessEl.textContent = 'Dark';
            } else if (brightness > 170) {
                brightnessEl.textContent = 'Bright';
            } else {
                brightnessEl.textContent = 'Good';
            }
        }

        if (contrastEl) {
            contrastEl.textContent = 'Normal';
        }

        if (sharpnessEl) {
            sharpnessEl.textContent = 'Sharp';
        }

        console.log('Analysis display updated');
    }

    showEditor() {
        const uploadSection = document.getElementById('uploadSection');
        const editorSection = document.getElementById('editorSection');

        if (uploadSection) {
            uploadSection.classList.add('hidden');
            console.log('Upload section hidden');
        }
        
        if (editorSection) {
            editorSection.classList.remove('hidden');
            console.log('Editor section shown');
        }
    }

    updateSetting(param, value) {
        this.settings[param] = value;
        console.log('Updated setting:', param, '=', value);
        
        // Update value display
        const slider = document.getElementById(param + 'Slider');
        if (slider) {
            const valueDisplay = slider.parentElement.querySelector('.value-display');
            if (valueDisplay) {
                valueDisplay.textContent = value > 0 ? `+${value}` : value;
            }
        }

        // Apply effects with debounce
        this.debounceApplyEffects();
    }

    debounceApplyEffects() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.applyEffects();
        }, 16); // ~60fps
    }

    applyEffects() {
        if (!this.originalImage || !this.ctx || this.isProcessing) return;

        try {
            // Draw original image first
            this.drawImage();

            // Get image data
            const imageData = this.ctx.getImageData(0, 0, this.currentCanvas.width, this.currentCanvas.height);
            const data = imageData.data;

            // Apply effects
            this.applyBrightnessContrast(data);
            this.applyGlow(data);
            this.applySaturation(data);
            this.applyShadowHighlight(data);

            // Put processed data back
            this.ctx.putImageData(imageData, 0, 0);

        } catch (error) {
            console.error('Error applying effects:', error);
        }
    }

    applyBrightnessContrast(data) {
        const brightness = this.settings.brightness * 2.55;
        const contrast = this.settings.contrast !== 0 ? (259 * (this.settings.contrast + 255)) / (255 * (259 - this.settings.contrast)) : 1;

        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            if (brightness !== 0) {
                data[i] = Math.max(0, Math.min(255, data[i] + brightness));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
            }

            // Apply contrast
            if (contrast !== 1) {
                data[i] = Math.max(0, Math.min(255, contrast * (data[i] - 128) + 128));
                data[i + 1] = Math.max(0, Math.min(255, contrast * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.max(0, Math.min(255, contrast * (data[i + 2] - 128) + 128));
            }
        }
    }

    applyGlow(data) {
        if (this.settings.glow === 0) return;

        const glowIntensity = this.settings.glow / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply glow based on brightness
            if (luminance > 80) {
                const glowFactor = (luminance / 255) * glowIntensity;
                data[i] = Math.min(255, r + r * glowFactor * 0.4);
                data[i + 1] = Math.min(255, g + g * glowFactor * 0.4);
                data[i + 2] = Math.min(255, b + b * glowFactor * 0.4);
            }
        }
    }

    applySaturation(data) {
        if (this.settings.saturation === 0) return;

        const saturation = 1 + this.settings.saturation / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            data[i] = Math.max(0, Math.min(255, gray + (r - gray) * saturation));
            data[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * saturation));
            data[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * saturation));
        }
    }

    applyShadowHighlight(data) {
        const shadowAdjust = this.settings.shadows * 2.0;
        const highlightAdjust = this.settings.highlights * 2.0;

        if (shadowAdjust === 0 && highlightAdjust === 0) return;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

            // Apply shadow adjustment to darker areas
            if (shadowAdjust !== 0 && luminance < 128) {
                const shadowMask = (128 - luminance) / 128;
                const adjustment = shadowAdjust * shadowMask;
                data[i] = Math.max(0, Math.min(255, r + adjustment));
                data[i + 1] = Math.max(0, Math.min(255, g + adjustment));
                data[i + 2] = Math.max(0, Math.min(255, b + adjustment));
            }

            // Apply highlight adjustment to brighter areas
            if (highlightAdjust !== 0 && luminance > 128) {
                const highlightMask = (luminance - 128) / 127;
                const adjustment = highlightAdjust * highlightMask;
                data[i] = Math.max(0, Math.min(255, r + adjustment));
                data[i + 1] = Math.max(0, Math.min(255, g + adjustment));
                data[i + 2] = Math.max(0, Math.min(255, b + adjustment));
            }
        }
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.error('Preset not found:', presetName);
            return;
        }

        console.log('Applying preset:', presetName, preset);

        // Reset first
        Object.keys(this.settings).forEach(key => {
            this.settings[key] = 0;
        });

        // Apply preset values
        Object.keys(preset).forEach(key => {
            this.settings[key] = preset[key];
        });

        // Update sliders
        this.updateSliderValues();

        // Apply effects
        this.applyEffects();
    }

    updateSliderValues() {
        Object.keys(this.settings).forEach(key => {
            const slider = document.getElementById(key + 'Slider');
            if (slider) {
                slider.value = this.settings[key];
                const valueDisplay = slider.parentElement.querySelector('.value-display');
                if (valueDisplay) {
                    const value = this.settings[key];
                    valueDisplay.textContent = value > 0 ? `+${value}` : value;
                }
            }
        });
    }

    toggleOriginal() {
        const btn = document.getElementById('showOriginalBtn');
        const canvas = this.currentCanvas;

        if (!btn || !canvas) return;

        if (btn.textContent === 'Show Original') {
            btn.textContent = 'Show Enhanced';
            this.drawImage(); // Show original
        } else {
            btn.textContent = 'Show Original';
            this.applyEffects(); // Show enhanced
        }
    }

    resetAll() {
        console.log('Resetting all settings');
        
        // Reset all settings
        Object.keys(this.settings).forEach(key => {
            this.settings[key] = 0;
        });

        // Update sliders
        this.updateSliderValues();

        // Redraw original
        this.drawImage();
    }

    downloadImage() {
        if (!this.currentCanvas) {
            console.error('No canvas available for download');
            return;
        }

        try {
            console.log('Downloading enhanced image...');
            
            // Make sure we have the enhanced image
            this.applyEffects();

            // Create download link
            const link = document.createElement('a');
            link.download = `enhanced_photo_${Date.now()}.png`;
            link.href = this.currentCanvas.toDataURL('image/png', 0.9);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Download initiated');

        } catch (error) {
            console.error('Download error:', error);
            alert('Error downloading image. Please try again.');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing photo editor...');
    try {
        window.photoEditor = new ProPhotoEditor();
        console.log('Photo editor initialization complete');
    } catch (error) {
        console.error('Failed to initialize photo editor:', error);
        alert('Failed to initialize photo editor. Please refresh the page.');
    }
});