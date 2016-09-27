document.addEventListener("DOMContentLoaded", function() {
 "use strict";
  var byId    = function( id ) { return document.getElementById( id ); };
  var log     = console.log.bind(console);
  var width   = window.innerWidth;
  var height  = window.innerHeight;

var sampleImage = document.getElementById("ringoImage"),
    canvas = convertImageToCanvas(sampleImage),
    image = convertCanvasToImage(canvas);
    var context = canvas.getContext('2d'); 


    // Actions
    document.getElementById("canvasHolder").appendChild(canvas);
    document.getElementById("pngHolder").appendChild(image);

    byId('sendAsDiv').onclick    = SendAsDiv;
    byId('sendAsBinary').onclick = SendAsBinary;


   /**
    * Receives line data from server and replicates it onto current canvas.
    * @param {object} data - Array of line data from server.
    */
   function drawLines (data) {
      var line = data.line;

      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.strokeStyle = curColor;
      context.strokeStyle = data.color;
      context.stroke();
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




   // SENDING & RECEIVING
   /////////////////////////////////////////////////////////


    /**
     * Convert canvas to data URI containing a representation of the image. Defaults to PNG, 96dpi resolution.
     * Create a new element, set URI as the source, & pass URI to node server.
     */
    function SendAsDiv() {
        var encodedCanvas    = canvas.toDataURL();
        var imageElement     = new Image(250, 250);
            imageElement.src = encodedCanvas;
        var  payload         = imageElement.outerHTML;

        socket.emit('divimg', payload);
    }

     // Receive a rendered <img> element, we render it directly via document.createElement
     socket.on('divimg', function(image) {
        var renderedImage           = document.createElement('div');
            renderedImage.innerHTML = image;

        renderToConsole(renderedImage);
  });



    /**
     * Convert canvas to data URI containing a representation of the image. Defaults to PNG, 96dpi resolution.
     * Passes URI to node server.
     * OUTPUT: data:image/png;base64,iVBORw0K......
     */ 
    function SendAsBinary() {
        var encodedCanvas    = canvas.toDataURL();
        socket.emit('imgBinary', payload);
    }

     // receive a base64 image, we render it as an Image
     socket.on('imgBinary', function(image) {
        var renderedImage     = new Image(250, 250);
            renderedImage.src = image;

        renderToConsole(renderedImage);
  });


    // draw line received from server
	socket.on('draw_line', function (data) {
        drawLines(data);
   });

   
   /**
    * Main loop, running every 25ms
    * Emits line data to node server, so that other clients can replicate lines
    */
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



    // Un-used support functions around byte data
    //////////////////////////////////////////////////////////////
    
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

   /**
    *  Convert canvas to image, and tell server to convert those bytes to an image
    */
   function SendImageToBytes() {    
         var bytes = ConvertImgToBytes(image);
        log('sending image binary. bytes: ');
        log(bytes);

        socket.emit('ConvertedImgToBytes', bytes);
   }


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




});