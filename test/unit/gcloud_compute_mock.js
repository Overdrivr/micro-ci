var assert = require('assert');
var extend = require('extend');
var configGce = require('../../server/config_gce.json');


function Vm() {
  var metadata;
}

Vm.prototype.get = function (callback) {
  this.metadata = {
    status : "RUNNING",
    networkInterfaces : [{
      accessConfigs: [{
        natIP: "127.0.0.1"
      }]
    }]
  };

  callback(null, vm, null);
};


function Zone(compute, name) {
  this.compute = compute;
  this.name = name;
  assert(compute != null, "Please provide a valid compute option");
  assert(name != null, "Please provide a valid zone name");
}

Zone.prototype.createVM = function(name, config, callback) {
  var self = this;

  assert(name != null, "Please provide a valid slave name");
  assert.deepEqual(config, configGce.InstanceConfig, "Unexpected slave configuration");

  operation = null;
  resp = null;

  vm  = new Vm();
  callback(null, vm, operation, resp);

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
