var assert = require('assert');
var extend = require('extend');


var apis = {
  compute : require('./gcloud_compute_mock')
}

function gcloud(config) {
  assert(config.credentials != null, "Please provide a valid credentials")
  assert(config.projectId != null, "Please provide a project id")

  var gcloudExposedApi = {};
  return Object.keys(apis).reduce(function(gcloudExposedApi, apiName) {    
    var Class = apis[apiName];

    gcloudExposedApi[apiName] = Class;

    return gcloudExposedApi;
  }, gcloudExposedApi);
}

module.exports = extend(gcloud, apis);
