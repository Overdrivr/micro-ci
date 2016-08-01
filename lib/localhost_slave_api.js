/*
Description: This simple slave api will boot slave on the localhostby sending a transaction on the slave Model
*/
var config  = require('../server/config.json');
var request = require('request');
var utils = require('./utils');

function bootSlave(slaveId, endpoint, cb)
{
  cb = cb || utils.createPromiseCallback();
  request.post(endpoint + '/api/Slaves/'+slaveId+'/boot', {form:{ip:config.host}}, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      cb();
      return ;
    } else {
      cb(error);
      return ;
    }
  });
  return cb.promise;
}

function deleteSlave(slaveId, callback)
{
  callback = callback || utils.createPromiseCallback();
  callback();
  return callback.promise;
  //Nothing to do to delete a slave in localhost mode
}

exports.bootSlave = bootSlave;
exports.deleteSlave = deleteSlave;
