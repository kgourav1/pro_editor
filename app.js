// Professional Photo Editor JavaScript - Fixed Version
class ProPhotoEditor {
    constructor() {
        this.originalImageData = null;
        this.currentImageData = null;
        this.analysisData = null;
        this.suggestions = [];
        this.editingParams = {
            brightness: 0,
            contrast: 0,
            shadows: 0,
            highlights: 0,
            saturation: 0,
            vibrance: 0,
            temperature: 0,
            tint: 0,
            glow: 0,
            glowRadius: 5,
            clarity: 0,
            noiseReduction: 0
        };
        
        this.presets = {
            portrait: { brightness: 10, contrast: 15, glow: 20, clarity: 10, shadows: 25, highlights: -15 },
            landscape: { brightness: 5, contrast: 20, glow: 15, clarity: 25, vibrance: 20, saturation: 10 },
            lowlight: { brightness: 25, shadows: 40, glow: 30, clarity: 15, contrast: 10, noiseReduction: 20 }
        };
        
        this.thresholds = {
            brightness: { underexposed: 80, optimal: 128, overexposed: 200 },
            contrast: { low: 30, optimal: 60, high: 100 },
            sharpness: { blurry: 50, acceptable: 100, sharp: 200 }
        };
        
        this.init();
    }

    init() {
        console.log('Initializing ProPhotoEditor...');
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setupSliders();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Upload area clicked');
                fileInput.click();
            });
            
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));

            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Analysis
        const applySuggestionsBtn = document.getElementById('applySuggestionsBtn');
        if (applySuggestionsBtn) {
            applySuggestionsBtn.addEventListener('click', this.applySuggestions.bind(this));
        }

        // Edit controls
        const toggleComparison = document.getElementById('toggleComparison');
        const resetEdits = document.getElementById('resetEdits');
        
        if (toggleComparison) {
            toggleComparison.addEventListener('click', this.toggleComparison.bind(this));
        }
        
        if (resetEdits) {
            resetEdits.addEventListener('click', this.resetEdits.bind(this));
        }

        // Export
        const qualitySlider = document.getElementById('qualitySlider');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (qualitySlider) {
            qualitySlider.addEventListener('input', this.updateQualityDisplay.bind(this));
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        }
    }

    setupTabNavigation() {
        console.log('Setting up tab navigation...');
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!btn.disabled) {
                    console.log('Switching to tab:', btn.dataset.tab);
                    this.switchTab(btn.dataset.tab);
                }
            });
        });
    }

    setupSliders() {
        const sliders = document.querySelectorAll('.edit-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', this.handleSliderChange.bind(this));
        });
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.upload-area').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.upload-area').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = e.target.closest('.upload-area');
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files.length);
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        console.log('File selected:', file?.name);
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        console.log('Processing file:', file.name, file.type);
        
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        this.showLoading(true);

        try {
            const img = await this.loadImage(file);
            console.log('Image loaded:', img.width, 'x', img.height);
            
            this.originalImageData = this.getImageData(img);
            this.currentImageData = this.cloneImageData(this.originalImageData);

            // Analyze the image
            this.analysisData = this.analyzeImage(this.originalImageData);
            console.log('Image analyzed:', this.analysisData);
            
            // Display analysis
            this.displayAnalysis(img);
            this.generateSuggestions();

            // Enable tabs and switch to analysis
            this.enableTab('analyze');
            this.enableTab('edit');
            this.enableTab('export');
            this.switchTab('analyze');

        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing the image. Please try another file.');
        } finally {
            this.showLoading(false);
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('Failed to load image'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    getImageData(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Maintain aspect ratio while limiting size for performance
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height);
    }

    cloneImageData(imageData) {
        return new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
    }

    analyzeImage(imageData) {
        const data = imageData.data;
        const pixels = data.length / 4;
        
        let totalR = 0, totalG = 0, totalB = 0;
        let minLum = 255, maxLum = 0;
        const histogram = new Array(256).fill(0);
        
        // Calculate histogram and basic metrics
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalR += r;
            totalG += g;
            totalB += b;
            
            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            histogram[luminance]++;
            
            minLum = Math.min(minLum, luminance);
            maxLum = Math.max(maxLum, luminance);
        }
        
        const avgBrightness = Math.round((totalR + totalG + totalB) / (3 * pixels));
        const dynamicRange = maxLum - minLum;
        
        // Calculate contrast
        let variance = 0;
        const avgLum = (totalR + totalG + totalB) / (3 * pixels);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            variance += Math.pow(luminance - avgLum, 2);
        }
        const contrast = Math.sqrt(variance / pixels);
        
        // Calculate sharpness
        const sharpness = this.calculateSharpness(imageData);
        
        return {
            brightness: avgBrightness,
            contrast: Math.round(contrast),
            dynamicRange,
            sharpness: Math.round(sharpness),
            histogram,
            totalPixels: pixels
        };
    }

    calculateSharpness(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        let laplacianSum = 0;
        let count = 0;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                
                // Simple Laplacian
                const top = 0.299 * data[((y-1) * width + x) * 4] + 0.587 * data[((y-1) * width + x) * 4 + 1] + 0.114 * data[((y-1) * width + x) * 4 + 2];
                const bottom = 0.299 * data[((y+1) * width + x) * 4] + 0.587 * data[((y+1) * width + x) * 4 + 1] + 0.114 * data[((y+1) * width + x) * 4 + 2];
                const left = 0.299 * data[(y * width + (x-1)) * 4] + 0.587 * data[(y * width + (x-1)) * 4 + 1] + 0.114 * data[(y * width + (x-1)) * 4 + 2];
                const right = 0.299 * data[(y * width + (x+1)) * 4] + 0.587 * data[(y * width + (x+1)) * 4 + 1] + 0.114 * data[(y * width + (x+1)) * 4 + 2];
                
                const laplacian = Math.abs(4 * center - top - bottom - left - right);
                laplacianSum += laplacian * laplacian;
                count++;
            }
        }
        
        return count > 0 ? laplacianSum / count : 0;
    }

    displayAnalysis(img) {
        // Display image on analysis canvas
        const canvas = document.getElementById('analysisCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx) return;
        
        const containerWidth = Math.min(800, window.innerWidth - 100);
        const aspectRatio = img.height / img.width;
        canvas.width = containerWidth;
        canvas.height = Math.min(600, containerWidth * aspectRatio);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Display metrics
        this.displayMetrics();
        this.drawHistogram();
    }

    displayMetrics() {
        const { brightness, contrast, dynamicRange, sharpness } = this.analysisData;
        
        // Update brightness
        this.updateMetric('brightness', brightness, this.getBrightnessStatus(brightness));
        this.updateMetric('contrast', contrast, this.getContrastStatus(contrast));
        this.updateMetric('sharpness', sharpness, this.getSharpnessStatus(sharpness));
        
        document.getElementById('dynamicRangeMetric').textContent = dynamicRange;
        document.getElementById('dynamicRangeStatus').textContent = dynamicRange > 200 ? 'Excellent' : dynamicRange > 150 ? 'Good' : 'Limited';
        document.getElementById('dynamicRangeStatus').className = `metric-status ${dynamicRange > 200 ? 'good' : dynamicRange > 150 ? 'fair' : 'poor'}`;
    }

    updateMetric(name, value, status) {
        const metricEl = document.getElementById(`${name}Metric`);
        const statusEl = document.getElementById(`${name}Status`);
        
        if (metricEl) metricEl.textContent = value;
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.className = `metric-status ${this.getStatusClass(value, this.thresholds[name])}`;
        }
    }

    getBrightnessStatus(brightness) {
        if (brightness < this.thresholds.brightness.underexposed) return 'Underexposed';
        if (brightness > this.thresholds.brightness.overexposed) return 'Overexposed';
        return 'Well Exposed';
    }

    getContrastStatus(contrast) {
        if (contrast < this.thresholds.contrast.low) return 'Low Contrast';
        if (contrast > this.thresholds.contrast.high) return 'High Contrast';
        return 'Good Contrast';
    }

    getSharpnessStatus(sharpness) {
        if (sharpness < this.thresholds.sharpness.blurry) return 'Soft/Blurry';
        if (sharpness > this.thresholds.sharpness.sharp) return 'Very Sharp';
        return 'Acceptable';
    }

    getStatusClass(value, threshold) {
        if (!threshold) return 'fair';
        if (value < threshold.low || (threshold.high && value > threshold.high)) return 'poor';
        return 'good';
    }

    drawHistogram() {
        const canvas = document.getElementById('histogramCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx || !this.analysisData) return;
        
        const { histogram } = this.analysisData;
        
        canvas.width = canvas.clientWidth;
        canvas.height = 150;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const maxCount = Math.max(...histogram);
        const barWidth = canvas.width / 256;
        
        // Draw histogram bars
        ctx.fillStyle = '#32a0c4';
        for (let i = 0; i < 256; i++) {
            const barHeight = (histogram[i] / maxCount) * canvas.height;
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
        }
    }

    generateSuggestions() {
        const suggestions = [];
        const { brightness, contrast, sharpness } = this.analysisData;
        
        // Brightness suggestions
        if (brightness < this.thresholds.brightness.underexposed) {
            suggestions.push({
                priority: 'high',
                text: `Image is underexposed. Increase brightness by ${Math.round((this.thresholds.brightness.optimal - brightness) / 2.55)}% and lift shadows.`,
                params: { brightness: 20, shadows: 30, glow: 15 }
            });
        } else if (brightness > this.thresholds.brightness.overexposed) {
            suggestions.push({
                priority: 'high',
                text: `Image is overexposed. Reduce highlights and add glow for professional look.`,
                params: { highlights: -25, brightness: -5, glow: 10 }
            });
        }
        
        // Contrast suggestions
        if (contrast < this.thresholds.contrast.low) {
            suggestions.push({
                priority: 'medium',
                text: `Low contrast detected. Increase contrast and clarity for more definition.`,
                params: { contrast: 25, clarity: 20, glow: 15 }
            });
        }
        
        // Professional enhancement
        suggestions.push({
            priority: 'low',
            text: `Add professional glow (25%) and enhance clarity (15%) for a polished, luminous look.`,
            params: { glow: 25, clarity: 15, contrast: 10 }
        });
        
        // Sharpness suggestions
        if (sharpness < this.thresholds.sharpness.acceptable) {
            suggestions.push({
                priority: 'medium',
                text: `Image appears soft. Increase clarity significantly for better definition.`,
                params: { clarity: 30, glow: 20 }
            });
        }
        
        this.displaySuggestions(suggestions);
        this.suggestions = suggestions;
    }

    displaySuggestions(suggestions) {
        const container = document.getElementById('suggestionsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <div class="suggestion-priority">${suggestion.priority} priority</div>
                <p class="suggestion-text">${suggestion.text}</p>
            `;
            container.appendChild(div);
        });
        
        const btn = document.getElementById('applySuggestionsBtn');
        if (btn) {
            btn.disabled = suggestions.length === 0;
        }
    }

    applySuggestions() {
        this.suggestions.forEach(suggestion => {
            Object.assign(this.editingParams, suggestion.params);
        });
        
        this.updateSliderValues();
        this.applyAllEdits();
        this.switchTab('edit');
    }

    enableTab(tabName) {
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.disabled = false;
        }
    }

    handleSliderChange(e) {
        const param = e.target.id.replace('Slider', '');
        const value = parseFloat(e.target.value);
        
        this.editingParams[param] = value;
        
        // Update value display
        const valueDisplay = e.target.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
            valueDisplay.textContent = param === 'glowRadius' ? value : (value > 0 ? `+${value}` : value);
        }
        
        this.applyAllEdits();
    }

    updateSliderValues() {
        Object.keys(this.editingParams).forEach(param => {
            const slider = document.getElementById(`${param}Slider`);
            if (slider) {
                slider.value = this.editingParams[param];
                const valueDisplay = slider.parentElement.querySelector('.slider-value');
                if (valueDisplay) {
                    const value = this.editingParams[param];
                    valueDisplay.textContent = param === 'glowRadius' ? value : (value > 0 ? `+${value}` : value);
                }
            }
        });
    }

    applyAllEdits() {
        if (!this.originalImageData) return;
        
        // Start with original image data
        this.currentImageData = this.cloneImageData(this.originalImageData);
        
        // Apply basic adjustments
        this.applyBasicAdjustments();
        this.applyGlowEffect();
        
        this.displayEditedImage();
    }

    applyBasicAdjustments() {
        const { brightness, contrast, shadows, highlights, saturation, clarity } = this.editingParams;
        const data = this.currentImageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Apply brightness
            if (brightness !== 0) {
                const brightnessAdjust = brightness * 2.55;
                r = Math.min(255, Math.max(0, r + brightnessAdjust));
                g = Math.min(255, Math.max(0, g + brightnessAdjust));
                b = Math.min(255, Math.max(0, b + brightnessAdjust));
            }
            
            // Apply contrast
            if (contrast !== 0) {
                const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
                g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
                b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
            }
            
            // Apply shadow/highlight adjustments
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            if (shadows !== 0) {
                const shadowMask = Math.pow(1 - luminance / 255, 2);
                const shadowAdjust = shadows * shadowMask * 2.55;
                r = Math.min(255, Math.max(0, r + shadowAdjust));
                g = Math.min(255, Math.max(0, g + shadowAdjust));
                b = Math.min(255, Math.max(0, b + shadowAdjust));
            }
            
            if (highlights !== 0) {
                const highlightMask = Math.pow(luminance / 255, 2);
                const highlightAdjust = highlights * highlightMask * 2.55;
                r = Math.min(255, Math.max(0, r + highlightAdjust));
                g = Math.min(255, Math.max(0, g + highlightAdjust));
                b = Math.min(255, Math.max(0, b + highlightAdjust));
            }
            
            // Apply saturation
            if (saturation !== 0) {
                const newLuminance = 0.299 * r + 0.587 * g + 0.114 * b;
                const satFactor = 1 + saturation / 100;
                r = Math.min(255, Math.max(0, newLuminance + (r - newLuminance) * satFactor));
                g = Math.min(255, Math.max(0, newLuminance + (g - newLuminance) * satFactor));
                b = Math.min(255, Math.max(0, newLuminance + (b - newLuminance) * satFactor));
            }
            
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
    }

    applyGlowEffect() {
        const { glow } = this.editingParams;
        if (glow === 0) return;
        
        const data = this.currentImageData.data;
        const glowIntensity = glow / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Create glow mask based on brightness
            const glowMask = Math.max(0, (luminance - 128) / 127);
            const glowAmount = glowMask * glowIntensity;
            
            // Apply glow with screen blend mode
            data[i] = Math.min(255, r + r * glowAmount * 0.3);
            data[i + 1] = Math.min(255, g + g * glowAmount * 0.3);
            data[i + 2] = Math.min(255, b + b * glowAmount * 0.3);
        }
    }

    displayEditedImage() {
        const editCanvas = document.getElementById('editCanvas');
        const originalCanvas = document.getElementById('originalCanvas');
        const exportCanvas = document.getElementById('exportCanvas');
        
        if (editCanvas) {
            const ctx = editCanvas.getContext('2d');
            editCanvas.width = this.currentImageData.width;
            editCanvas.height = this.currentImageData.height;
            ctx.putImageData(this.currentImageData, 0, 0);
        }
        
        if (originalCanvas && this.originalImageData) {
            const ctx = originalCanvas.getContext('2d');
            originalCanvas.width = this.originalImageData.width;
            originalCanvas.height = this.originalImageData.height;
            ctx.putImageData(this.originalImageData, 0, 0);
        }
        
        if (exportCanvas) {
            const ctx = exportCanvas.getContext('2d');
            exportCanvas.width = this.currentImageData.width;
            exportCanvas.height = this.currentImageData.height;
            ctx.putImageData(this.currentImageData, 0, 0);
        }
    }

    toggleComparison() {
        const editCanvas = document.getElementById('editCanvas');
        const btn = document.getElementById('toggleComparison');
        
        if (editCanvas && btn) {
            if (editCanvas.style.opacity === '0') {
                editCanvas.style.opacity = '1';
                btn.textContent = 'Show Original';
            } else {
                editCanvas.style.opacity = '0';
                btn.textContent = 'Show Edited';
            }
        }
    }

    resetEdits() {
        this.editingParams = {
            brightness: 0, contrast: 0, shadows: 0, highlights: 0,
            saturation: 0, vibrance: 0, temperature: 0, tint: 0,
            glow: 0, glowRadius: 5, clarity: 0, noiseReduction: 0
        };
        
        this.updateSliderValues();
        if (this.originalImageData) {
            this.currentImageData = this.cloneImageData(this.originalImageData);
            this.displayEditedImage();
        }
    }

    updateQualityDisplay() {
        const slider = document.getElementById('qualitySlider');
        const display = document.getElementById('qualityValue');
        if (slider && display) {
            display.textContent = Math.round(slider.value * 100) + '%';
        }
    }

    downloadImage() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) return;
        
        const format = document.getElementById('exportFormat')?.value || 'image/jpeg';
        const quality = parseFloat(document.getElementById('qualitySlider')?.value || '0.9');
        const fileName = document.getElementById('fileName')?.value || 'enhanced_photo';
        
        const link = document.createElement('a');
        const extension = format.split('/')[1];
        link.download = `${fileName}.${extension}`;
        link.href = canvas.toDataURL(format, quality);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProPhotoEditor...');
    try {
        window.photoEditor = new ProPhotoEditor();
        console.log('ProPhotoEditor initialized successfully');
    } catch (error) {
        console.error('Error initializing ProPhotoEditor:', error);
    }
});