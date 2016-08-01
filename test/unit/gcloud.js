
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
    done();
  });


  before(function() {
    mockery.registerSubstitute('gcloud', "./gcloud_mock.js");

    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false
    });

    nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
    .reply(200);

  });

  after(function() {
    mockery.deregisterAll();
    mockery.disable();
  });



  it('should format a given machine type', function(done) {
    var gce = require('../../lib/gce_api.js');
    gce.bootSlave(slave_id,'http://' + config.host + ':' + config.port, function (err)
    {      
      assert(err == null, "No error should be raised");
      done();
    });
  });
});
