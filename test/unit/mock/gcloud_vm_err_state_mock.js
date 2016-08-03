var assert = require('assert');
var extend = require('extend');
var configGce = require('../../../server/config_gce.json');


function Vm() {
  this.metadata = {};
  this.state = "PROVISIONING";
}

Vm.prototype.get = function (callback) {
  this.metadata = {
    status : this.state,
    networkInterfaces : [{
      accessConfigs: [{
        natIP: "127.0.0.1"
      }]
    }]
  };

  switch(this.state)
  {
    case "PROVISIONING" :
      this.state = "STAGING";
      break;
    case "STAGING" :
        this.state = "UNKNOW"; //Unknow state should failed boot process
        break;
  }

  callback(null, vm, null);
};

Vm.prototype.delete = function (callback) {

  return callback(null, null, null);
};




module.exports = Vm;
