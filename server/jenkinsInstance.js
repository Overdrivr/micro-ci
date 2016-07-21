var Jenkins = require('../lib/jenkins');

var host = 'http://127.0.0.1:8080';
//This key is the one used in the docker image
var credential = '41bc3d31-9703-40dc-887f-f16561a4d3a6';

exports.jenkinsInstance = new Jenkins(host, credential);
