/*
Description: This simple slave api will boot slave on the localhostby sending a transaction on the slave Model
*/
var config  = require('../server/config.json');
var configGce  = require('../server/config_gce.json');
var request = require('request');
var utils = require('./utils');

var gcloud = require('gcloud')({
  keyFilename: "../server/" + configGce.keyFilename,
  projectId: configGce.projectId
});

var gce = gcloud.compute();
var zone = gce.zone(configGce.zone);

var cb =null;


function doWebhook(ip) //STOP HERE 
{

}

function waitBoot(err, vm, apiResponse)
{
  if(err) {
    cb(err);
    return err;
  }

  if(vm["metadata"]["status"] == "PROVISIONING" || vm["metadata"]["status"] == "STAGING")
  {
    setTimeout(function(){ vm.get(waitBoot)}, 1000);
  }
  else if(vm["metadata"]["status"] == "RUNNING")
  {
    console.log("booted IP " +  vm["metadata"]["networkInterfaces"][0]["accessConfigs"][0]["natIP"]);
    cb();
  }
  else {
    cb(new Error ("Unexpected status during instance boot: ") + vm["metadata"]["status"]);
    return ;
  }
}

function bootSlave(slaveName, endpoint, callback)
{
  cb = callback || utils.createPromiseCallback();


  zone.createVM(slaveName, configGce.InstanceConfig,
    function callback(err, vm, operation, apiResponse) {
      if(err){
        cb(err);
        return ;
      }
      vm.get(waitBoot);
    });
  return cb.promise;
}


function deleteSlave(slaveName, callback)
{
  callback = callback || utils.createPromiseCallback();
  var vm = zone.vm(slaveName);
  vm.delete(function(err, operation, apiResponse) {
    if(err) {
      callback(err)
      return err;
    }
    callback();
    return;
  });

  return cb.promise;

}

/*cb = cb || utils.createPromiseCallback();
request(endpoint + '/api/Slaves/'+config.host+'/boot', function (error, response, body) {
if (!error && response.statusCode === 200) {
cb();
return ;
} else {
cb(error);
return ;
}
});
return cb.promise;*/
/*bootSlave("toto", "titi", function(err){
  console.log("AAAA", err);
  deleteSlave("toto", function(err){
    console.log("BBBB", err)
  })
  }
);
*/


exports.bootSlave = bootSlave;
