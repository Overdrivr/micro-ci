var Jenkins = require('../lib/jenkins');

var host = "http://127.0.0.1:8080";
var credential = "099c7823-795b-41b8-81b0-ad92f79492e0";

exports.jenkinsInstance = new Jenkins(host, credential);
