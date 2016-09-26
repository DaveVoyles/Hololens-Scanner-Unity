document.addEventListener("DOMContentLoaded", function() {
 "use strict";
  var byId = function( id ) { return document.getElementById( id ); };
  var log = console.log.bind(console);
  var width   = window.innerWidth;
  var height  = window.innerHeight;

////////////////////////////////////////////////////


// Get the image
var sampleImage = document.getElementById("ringoImage"),
    canvas = convertImageToCanvas(sampleImage),
    image = convertCanvasToImage(canvas),
    canvas2 = convertImageToCanvas(image),
    image2 = convertCanvasToImage(canvas2);
    var context = canvas.getContext('2d'); 


    // Actions
    document.getElementById("canvasHolder").appendChild(canvas);
    document.getElementById("pngHolder").appendChild(image);
    

    /**
     * After receiving image from server, create a new canvas out of it.
     * @param {Image} image - Image to draw on canvas.
     * @return {canvas} Canvas with image drawn on it.
     */
    function convertImageToCanvas(image) {
    var canvas        = document.createElement("canvas");
        canvas.width  = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0);
        
        return canvas;
    }
    

    /**
     * Creates a PNG image from canvas w/ canvas.toDataURL()
     * @return {Image} Image from canvas
     */
    function convertCanvasToImage(canvas) {
        var image     = new Image();
        log('canvas is:');
        log(canvas);
        image.src = canvas.toDataURL("image/png");

        return image;
    }

    ////////////////////////////////////////////////////////


   function drawLines (data) {
      var line = data.line;

      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.strokeStyle = curColor;
      context.strokeStyle = data.color;
      context.stroke();
   }


   /**
    * Called by SendImageToBytes. Creates an image based on convertCanvasToImage.
    * Canvas -> Image -> Bytes
    * @return {Uint8Array} Bytes from the newly converted canvas.
    */
    function ConvertImgToBytes() {
        var image  = convertCanvasToImage(canvas);
        var buffer = new ArrayBuffer(image.data.length);
        var bytes  = new Uint8Array(buffer);

        for (var i=0; i<bytes.length; i++) {
            bytes[i] = image.data[i];
        }
        debug.log("ConvertImgToBytes:" );
        Console.log(bytes);

        return bytes;
    }


    /**
     * Accepts bytes from server & converts to an image.
     * @return {ImageData} Image data from byte array
     */
    function ConvertBytesToImg (blob) {
        var bytes     = new Uint8Array(blob);        
        var imageData = context.createImageData(canvas.width, canvas.height);
        
        // Copy bytes to new imageData obj
        for (var i=8; i<imageData.data.length; i++) {
            imageData.data[i] = bytes[i];
        }
        // This can paint the canvas with the new-found image
        // context.putImageData(imageData, 0, 0);

        // OR

        // Returns new image    
        return imageData;
    }  


   var mouse = { 
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
   };

   var socket  = io.connect();

    // Colors
    var colorPurple = "#cb3594";
    var colorGreen  = "#659b41";
    var colorYellow = "#ffcf33";
    var colorBrown  = "#986928";
    var curColor    = colorPurple;
    var clickColor  = new Array();

    // Click events
    byId( "purplebtn").onclick = goPurple;
    byId( "greenbtn" ).onclick = goGreen;
    byId( "yellowbtn").onclick = goYellow;
    byId( "brownbtn" ).onclick = goBrown;
    byId( "clear"    ).onclick = clearCanvas;

    function goPurple(){ curColor = colorPurple; }
    function goGreen (){ curColor = colorGreen;  }
    function goYellow(){ curColor = colorYellow; }
    function goBrown (){ curColor = colorBrown;  }
    function clearCanvas(){
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
         context.drawImage(new Image(), 0, 0); // May not need this
    }


   // register mouse event handlers
   canvas.onmousedown = function(e){ mouse.click = true; };
   canvas.onmouseup   = function(e){ mouse.click = false; };

   // normalize mouse position to range 0.0 - 1.0
   canvas.onmousemove = function(e) {
      mouse.pos.x = e.clientX / width;
      mouse.pos.y = e.clientY / height;
      mouse.move = true;
   };





   
//   byId('send').onclick = DefineImageBinary;  
//   function DefineImageBinary() {
//         var image  = context.getImageData(0, 0, canvas.width, canvas.height);
//         var buffer = new ArrayBuffer(image.data.length);
//         var bytes  = new Uint8Array(buffer);
//         for (var i=0; i<bytes.length; i++) {
//             bytes[i] = image.data[i];
//         }
//         log('buffer');
//         log(bytes.buffer);

//         log(bytes); 
//         socket.emit('ConvertedImgToBytes', bytes);
//   }



   // SENDING
   /////////////////////////////////////////////////////////

   // Convert canvas to image, and tell server to convert those bytes to an image
   byId('send').onclick = SendImageToBytes;  
   function SendImageToBytes() {    
         var bytes = ConvertImgToBytes(image);
        log('sending image binary. bytes: ');
        log(bytes);

        socket.emit('ConvertedImgToBytes', bytes);
   }


   // Sends HTML img object
   byId('sendHTML').onclick = SendImageHTML;  
   function SendImageHTML() {    
        var imageHTML = convertCanvasToImage(canvas); 
        log('sending image HTM: ');
        log(imageHTML);

        socket.emit('SendImageHTML', imageHTML);
   }




   //// Receive
   /////////////////////////////////////////////////////

    // Receive bytes from server, convert them to an image, draw image on canvas
    socket.on("ConvertBytesToImg", function(blob) {
        log('blob is: ');
        log(blob);
        var imgFromServer = ConvertBytesToImg(blob);
        // convertCanvasToImage(imgFromServer); // TODO: Not sure if I still need this?
    });


        // draw line received from server
	socket.on('draw_line', function (data) {
        drawLines(data);
   });


    // Accept img buffer and draw it to canvas
    socket.on("image", function(info) {
        log('image data incomnig...');
        var img      = new Image();
            img.src = 'data:image/jpeg;base64,' + info;


        if (info.image) {
            var img = new Image();
                img.src = 'data:image/jpeg;base64,' + info.buffer; 
            context.drawImage(img, 0, 0);
            console.log("Image received");
        } 
    });

   
   // main loop, running every 25ms
   function mainLoop() {
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
         // send line to to the server
         socket.emit('draw_line', {
              line: [ mouse.pos, mouse.pos_prev ] ,
              color: context.curColor // BUG: not working yet
            });
         mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
   }
   mainLoop();


});