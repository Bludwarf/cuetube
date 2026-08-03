//
// # SimpleServer
//
// Play YouTube videos from cuesheets
//
var http = require('http');
var path = require('path');

// Exporter l'application pour les tests
if (process.env.NODE_ENV === 'test') {
  module.exports = app;
}
