/*
Description: This slave api will boot slave on google compute engine system
*/
var configGce  = require('../server/config_gce.json');
var request = require('request');
var utils = require('./utils');

var gcloud = require('gcloud')({
  credentials: require( "../server/" + configGce.keyFilename),
  projectId: configGce.projectId
});

var gce = gcloud.compute();
var zone = gce.zone(configGce.zone);




function doWebhook(slaveId, ip, endpoint, cb)
{
  request.post(endpoint + '/api/Slaves/'+slaveId+'/boot', {form:{ip:ip}}, function (error, response, body) {
  if (!error && response.statusCode === 200) {
    cb();
    return ;
  } else {
    cb(error);
    return ;
  }
  });
}


function waitBoot(slaveId, endpoint, vm, cb)
{
  function getStatus(err, vm, apiResponse)
  {
    if(err) {
      cb(err);
      return err;
    }

    if(vm["metadata"]["status"] == "PROVISIONING" || vm["metadata"]["status"] == "STAGING")
    {
      setTimeout(function(){ vm.get(getStatus)}, 1000);
    }
    else if(vm["metadata"]["status"] == "RUNNING")
    {
      var ip = vm["metadata"]["networkInterfaces"][0]["accessConfigs"][0]["natIP"];
      doWebhook(slaveId, ip, endpoint, cb);
    }
    else {
      cb(new Error ("Unexpected status during instance boot: ") + vm["metadata"]["status"]);
      return ;
    }

  }
  vm.get(getStatus);
}

function bootSlave(slvId, endpt, callback)
{


  var slaveName = "slave-" + slvId;
  var cb = callback || utils.createPromiseCallback();

  zone.createVM(slaveName, configGce.InstanceConfig,
    function callback(err, vm, operation, apiResponse) {
      if(err){
        cb(err);
        return ;
      }
      //NOTE: Performance improvement can be done here. Return the promise now and do the
      //boot monitoring asynchronously with the request
      waitBoot(slvId, endpt, vm, cb);

    });
  return cb.promise;
}


function deleteSlave(slaveId, callback)
{
  var slaveName = "slave-" + slaveId;
  callback = callback || utils.createPromiseCallback();
  var vm = zone.vm(slaveName);
  vm.delete(function(err, operation, apiResponse) {
    if(err) {
      callback(err)
      return ;
    }
    callback();
    return;
  });

  return callback.promise;
}



exports.bootSlave = bootSlave;
exports.deleteSlave = deleteSlave;
