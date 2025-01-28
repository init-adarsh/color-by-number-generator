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
    this.numberCells = 40;
    this.numberCellsX = 0;
    this.numberCellsY = 0;
    this.cellLength = 0;
    this.numberColors = 7;
    this.uniqueColorsArray = null;
    this.colorTolerance = 1;
    this.previewModeColor = true;
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
    this.numberColorsMax = 11; // Maximum number of colors is 11
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
        context.canvas.width = image.width = 100;
        context.canvas.height = image.height = context.canvas.width / aspectRatio;
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
                    previewContext.strokeStyle = '#000000';
                    previewContext.strokeRect(x * this.cellLength, y * this.cellLength, this.cellLength, this.cellLength);
                    var number = this.uniqueColorsArray.indexOf(color) + 1;
                    const fontSize = this.cellLength / 1.5;
                    previewContext.font = fontSize + "px Arial";
                    previewContext.fillStyle = '#434343';
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
                var samples = 3;
                var dx = xStep / samples;
                var dy = yStep / samples;
                var total = [0, 0, 0];

                for(var i = 0; i < samples; i++) {
                    for(var j = 0; j < samples; j++) {
                        var data = inputContext.getImageData(x * xStep + i * dx, y * yStep + j * dy, 1, 1).data;
                        total[0] += data[0];
                        total[1] += data[1];
                        total[2] += data[2];
                    }
                }

                var avgColor = total.map(v => Math.round(v / (samples * samples)));
                var hex = this.rgbToHex(avgColor, false);
                grid[x][y] = hex;
                frequencyMap.set(hex, (frequencyMap.get(hex) || 0) + 1);
            }
        }

        var sortedEntries = Array.from(frequencyMap.entries()).sort((a, b) => 
            this.getLuminance(a[0]) - this.getLuminance(b[0])
        );
        return [new Map(sortedEntries), grid];
    },

    getMaps: function(initialMap, maxColors) {
        var merged = new Map();
        var colors = Array.from(initialMap.entries());
        
        while(colors.length > 0) {
            var current = colors.shift();
            var group = [current];
            
            for(var i = colors.length - 1; i >= 0; i--) {
                if(this.colorDistance(current[0], colors[i][0]) <= this.colorTolerance * 30) {
                    group.push(colors.splice(i, 1)[0]);
                }
            }
            
            var mainColor = group.reduce((a, b) => a[1] > b[1] ? a : b)[0];
            group.forEach(g => merged.set(g[0], mainColor));
        }

        var uniqueColors = [...new Set(merged.values())].sort((a, b) => 
            this.getLuminance(a) - this.getLuminance(b)
        );

        if(uniqueColors.length > maxColors) {
            uniqueColors = uniqueColors.slice(0, maxColors);
            merged.forEach((value, key) => {
                merged.set(key, uniqueColors.reduce((a, b) => 
                    this.colorDistance(key, a) < this.colorDistance(key, b) ? a : b
                ));
            });
            uniqueColors = [...new Set(merged.values())];
        }

        this.uniqueColorsArray = uniqueColors;
        return [merged, new Map()];
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