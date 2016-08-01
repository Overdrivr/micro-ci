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
        this.state = "RUNNING";
        break;
  }

  callback(null, vm, null);
};

Vm.prototype.delete = function (callback) {

  return callback(null, null, null);
};


function Zone(compute, name) {
  this.compute = compute;
  this.name = name;
  assert(compute != null, "Please provide a valid compute option");
  assert(name != null, "Please provide a valid zone name");
}

Zone.prototype.createVM = function(name, config, callback) {
  assert(name != null, "Please provide a valid slave name");
  assert.deepEqual(config, configGce.InstanceConfig, "Unexpected slave configuration");

  operation = null;
  resp = null;

  vm  = new Vm();
  callback(null, vm, operation, resp);
};


Zone.prototype.vm = function(name, callback) {
  assert(name != null, "Please provide a valid slave name");

  operation = null;
  resp = null;
  vm  = new Vm();

  return vm;
};


function Compute(options) {
  if (!(this instanceof Compute)) {
    return new Compute(options);
  }
}

Compute.prototype.zone = function(name) {
  return new Zone(this, name);
};


module.exports = Compute;
