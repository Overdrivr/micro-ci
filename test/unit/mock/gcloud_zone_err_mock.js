var assert = require('assert');
var extend = require('extend');
var configGce = require('../../../server/config_gce.json');

var Vm = require('./gcloud_vm_mock');


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
  callback("An error occured", vm, operation, resp);
};


Zone.prototype.vm = function(name, callback) {
  assert(name != null, "Please provide a valid slave name");

  operation = null;
  resp = null;
  vm  = new Vm();

  return vm;
};



module.exports = Zone;
