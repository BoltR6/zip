var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
console.log("Server Started");

app.use('/public', express.static(__dirname + '/public'));
app.get('/', function(req, res) {
	//__dirname
	res.sendFile(__dirname+'/main.html');
});
io.on('connection', function(socket) {
	console.log('hi')
	socket.on('disconnect',function(){
		console.log('bye')
	})
});

http.listen(3000, function() {
	console.log('listening on *:3000 ' + __dirname);
});