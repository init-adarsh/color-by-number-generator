var app;

window.onload = function() {
    app = new Color_By_Number_App();
    app.initialize();
    app.redraw();
};

window.onresize = function() {
    app.redraw();
};

function Color_By_Number_App() {
    this.DEBUG = false;
    this.inputContext = document.getElementById("inputCanvas").getContext("2d");
    this.previewContext = document.getElementById("outputCanvas").getContext("2d");
    this.colorSwatchContext = document.getElementById("colorSwatchCanvas").getContext("2d");
    this.inputFileName = "";
    this.image = document.getElementById("image");
    this.drawingWidth = 0;
    this.drawingHeight = 0;
    this.numberCells = 35;
    this.numberCellsX = 0;
    this.numberCellsY = 0;
    this.cellLength = 0;
    this.numberColors = 7;
    this.uniqueColorsArray = null;
    this.colorTolerance = 1;
    this.previewModeColor = true;
    this.usePalette = null; // Track selected palette
    this.filtersDisabled = false; // Track if filters are disabled
    this.customText = ""; // Store custom text for PDF/image
    this.inputFileUpload = document.getElementById("inputFileUpload");
    this.imagePreviews = document.getElementsByClassName("imagePreview");
    this.inputFieldNumberCells = $("#inputFieldNumberCells");
    this.sliderNumberCells = $("#sliderNumberCells");
    this.numberCellsMin = 10;
    this.numberCellsMax = 80;
    this.numberCellsStep = 5;
    this.inputFieldNumberColors = $("#inputFieldNumberColors");
    this.sliderNumberColors = $("#sliderNumberColors");
    this.numberColorsMin = 2;
    this.numberColorsMax = 15; // Increased from 11 for more detail
    this.numberColorsStep = 1;
    this.inputFieldColorTolerance = $("#inputFieldColorTolerance");
    this.sliderColorTolerance = $("#sliderColorTolerance");
    this.colorToleranceMin = 1;
    this.colorToleranceMax = 10;
    this.colorToleranceStep = 1;
    this.colorToleranceUIRatio = 50000;
    this.checkboxPreviewMode = document.getElementById("checkboxPreviewMode");
    this.inputButtonSaveImage = $("#inputButtonSaveImage");
    this.inputButtonGeneratePDF = $("#inputButtonGeneratePDF");
    this.colorPalettes = {
        'romantic': ['FF69B4', 'FFB6C1', 'FFC0CB', 'F0E68C', 'DDA0DD', 'E6E6FA', 'FFFACD'],
        'sunset': ['FF6347', 'FF7F50', 'FFA500', 'FFD700', 'FF69B4', 'DDA0DD', 'F0E68C'],
        'garden': ['98FB98', '90EE90', 'FFB6C1', 'DDA0DD', 'F0E68C', 'FFA07A', 'E0FFFF'],
        'oceanic': ['87CEEB', '87CEFA', 'B0E0E6', 'AFEEEE', 'E0FFFF', 'F0F8FF', 'E6E6FA'],
        'autumn': ['D2691E', 'CD853F', 'DEB887', 'F4A460', 'FFB6C1', 'DDA0DD', 'F0E68C'],
        'pastel': ['FFB6C1', 'FFCCCB', 'FFE4E1', 'E0FFFF', 'F0FFFF', 'F5FFFA', 'FFFAF0'],
        'vintage': ['D2B48C', 'DEB887', 'F4A460', 'FFE4E1', 'FFEFD5', 'FDF5E6', 'FAF0E6']
    };
    this.initGUI();
}

