/*
Description: This simple slave api will boot slave on the localhostby sending a transaction on the slave Model
*/

var request = require('request');
function boot_slave(endpoint, cb)
{
  request(endpoint + '/api/Slaves/127.0.0.1/boot', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      return cb();
  }
  else {
    cb(error);
  }
})

}

exports.boot_slave = boot_slave;
