/*
Description: This slave api will boot slave on google compute engine system 
*/
var configGce  = require('../server/config_gce.json');
var request = require('request');
var utils = require('./utils');

var gcloud = require('gcloud')({
  keyFilename: "../server/" + configGce.keyFilename,
  projectId: configGce.projectId
});

var gce = gcloud.compute();
var zone = gce.zone(configGce.zone);


var cb = null;
var endpoint = "";
var slaveId = "";


function doWebhook(ip)
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

function waitBoot(err, vm, apiResponse)
{
  var ip;
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
    ip = vm["metadata"]["networkInterfaces"][0]["accessConfigs"][0]["natIP"];
    console.log("booted IP " + ip );
    doWebhook(ip);
  }
  else {
    cb(new Error ("Unexpected status during instance boot: ") + vm["metadata"]["status"]);
    return ;
  }
}

function bootSlave(slvId, endpt, callback)
{
  slaveId = slvId;
  var slaveName = "slave_" + slaveId;
  cb = callback || utils.createPromiseCallback();

  endpoint = endpt;


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


function deleteSlave(slvId, callback)
{
  slaveId = slvId;
  var slaveName = "slave_" + slaveId;
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



exports.bootSlave = bootSlave;
exports.deleteSlave = deleteSlave;

/*bootSlave("toto", "titi", function(err){
  console.log("AAAA", err);
  deleteSlave("toto", function(err){
    console.log("BBBB", err)
  })
  }
);*/
