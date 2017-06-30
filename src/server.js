var express = require('express');
var cors = require('cors');
var fs = require('fs');

var config = require('../config.js');
var port = config.port || 8082;

var app = express();
app.use(cors()); // enable all CORS requests

app.get('/', function(req, res){
  res.send('Stub Provider is running.');
});

app.use('/stubs', express.static('resources/stubs'));
app.use('/codecs', express.static('resources/codecs'));

app.listen(port, function(){
  console.log((new Date()) + " Stub Provider is listening on port", port);
});
