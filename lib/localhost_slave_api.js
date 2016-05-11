/*
Description: This simple slave api will boot slave on the localhost
*/

var http = require('http');
function boot_slave(endpoint)
{
    var options = {
    host: endpoint,
    path: '/slaveManager/slave/127.0.0.1/boot'
  };
  var req = http.get(options, function(res) {});
}

exports.boot_slave = boot_slave;
