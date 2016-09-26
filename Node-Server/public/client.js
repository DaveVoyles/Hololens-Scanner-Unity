// http://code-and.coffee/post/2015/collaborative-drawing-canvas-node-websocket/
// https://github.com/javaee-samples/javaee7-samples/blob/master/websocket/whiteboard/src/main/webapp/whiteboard.js#L120
// https://stackoverflow.com/questions/13390454/receive-blob-in-websocket-and-render-as-image-in-canvas
//      log('sending Img Binary: ' + bytes);
document.addEventListener("DOMContentLoaded", function() {
 "use strict";
  var byId = function( id ) { return document.getElementById( id ); };
  var log = console.log.bind(console);

   var mouse = { 
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
   };
   // get canvas element and create context
   var canvas  = document.getElementById('drawing');
   var context = canvas.getContext('2d');
   var width   = window.innerWidth;
   var height  = window.innerHeight;
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

   // set canvas to full browser width/height
   canvas.width  = width;
   canvas.height = height;

   // register mouse event handlers
   canvas.onmousedown = function(e){ mouse.click = true; };
   canvas.onmouseup   = function(e){ mouse.click = false; };

   // normalize mouse position to range 0.0 - 1.0
   canvas.onmousemove = function(e) {
      mouse.pos.x = e.clientX / width;
      mouse.pos.y = e.clientY / height;
      mouse.move = true;
   };

    // function ReceiveImgData(data) {
    //     var uint8Arr = new Uint8Array(data);
    //     var sBinary   = '';
    //     for (var i = 0; i < uint8Arr.length; i++) {
    //         sBinary += String.fromCharCode(uint8Arr[i]);
    //     }
    //     var base64String = window.btoa(sBinary);
    // }


    // Receive image data
    // function DrawImgToScreen(data) {
    //     var base64String = data;
    //     var img = new Image();
    //         img.src = base64String;
    //         img.onload = function() {
    //             var x = 0, y = 0;
    //             context.drawImage(this, x, y);
    //     };
    // }


    // Send image data OUT
    // byId('send').onclick = DefineImageBinary;    
    // function DefineImageBinary() {
    //     var image  = context.getImageData(0, 0, canvas.width, canvas.height);
    //     var buffer = new ArrayBuffer(image.data.length);
    //     var bytes  = new Uint8Array(buffer);
    //     for (var i=0; i<bytes.length; i++) {
    //         bytes[i] = image.data[i];
    //     }
    //     socket.emit('DefineImageBinary', bytes);
    //     log('sending image binary. bytes: ');
    //     log(bytes);
    // } 


    // socket.on("DrawImageBinary", function(blob) {
    //     log('blob is: ');
    //     log(blob);

    //     var bytes     = new Uint8Array(blob);        
    //     var imageData = context.createImageData(canvas.width, canvas.height);
        
    //     for (var i=8; i<imageData.data.length; i++) {
    //         imageData.data[i] = bytes[i];
    //     }
    //     context.putImageData(imageData, 0, 0);      

    //     // Returning white. No pixel data. 
    //     // Maybe I need to draw the img on top of the canvas?

    //     //TODO: Or use context.putImageData AFTER the img call?
    //     var img              = byId('new-image');
    //     log(img);
    //         img.height       = canvas.height;
    //         img.width        = canvas.width;
    //         img.style.border = "3px solid black";
    //         img.src          = canvas.toDataURL();
    //         log('img:');
    //         log(img);
    // });





    socket.on("DrawImageBinary", function(image) {
        function convertImageToCanvas(image) {
            var canvas        = document.createElement("canvas");
                canvas.width  = image.width;
                canvas.height = image.height;
                canvas.getContext("2d").drawImage(image, 0, 0);

            return canvas;
        }
    });



    function convertCanvasToImage(canvas) {
        var image = new Image();
            image.src = canvas.toDataURL("image/png");
            log('convertCanvasToImage src:' + image.src );
            log(image);
        return image;
    }

    // // Converts canvas to an image
    // function convertCanvasToImage(canvas, callback) {
    //     var image = new Image();
    //     image.onload = function() {
    //         callback(image);
    //     };
    // image.src = canvas.toDataURL("image/png");
    // }


    byId('send').onclick = DefineImageBinary;    
    function DefineImageBinary() {
        var image  = convertCanvasToImage(canvas);
        var buffer = new ArrayBuffer(image.data.length);
        var bytes  = new Uint8Array(buffer);

        for (var i=0; i<bytes.length; i++) {
            bytes[i] = image.data[i];
        }

        socket.emit('DefineImageBinary', bytes);
        log('sending image binary. bytes: ');
        log(bytes);
    } 



    // TODO: Need to pass in width and height
    // socket.on("DrawImageBinary", function(imageData, dx, dy,
    // dirtyX, dirtyY, dirtyWidth, dirtyHeight) {

    //     clearRect();

    //     var data   = imageData          || 0;
    //     var height = window.innerHeight || 0;
    //     var width  = window.innerWidth  || 0;
    //     dirtyY = 25;
    //     dirtyX = 25;

    //     dirtyWidth  = dirtyWidth  !== undefined? dirtyWidth: width;
    //     dirtyHeight = dirtyHeight !== undefined? dirtyHeight: height;

    //     var limitBottom = dirtyY + dirtyHeight;
    //     var limitRight  = dirtyX + dirtyWidth;
        
    //     // TODO: why is nothing happening here?
    //     for (var y = dirtyY; y < limitBottom; y++) {
    //         for (var x = dirtyX; x < limitRight; x++) {

    //             var pos = y * width + x;
    //             context.fillStyle = 'rgba(' + data[pos*4+0]
    //                                 + ',' +   data[pos*4+1]
    //                                 + ',' +   data[pos*4+2]
    //                                 + ',' + ( data[pos*4+3]/255) + ')';
    //             context.fillRect(x + dx, y + dy, 1, 1);
    //             }
    //     }
    //     log("drawing image");
    // });
    
    
    
    
    // function(blob) {
    //     log('blob is: ');
    //     log(blob);

    //     var bytes     = new Uint8Array(blob);        
    //     var imageData = context.createImageData(canvas.width, canvas.height);
        
    //     for (var i=8; i<imageData.data.length; i++) {
    //         imageData.data[i] = bytes[i];
    //     }
    //     context.putImageData(imageData, 0, 0);
        
    //     var img        = document.createElement('img');
    //         img.height = canvas.height;
    //         img.width  = canvas.width;
    //         img.src    = canvas.toDataURL();
    //         log('img:');
    //         log(img);
    // });

   // draw line received from server
	socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.strokeStyle = curColor;
      context.strokeStyle = data.color;
      context.stroke();
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