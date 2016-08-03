var assert = require('assert');
var extend = require('extend');
var configGce = require('../../../server/config_gce.json');


var Vm = require('./gcloud_vm_mock');
var Zone = require('./gcloud_zone_mock');


function Compute(options) {
  if (!(this instanceof Compute)) {
    return new Compute(options);
  }
}

Compute.prototype.zone = function(name) {
  return new Zone(this, name);
};


module.exports = Compute;
