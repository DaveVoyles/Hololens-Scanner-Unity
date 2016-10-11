var express  = require('express'),
    app      = express(),
    http     = require('http'),
    socketIo = require('socket.io');

// start webserver on port 8080
var server       =  http.createServer(app);
var io           = socketIo.listen(server);
var table        = require('console.table');
var fs           = require('fs');
    server.listen(8080);
var line_history = [];
var log          = console.log.bind(console);
var fs           = require('fs');

app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

io.on('connection', function (socket) {

    socket.on('error', function(e) {
        console.log(e);
    });

   // First send the history to the new client
   for (var i in line_history) {
      socket.emit('draw_line', { line: line_history[i] } );
   }

   // Received line to history, then send line to all clients
   socket.on('draw_line', function (data) {
      line_history.push(data.line);
      io.emit('draw_line', { line: data.line });
   });
  
    socket.on('divimg', (payload) => {
         socket.broadcast.emit('divimg', payload);
    });

   socket.on('imgBinary', (payload) => {
         socket.broadcast.emit('imgBinary', payload);
    });

});