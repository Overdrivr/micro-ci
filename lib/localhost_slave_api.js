/*
Description: This simple slave api will boot slave on the localhostby sending a transaction on the slave Model
*/
var config  = require('../server/config.json');
var request = require('request');
var utils = require('./utils');
function boot_slave(endpoint, cb)
{
  cb = cb || utils.createPromiseCallback();
  request(endpoint + '/api/Slaves/'+config.host+'/boot', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      cb();
      return ;
    }
    else {
      cb(error);
      return ;
    }
  });
  return cb.promise;

}

exports.boot_slave = boot_slave;
