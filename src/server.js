/**
 * stub-provider
 *
 * Danny Koppenhagen <mail@d-koppenhagen.de>
 * Johannes Hamfler <jh@z7k.de>
 */
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

app.use('/stubs', express.static('stubs'), function(req, res){
  res.send('Stub Provider is running.');
});

app.listen(port, function(){
  console.log((new Date()) + " Stub Provider is listening on port", port);
});
