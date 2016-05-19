/*
Description: This simple slave api will boot slave on the localhostby sending a transaction on the slave Model
*/

var http = require('http');
function boot_slave(endpoint, cb)
{
  var options = {
    host: endpoint,
    path: '/api/Slaves/127.0.0.1/boot',
    port:3000
  };

  //TODO this is not booting anuthing
  
  /*var req = http.get(options, function(res) {

    //TODO tobe remove
    console.log("Hezy" );
    res.on("data", function(chunk) {
      console.log("BODY: " + chunk);
    });

    cb();
  }).on('error', function(e) {
    console.log("Got error:" +e.message);
    cb(e);
  });*/

  cb();
}

exports.boot_slave = boot_slave;
