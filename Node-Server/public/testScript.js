        window.onload = function() {
            
            // Get the image
            var sampleImage = document.getElementById("ringoImage"),
                canvas = convertImageToCanvas(sampleImage),
                image = convertCanvasToImage(canvas),
                canvas2 = convertImageToCanvas(image),
                image2 = convertCanvasToImage(canvas2);
            
            // Actions
            document.getElementById("canvasHolder").appendChild(canvas);
            document.getElementById("pngHolder").appendChild(image);
            document.getElementById("canvasHolder2").appendChild(canvas2);
            document.getElementById("pngHolder2").appendChild(image2);
            
            // Converts image to canvas; returns new canvas element
            function convertImageToCanvas(image) {
            var canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                canvas.getContext("2d").drawImage(image, 0, 0);
                
                return canvas;
            }
            
            // Converts canvas to an image
            function convertCanvasToImage(canvas) {
                var image = new Image();
                image.src = canvas.toDataURL("image/png");
                return image;
            }
        };