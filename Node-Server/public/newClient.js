document.addEventListener("DOMContentLoaded", function() {
 "use strict";
  var byId    = function( id ) { return document.getElementById( id ); };
  var log     = console.log.bind(console);
  var width   = window.innerWidth;
  var height  = window.innerHeight;


// TODO:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob

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




  // NOTE Simple IO console element for socket communication
  var outputConsole = document.querySelector('#output-console');
  var printToConsole = function (text = '')  {
    outputConsole.innerHTML += text + '<br/>';
  };
  var renderToConsole = function (element) {
    outputConsole.appendChild(element);
    outputConsole.innerHTML += '<br/>';
  };




   // SENDING
   /////////////////////////////////////////////////////////


    byId('sendAsDiv').onclick = SendAsDiv;
    function SendAsDiv() {
        var encodedCanvas    = canvas.toDataURL();
        var payload          = null;
        var imageElement     = new Image(250, 250);
            imageElement.src = encodedCanvas;

        payload = imageElement.outerHTML;

        socket.emit('divimg', payload);
        printToConsole('Image sent.');
    }



     socket.on('divimg', function(image) {
         log('img arrived');
        var renderedImage = null;

        if (image.indexOf('data:image/') === 0) {
            // NOTE If we receive a base64 image, we render it as an Image
        renderedImage = new Image(250, 250);
        renderedImage.src = image;

        } else {

        // NOTE If we receive a rendered <img> element, we render it directly
        // via document.createElement
        renderedImage           = document.createElement('div');
        renderedImage.innerHTML = image;
        }

        printToConsole('Received image.');
        renderToConsole(renderedImage);
  });


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
        log('sending image HTML: ');
        log(imageHTML);
        socket.emit('SendImageHTML', imageHTML);


        // var htmlAsString = "'" + imageHTML + "'";
        // log('HTML as string: ');
        // log(htmlAsString); // RETURNS: '[object HTMLImageElement]'
        // socket.emit('SendImageHTML', htmlAsString);
   }



  /**
   * Converts canvas to bytes & emits web socket message
   * @return {Uint8Array} Bytes from canvas 
   */     
  byId('defImgBinary').onclick = DefineImageBinary;  
  function DefineImageBinary() {
        var image  = context.getImageData(0, 0, canvas.width, canvas.height);
        var buffer = new ArrayBuffer(image.data.length);
        var bytes  = new Uint8Array(buffer);

        for (var i=0; i<bytes.length; i++) {
            bytes[i] = image.data[i];
        }
        log('buffer');
        log(bytes.buffer);

        log(bytes); 
        socket.emit('defImgBinary', bytes);
  }





   //// Receive
   /////////////////////////////////////////////////////

    // Receive bytes from server, convert them to an image, draw image on canvas
    socket.on("ConvertBytesToImg", function(bytes) {
        log('bytes are: ');
        log(bytes); // RETURNS: Object {0: 24, 1: 24, 2: 29, 3: 255, 4: 24,....}
                    // TODO: How do I convert that into base64?
        var imgFromServer = ConvertBytesToImg(bytes);
        var imageDiv = byId('incomingImg');
        imageDiv.src = imgFromServer;
        log(imageDiv); // RETURNS:  [object ImageData]
    });


    // draw line received from server
	socket.on('draw_line', function (data) {
        drawLines(data);
   });


    // Accept img buffer and draw it to canvas
    socket.on("imageDiv", function(info) {
        log('image data incomnig...');
        log(info);
        var img      = new Image();
            img.src = 'data:image/jpeg;base64,' + info;
        context.drawImage(img, 0, 0);
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