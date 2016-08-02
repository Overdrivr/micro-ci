
var assert = require('assert');
var mockery = require('mockery-next');
var config = require('../../server/config.json');
var nock     = require('nock');


var url =  'http://'+config.host+':'+config.port;
var nockNode = nock(url);

describe('gce-api', function() {
  var slave_id = 4;

  afterEach(function(done)
  {
    if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
      return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
    nock.cleanAll();
    mockery.deregisterAll();
    mockery.disable();

    done();
  });


  describe('gce-api-normal', function() {
    beforeEach(function() {
      mockery.registerSubstitute('gcloud', "./mock/gcloud_mock.js");
      mockery.enable({
        useCleanCache: false,
        warnOnUnregistered: false
      });

    });

    it('Boot a slave', function(done) {
      nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
      .reply(200);

      var gce = require('../../lib/gce_api.js');
      gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
      {
        assert(err == null, "No error should be raised");
        done();
      });
    });

    it('Delete a slave', function(done) {
      var gce = require('../../lib/gce_api.js');
      gce.deleteSlave(slave_id, function (err)
      {
        assert(err == null, "No error should be raised");
        done();
      });
    });

  });

  describe('gce-api-vm-err', function() {
    beforeEach(function() {
      mockery.registerSubstitute('gcloud', "./mock/gcloud_mock.js");
      mockery.registerSubstitute('./mock/gcloud_vm_mock', "./mock/gcloud_vm_err_mock");
      mockery.enable({
        useCleanCache: true,
        warnOnUnregistered: false
      });

    });

    it('Boot a slave and but an error occured', function(done) {
      var gce = require('../../lib/gce_api.js');
      gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
      {
        assert(err == "An error occured", "An error should be raised");
        done();
      });
    });

    it('Delete a slave but an error occured', function(done) {
      var gce = require('../../lib/gce_api.js');
      gce.deleteSlave(slave_id, function (err)
      {
        assert(err == "An error occured", "An error should be raised");
        done();
      });
    });

  });

  describe('gce-api-vm-state-err', function() {
    beforeEach(function() {
      mockery.registerSubstitute('gcloud', "./mock/gcloud_mock.js");
      mockery.registerSubstitute('./mock/gcloud_vm_mock', "./mock/gcloud_vm_err_state_mock");
      mockery.enable({
        useCleanCache: true,
        warnOnUnregistered: false
      });

    });

    it('Boot a slave but unknow state happen', function(done) {
      var gce = require('../../lib/gce_api.js');
      gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
      {
        assert(err == "Error: Unexpected status during instance boot: UNKNOW", "An error should be raised");
        done();
      });
    });
  });

  describe('gce-api-zone-err', function() {
    beforeEach(function() {
      mockery.registerSubstitute('gcloud', "./mock/gcloud_mock.js");
      mockery.registerSubstitute('./mock/gcloud_zone_mock', "./mock/gcloud_zone_err_mock");
      mockery.enable({
        useCleanCache: true,
        warnOnUnregistered: false
      });

    });

    it('Boot a slave but error on createVM', function(done) {
      var gce = require('../../lib/gce_api.js');
      gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
      {
        assert(err == "An error occured", "An error should be raised");
        done();
      });
    });


  });

  describe('gce-api-webhook-err', function() {
    beforeEach(function() {
      mockery.registerSubstitute('gcloud', "./mock/gcloud_mock.js");
      mockery.enable({
        useCleanCache: true,
        warnOnUnregistered: false
      });

    });

    it('Boot a slave but 404', function(done) {
      nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
      .reply(404);

      var gce = require('../../lib/gce_api.js');
      gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
      {
        assert.throws(function(){throw (err);},/Unexpected status code: 404/);
        done();
      });
    });


    it('Boot a slave but error', function(done) {
      nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
      .replyWithError('An error occured');

      var gce = require('../../lib/gce_api.js');
      gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
      {
        assert.throws(function(){throw (err);},/An error occured/);
        done();
      });
    });


  });

});