Color_By_Number_App.prototype = {
    constructor: Color_By_Number_App,

    initialize: function() {
        this.uniqueColorsArray = [];
    },

    initGUI: function() {
        var app = this;
        this.inputFileUpload.addEventListener('change', function(event) {
            if(event.target.files[0]) {
                app.initialize();
                app.inputFileName = event.target.files[0].name.substr(0, event.target.files[0].name.indexOf("."));
                var url = URL.createObjectURL(event.target.files[0]);
                app.image = new Image();
                app.image.onload = function() {
                    Array.prototype.forEach.call(app.imagePreviews, function(el) {
                        el.style.display = "block";
                    });
                    app.loadImage(app.image, app.inputContext);
                    app.redraw();
                }
                app.image.src = url;
            }
        }.bind(this), false);

        this.sliderNumberCells.slider({
            range: "min",
            min: this.numberCellsMin,
            max: this.numberCellsMax,
            value: this.numberCells,
            step: this.numberCellsStep,
            slide: function(event, ui) {
                app.numberCells = ui.value;
                app.inputFieldNumberCells.val(app.numberCells);
                app.redraw();
            }
        });

        this.inputFieldNumberCells.val(this.numberCells);
        this.inputFieldNumberCells.change(function() {
            app.numberCells = this.value;
            app.sliderNumberCells.slider("value", app.numberCells);
            app.redraw();
        });

        this.sliderNumberColors.slider({
            range: "min",
            min: this.numberColorsMin,
            max: this.numberColorsMax,
            value: this.numberColors,
            step: this.numberColorsStep,
            slide: function(event, ui) {
                app.numberColors = ui.value;
                app.inputFieldNumberColors.val(app.numberColors);
                app.redraw();
            }
        });

        this.inputFieldNumberColors.val(this.numberColors);
        this.inputFieldNumberColors.change(function() {
            app.numberColors = this.value;
            app.sliderNumberColors.slider("value", app.numberColors);
            app.redraw();
        });

        this.sliderColorTolerance.slider({
            range: "min",
            min: this.colorToleranceMin,
            max: this.colorToleranceMax,
            value: Math.ceil(this.colorTolerance),
            step: this.colorToleranceStep,
            slide: function(event, ui) {
                app.inputFieldColorTolerance.val(ui.value);
                app.colorTolerance = ui.value;
                app.redraw();
            }
        });

        this.inputFieldColorTolerance.val(Math.ceil(this.colorTolerance));
        this.inputFieldColorTolerance.change(function() {
            app.sliderColorTolerance.slider("value", this.value);
            app.colorTolerance = this.value;
            app.redraw();
        });

        this.checkboxPreviewMode.checked = this.previewModeColor;
        this.checkboxPreviewMode.addEventListener('click', function(event) {
            app.setPreviewMode(event.target.checked);
        });

        this.inputButtonSaveImage.click(function(event) {
            if(app.uniqueColorsArray.length > 0) {
                app.saveImage();
            } else {
                alert('Upload an image file first!');
            }
        });

        this.inputButtonGeneratePDF.click(function(event) {
            if(app.uniqueColorsArray.length > 0) {
                const fileName = "color-by-number_" + app.inputFileName + ".pdf";
                app.generatePDF(app.previewContext, app.colorSwatchContext, fileName);
            } else {
                alert('Upload an image file first!');
            }
        });

        // Add palette button event listeners with active state management
        $('#paletteRomantic').click(function() { app.setPalette('romantic'); });
        $('#paletteSunset').click(function() { app.setPalette('sunset'); });
        $('#paletteGarden').click(function() { app.setPalette('garden'); });
        $('#paletteOceanic').click(function() { app.setPalette('oceanic'); });
        $('#paletteAutumn').click(function() { app.setPalette('autumn'); });
        $('#palettePastel').click(function() { app.setPalette('pastel'); });
        $('#paletteVintage').click(function() { app.setPalette('vintage'); });
        $('#paletteDefault').click(function() { app.setPalette(null); });
        $('#toggleFilters').click(function() { app.toggleFilters(); });
        
        // Add custom text input listener
        $('#customText').on('input', function() {
            app.customText = $(this).val();
        });
    },

    // Set palette with visual feedback
    setPalette: function(paletteName) {
        // Remove active class from all palette buttons
        $('.palette-btn').removeClass('active');
        
        // Set the palette
        this.usePalette = paletteName;
        
        // Add active class to the selected button
        if (paletteName === null) {
            $('#paletteDefault').addClass('active');
        } else {
            $('#palette' + paletteName.charAt(0).toUpperCase() + paletteName.slice(1)).addClass('active');
        }
        
        this.redraw();
    },

    // Toggle all filters on/off
    toggleFilters: function() {
        this.filtersDisabled = !this.filtersDisabled;
        
        // Update button text and appearance
        if (this.filtersDisabled) {
            $('#toggleFilters').addClass('active').text('🚫 Filters OFF');
        } else {
            $('#toggleFilters').removeClass('active').text('✨ Filters ON');
        }
        
        this.redraw();
    },

    setPreviewMode: function(modeColor, width) {
        this.previewModeColor = modeColor;
        this.checkboxPreviewMode.checked = this.previewModeColor;
        this.redraw(width);
    },

    setDrawingWidth: function(width) {
        this.drawingWidth = width || (window.innerWidth > 720 ? window.innerWidth - 450 : window.innerWidth - 120);
    },

    loadImage: function(image, context) {
        var aspectRatio = image.width / image.height;
        // Use much higher resolution - maintain quality up to 800px width
        var maxDimension = 800;
        var width, height;
        
        if (image.width > image.height) {
            width = Math.min(image.width, maxDimension);
            height = width / aspectRatio;
        } else {
            height = Math.min(image.height, maxDimension);
            width = height * aspectRatio;
        }
        
        context.canvas.width = Math.round(width);
        context.canvas.height = Math.round(height);
        
        // Use high-quality image rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
    },

    redraw: function(width) {
        this.setDrawingWidth(width);
        this.uniqueColorsArray = [];
        if(this.image.src) {
            var aspectRatio = this.image.width / this.image.height;
            this.numberCellsY = aspectRatio > 1 ? this.numberCells : Math.ceil(this.numberCells / aspectRatio);
            this.numberCellsX = aspectRatio > 1 ? Math.ceil(this.numberCells * aspectRatio) : this.numberCells;
            this.cellLength = Math.floor(this.drawingWidth / this.numberCellsX);
            this.previewContext.canvas.width = this.cellLength * this.numberCellsX;
            this.previewContext.canvas.height = this.cellLength * this.numberCellsY;
            this.drawImage(this.image, this.inputContext, this.previewContext, this.previewModeColor);
            this.drawColorSwatches(this.colorSwatchContext, this.uniqueColorsArray);
        }
    },

    drawImage: function(image, inputContext, previewContext, previewModeColor) {
        var data = this.getImageData(image, inputContext);
        var grid = data[1];
        var frequencyMap = this.getMaps(data[0], this.numberColors)[0];
        
        previewContext.clearRect(0, 0, previewContext.canvas.width, previewContext.canvas.height);
        previewContext.fillStyle = '#EDEDED';
        previewContext.fillRect(0, 0, previewContext.canvas.width, previewContext.canvas.height);
        
        for(var x = 0; x < this.numberCellsX; x++) {
            for(var y = 0; y < this.numberCellsY; y++) {
                var color = frequencyMap.get(grid[x][y]);
                if(previewModeColor) {
                    previewContext.fillStyle = '#' + color;
                    previewContext.fillRect(x * this.cellLength, y * this.cellLength, this.cellLength, this.cellLength);
                } else {
                    previewContext.fillStyle = '#FFFFFF';
                    previewContext.fillRect(x * this.cellLength, y * this.cellLength, this.cellLength, this.cellLength);
                    
                    // Optimized border thickness for 35-grid coloring experience
                    var borderWidth = this.numberCells === 35 ? 2 : 1;
                    previewContext.lineWidth = borderWidth;
                    previewContext.strokeStyle = '#000000';
                    previewContext.strokeRect(x * this.cellLength, y * this.cellLength, this.cellLength, this.cellLength);
                    
                    var number = this.uniqueColorsArray.indexOf(color) + 1;
                    
                    // Optimized font size for 35-grid - better readability while coloring
                    var fontSize;
                    if (this.numberCells === 35) {
                        fontSize = Math.max(8, this.cellLength / 1.3); // Larger, more readable for 35-grid
                    } else {
                        fontSize = this.cellLength / 1.5; // Standard size for other grids
                    }
                    
                    previewContext.font = fontSize + "px Arial"; // Back to simple Arial
                    previewContext.fillStyle = '#2C2C2C'; // Darker gray for better contrast
                    previewContext.fillText(number, x * this.cellLength + this.cellLength / 2 - previewContext.measureText(number).width / 2, y * this.cellLength + 2 * this.cellLength / 3);
                }
            }
        }
    },

    getImageData: function(image, inputContext) {
        var frequencyMap = new Map();
        var grid = [];
        var xStep = inputContext.canvas.width / this.numberCellsX;
        var yStep = inputContext.canvas.height / this.numberCellsY;

        for(var x = 0; x < this.numberCellsX; x++) {
            grid.push([]);
            for(var y = 0; y < this.numberCellsY; y++) {
                // Enhanced sampling for 35-grid - even more accuracy
                var samples = this.numberCells === 35 ? 7 : 5; // Extra samples for 35-grid
                var dx = xStep / samples;
                var dy = yStep / samples;
                var colorSamples = [];
                
                // Collect all samples first
                for(var i = 0; i < samples; i++) {
                    for(var j = 0; j < samples; j++) {
                        var sampleX = Math.floor(x * xStep + i * dx + dx/2);
                        var sampleY = Math.floor(y * yStep + j * dy + dy/2);
                        
                        // Ensure we don't sample outside canvas
                        sampleX = Math.min(sampleX, inputContext.canvas.width - 1);
                        sampleY = Math.min(sampleY, inputContext.canvas.height - 1);
                        
                        var data = inputContext.getImageData(sampleX, sampleY, 1, 1).data;
                        colorSamples.push([data[0], data[1], data[2]]);
                    }
                }
                
                // Use median-based averaging to reduce noise
                var medianColor = this.getMedianColor(colorSamples);
                var hex = this.rgbToHex(medianColor);
                grid[x][y] = hex;
                frequencyMap.set(hex, (frequencyMap.get(hex) || 0) + 1);
            }
        }

        return [frequencyMap, grid];
    },

    // Get median color from samples to reduce noise
    getMedianColor: function(colorSamples) {
        var r = colorSamples.map(c => c[0]).sort((a, b) => a - b);
        var g = colorSamples.map(c => c[1]).sort((a, b) => a - b);
        var b = colorSamples.map(c => c[2]).sort((a, b) => a - b);
        
        var mid = Math.floor(colorSamples.length / 2);
        return [
            Math.round(colorSamples.length % 2 ? r[mid] : (r[mid - 1] + r[mid]) / 2),
            Math.round(colorSamples.length % 2 ? g[mid] : (g[mid - 1] + g[mid]) / 2),
            Math.round(colorSamples.length % 2 ? b[mid] : (b[mid - 1] + b[mid]) / 2)
        ];
    },

    getMaps: function(initialMap, maxColors) {
        var colorMapping;
        
        // If filters are disabled, use simple color reduction
        if (this.filtersDisabled) {
            var allColors = Array.from(initialMap.keys());
            // Simple approach: take the most frequent colors
            var sortedByFrequency = Array.from(initialMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxColors)
                .map(entry => entry[0]);
            
            this.uniqueColorsArray = sortedByFrequency.sort((a, b) => this.getLuminance(a) - this.getLuminance(b));
            
            // Simple direct mapping
            colorMapping = new Map();
            initialMap.forEach((frequency, originalColor) => {
                var bestMatch = sortedByFrequency[0];
                var minDistance = Infinity;
                
                for (var i = 0; i < sortedByFrequency.length; i++) {
                    var distance = this.colorDistance(originalColor, sortedByFrequency[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestMatch = sortedByFrequency[i];
                    }
                }
                colorMapping.set(originalColor, bestMatch);
            });
            
            return [colorMapping, new Map()];
        }
        
        // Check if using a color palette
        if (this.usePalette && this.colorPalettes[this.usePalette]) {
            var paletteColors = this.colorPalettes[this.usePalette].slice(0, maxColors);
            colorMapping = this.applyPaletteMapping(initialMap, paletteColors);
            this.uniqueColorsArray = paletteColors.sort((a, b) => this.getLuminance(a) - this.getLuminance(b));
        } else {
            // Use k-means clustering for optimal color selection
            var optimalColors = this.kMeansColors(initialMap, maxColors);
            
            // Create mapping from original colors to optimal colors
            colorMapping = new Map();
            var tolerance = this.colorTolerance * 15; // Adjusted scaling
            
            initialMap.forEach((frequency, originalColor) => {
                var bestMatch = optimalColors[0];
                var minDistance = Infinity;
                
                // Find the best matching optimal color using perceptual distance
                for (var i = 0; i < optimalColors.length; i++) {
                    var distance = this.perceptualColorDistance(originalColor, optimalColors[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestMatch = optimalColors[i];
                    }
                }
                
                colorMapping.set(originalColor, bestMatch);
            });
            
            // Apply additional clustering based on tolerance for similar colors
            if (this.colorTolerance > 1) {
                var clusteredColors = new Map();
                var processedColors = new Set();
                
                colorMapping.forEach((mappedColor, originalColor) => {
                    if (processedColors.has(originalColor)) return;
                    
                    var cluster = [originalColor];
                    var clusterFrequency = initialMap.get(originalColor) || 0;
                    
                    // Find similar colors within tolerance
                    colorMapping.forEach((otherMappedColor, otherOriginalColor) => {
                        if (originalColor !== otherOriginalColor && 
                            !processedColors.has(otherOriginalColor) &&
                            this.perceptualColorDistance(originalColor, otherOriginalColor) <= tolerance) {
                            cluster.push(otherOriginalColor);
                            clusterFrequency += initialMap.get(otherOriginalColor) || 0;
                        }
                    });
                    
                    // Find the most representative color in the cluster
                    var representativeColor = cluster.reduce((best, current) => {
                        var currentFreq = initialMap.get(current) || 0;
                        var bestFreq = initialMap.get(best) || 0;
                        return currentFreq > bestFreq ? current : best;
                    });
                    
                    // Map all colors in cluster to the representative color
                    cluster.forEach(color => {
                        clusteredColors.set(color, representativeColor);
                        processedColors.add(color);
                    });
                });
                
                colorMapping = clusteredColors;
            }
            
            // Update unique colors array with final selection
            this.uniqueColorsArray = [...new Set(colorMapping.values())]
                .sort((a, b) => this.getLuminance(a) - this.getLuminance(b));
        }
        
        return [colorMapping, new Map()];
    },

    // Edge detection for adaptive sampling (optional enhancement)
    detectEdges: function(inputContext, x, y, xStep, yStep) {
        // Simple Sobel edge detection
        var sample = (sx, sy) => {
            sx = Math.max(0, Math.min(inputContext.canvas.width - 1, sx));
            sy = Math.max(0, Math.min(inputContext.canvas.height - 1, sy));
            var data = inputContext.getImageData(sx, sy, 1, 1).data;
            return 0.299 * data[0] + 0.587 * data[1] + 0.114 * data[2]; // Luminance
        };
        
        var centerX = x * xStep + xStep / 2;
        var centerY = y * yStep + yStep / 2;
        
        // Sobel X kernel
        var gx = sample(centerX - 1, centerY - 1) * -1 +
                 sample(centerX + 1, centerY - 1) * 1 +
                 sample(centerX - 1, centerY) * -2 +
                 sample(centerX + 1, centerY) * 2 +
                 sample(centerX - 1, centerY + 1) * -1 +
                 sample(centerX + 1, centerY + 1) * 1;
        
        // Sobel Y kernel
        var gy = sample(centerX - 1, centerY - 1) * -1 +
                 sample(centerX, centerY - 1) * -2 +
                 sample(centerX + 1, centerY - 1) * -1 +
                 sample(centerX - 1, centerY + 1) * 1 +
                 sample(centerX, centerY + 1) * 2 +
                 sample(centerX + 1, centerY + 1) * 1;
        
        return Math.sqrt(gx * gx + gy * gy);
    },

    // Apply romantic color palette preset
    applyColorPalette: function(paletteName) {
        if (!this.colorPalettes[paletteName]) return false;
        
        var paletteColors = this.colorPalettes[paletteName];
        var targetColors = Math.min(paletteColors.length, this.numberColors);
        
        // Override the k-means result with palette colors
        this.uniqueColorsArray = paletteColors.slice(0, targetColors)
            .sort((a, b) => this.getLuminance(a) - this.getLuminance(b));
        
        return true;
    },

    // Enhanced color mapping for palette mode
    applyPaletteMapping: function(initialMap, paletteColors) {
        var colorMapping = new Map();
        
        initialMap.forEach((frequency, originalColor) => {
            var bestMatch = paletteColors[0];
            var minDistance = Infinity;
            
            // Find the best matching palette color using perceptual distance
            for (var i = 0; i < paletteColors.length; i++) {
                var distance = this.perceptualColorDistance(originalColor, paletteColors[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = paletteColors[i];
                }
            }
            
            colorMapping.set(originalColor, bestMatch);
        });
        
        return colorMapping;
    },

    colorDistance: function(hex1, hex2) {
        var c1 = this.hexToRgb(hex1);
        var c2 = this.hexToRgb(hex2);
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) + 
            Math.pow(c1.g - c2.g, 2) + 
            Math.pow(c1.b - c2.b, 2)
        );
    },

    getLuminance: function(hex) {
        var rgb = this.hexToRgb(hex);
        return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    },

    hexToRgb: function(hex) {
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16)
        };
    },

    // Convert RGB to LAB color space for perceptual color difference
    rgbToLab: function(rgb) {
        // First convert RGB to XYZ
        var r = rgb.r / 255;
        var g = rgb.g / 255;
        var b = rgb.b / 255;

        // Apply gamma correction
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        // Convert to XYZ using sRGB matrix
        var x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
        var y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
        var z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

        // Normalize for D65 illuminant
        x = x / 95.047;
        y = y / 100.000;
        z = z / 108.883;

        // Convert XYZ to LAB
        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

        return {
            l: (116 * y) - 16,
            a: 500 * (x - y),
            b: 200 * (y - z)
        };
    },

    // Perceptual color distance using Delta-E CIE94
    perceptualColorDistance: function(hex1, hex2) {
        var rgb1 = this.hexToRgb(hex1);
        var rgb2 = this.hexToRgb(hex2);
        var lab1 = this.rgbToLab(rgb1);
        var lab2 = this.rgbToLab(rgb2);

        var deltaL = lab1.l - lab2.l;
        var deltaA = lab1.a - lab2.a;
        var deltaB = lab1.b - lab2.b;
        var c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
        var c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
        var deltaC = c1 - c2;
        var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
        deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);

        var sl = 1.0;
        var kc = 1.0;
        var kh = 1.0;
        var k1 = 0.045;
        var k2 = 0.015;
        var sc = 1 + k1 * c1;
        var sh = 1 + k2 * c1;

        var deltaLKlsl = deltaL / (1.0 * sl);
        var deltaCkcsc = deltaC / (kc * sc);
        var deltaHkhsh = deltaH / (kh * sh);

        return Math.sqrt(deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh);
    },

    // K-means clustering for optimal color selection
    kMeansColors: function(colorFrequencyMap, k, maxIterations = 50) {
        var colors = Array.from(colorFrequencyMap.keys());
        var frequencies = Array.from(colorFrequencyMap.values());
        
        if (colors.length <= k) {
            return colors;
        }

        // Initialize centroids using k-means++ for better starting positions
        var centroids = [];
        var rgbColors = colors.map(hex => this.hexToRgb(hex));
        
        // First centroid is random
        centroids.push(rgbColors[Math.floor(Math.random() * rgbColors.length)]);
        
        // Choose remaining centroids with probability proportional to squared distance
        for (var i = 1; i < k; i++) {
            var distances = rgbColors.map(color => {
                var minDist = Infinity;
                for (var j = 0; j < centroids.length; j++) {
                    var dist = this.colorDistance(
                        this.rgbToHex([color.r, color.g, color.b]),
                        this.rgbToHex([centroids[j].r, centroids[j].g, centroids[j].b])
                    );
                    minDist = Math.min(minDist, dist);
                }
                return minDist * minDist;
            });
            
            var totalDist = distances.reduce((a, b) => a + b, 0);
            var threshold = Math.random() * totalDist;
            var sum = 0;
            
            for (var j = 0; j < distances.length; j++) {
                sum += distances[j];
                if (sum >= threshold) {
                    centroids.push(rgbColors[j]);
                    break;
                }
            }
        }

        // K-means iterations
        for (var iter = 0; iter < maxIterations; iter++) {
            var clusters = Array(k).fill().map(() => ({ colors: [], weights: [] }));
            
            // Assign colors to nearest centroid
            for (var i = 0; i < colors.length; i++) {
                var color = rgbColors[i];
                var minDist = Infinity;
                var bestCluster = 0;
                
                for (var j = 0; j < centroids.length; j++) {
                    var dist = this.perceptualColorDistance(
                        this.rgbToHex([color.r, color.g, color.b]),
                        this.rgbToHex([centroids[j].r, centroids[j].g, centroids[j].b])
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = j;
                    }
                }
                
                clusters[bestCluster].colors.push(color);
                clusters[bestCluster].weights.push(frequencies[i]);
            }
            
            // Update centroids (weighted average)
            var newCentroids = [];
            var changed = false;
            
            for (var j = 0; j < k; j++) {
                if (clusters[j].colors.length === 0) {
                    newCentroids.push(centroids[j]);
                    continue;
                }
                
                var totalWeight = clusters[j].weights.reduce((a, b) => a + b, 0);
                var newCentroid = {
                    r: Math.round(clusters[j].colors.reduce((sum, color, idx) => 
                        sum + color.r * clusters[j].weights[idx], 0) / totalWeight),
                    g: Math.round(clusters[j].colors.reduce((sum, color, idx) => 
                        sum + color.g * clusters[j].weights[idx], 0) / totalWeight),
                    b: Math.round(clusters[j].colors.reduce((sum, color, idx) => 
                        sum + color.b * clusters[j].weights[idx], 0) / totalWeight)
                };
                
                if (Math.abs(newCentroid.r - centroids[j].r) > 1 ||
                    Math.abs(newCentroid.g - centroids[j].g) > 1 ||
                    Math.abs(newCentroid.b - centroids[j].b) > 1) {
                    changed = true;
                }
                
                newCentroids.push(newCentroid);
            }
            
            centroids = newCentroids;
            
            if (!changed) break;
        }
        
        // Convert back to hex and sort by luminance
        return centroids
            .map(rgb => this.rgbToHex([rgb.r, rgb.g, rgb.b]))
            .sort((a, b) => this.getLuminance(a) - this.getLuminance(b));
    },

    drawColorSwatches: function(context, colors) {
        context.canvas.width = this.previewContext.canvas.width;
        context.canvas.height = 100;
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        const swatchSize = Math.min(40, context.canvas.width / colors.length * 0.8);
        const padding = swatchSize * 0.2;

        colors.forEach((color, i) => {
            const x = padding + i * (swatchSize + padding);
            context.beginPath();
            context.arc(x + swatchSize/2, 50, swatchSize/2, 0, Math.PI * 2);
            context.fillStyle = '#' + color;
            context.fill();
            context.strokeStyle = "#000000";
            context.stroke();
            context.fillStyle = '#000000';
            context.font = (swatchSize * 0.7) + "px Arial";
            context.fillText(i + 1, x + swatchSize/2 - context.measureText(i + 1).width/2, 58);
        });
    },

    // Draw custom text at bottom right corner
    drawCustomText: function(context, text, width, height) {
        if (!text || text.trim() === '') return;
        
        var fontSize = Math.max(12, Math.min(16, width / 40)); // Responsive font size
        context.font = fontSize + "px Arial";
        context.fillStyle = '#434343';
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        
        // Add some padding from the edges
        var padding = 10;
        context.fillText(text.trim(), width - padding, height - padding);
        
        // Reset text alignment for other uses
        context.textAlign = 'left';
        context.textBaseline = 'alphabetic';
    },

    rgbToHex: function(rgbArr) {
        return rgbArr.map(v => v.toString(16).padStart(2, '0')).join('');
    },

    generatePDF: function(previewContext, colorSwatchContext, fileName) {
        try {
            // Setup PDF with proper dimensions
            const margin = 20;
            const pdfWidth = 595.28;  // A4 width in points
            const pdfHeight = 841.89; // A4 height in points
            const pdf = new jsPDF('portrait', 'pt', 'a4');
            
            // Calculate scaling to fit page
            const scale = Math.min(
                (pdfWidth - 2*margin) / previewContext.canvas.width,
                (pdfHeight - 2*margin - 100) / previewContext.canvas.height
            );
            
            // Add main image
            const imageData = previewContext.canvas.toDataURL('image/png');
            const scaledWidth = previewContext.canvas.width * scale;
            const scaledHeight = previewContext.canvas.height * scale;
            const x = (pdfWidth - scaledWidth) / 2;
            const y = margin;
            
            pdf.addImage(imageData, 'PNG', x, y, scaledWidth, scaledHeight);
            
            // Add color swatches
            const swatchData = colorSwatchContext.canvas.toDataURL('image/png');
            const swatchScale = scaledWidth / colorSwatchContext.canvas.width;
            const swatchHeight = colorSwatchContext.canvas.height * swatchScale;
            
            pdf.addImage(
                swatchData, 
                'PNG', 
                x, 
                y + scaledHeight + 20, 
                scaledWidth, 
                swatchHeight
            );
            
            // Add custom text if provided
            if (this.customText && this.customText.trim() !== '') {
                pdf.setFontSize(14);
                pdf.setTextColor(67, 67, 67); // #434343
                var textWidth = pdf.getTextWidth(this.customText);
                pdf.text(this.customText, pdfWidth - margin - textWidth, pdfHeight - margin);
            }
            
            // Save PDF
            pdf.save(fileName);
            return true;
        } catch(error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
            return false;
        }
    },

    saveImage: function() {
        try {
            // Create temporary canvas for combined image
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            
            // Set dimensions
            tempCanvas.width = this.previewContext.canvas.width;
            tempCanvas.height = this.previewContext.canvas.height + this.colorSwatchContext.canvas.height + 20;
            
            // Draw preview
            tempContext.fillStyle = '#FFFFFF';
            tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempContext.drawImage(this.previewContext.canvas, 0, 0);
            
            // Draw color swatches
            tempContext.drawImage(
                this.colorSwatchContext.canvas, 
                0,
                this.previewContext.canvas.height + 20
            );
            
            // Add custom text if provided
            if (this.customText && this.customText.trim() !== '') {
                this.drawCustomText(
                    tempContext, 
                    this.customText, 
                    tempCanvas.width, 
                    tempCanvas.height
                );
            }
            
            // Create download link
            const link = document.createElement('a');
            link.download = 'color-by-number_' + this.inputFileName + '.png';
            link.href = tempCanvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch(error) {
            console.error('Image export failed:', error);
            alert('Failed to save image. Please try again.');
            return false;
        }
    }
};