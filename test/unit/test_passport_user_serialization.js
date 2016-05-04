var app = require('../../server/server');
var assert = require('chai').assert;

describe('user serialization', function(){
  it('should create a new user the first time', function(done){
    app.serializeUser({
      'provider': 'github',
      'id': 12345
    },
    function(err, userdata){
      app.models.UserIdentity.find(function(err, instances) {
        assert.lengthOf(instances, 1);
        assert.property(instances[0], 'provider');
        assert.property(instances[0], 'provider_id');
        assert.equal(instances[0]['provider'], 'github');
        assert.equal(instances[0]['provider_id'], 12345)
        done(err);
      });
    });
  });

  it('should not create two users for same provider and provider_id', function(done){
    app.serializeUser({
      'provider': 'github',
      'id': 12345
    },
    function(err, userdata) {
      app.models.UserIdentity.find(function(err, instances) {
        assert.lengthOf(instances, 1);
        assert.property(instances[0], 'provider');
        assert.property(instances[0], 'provider_id');
        assert.equal(instances[0]['provider'], 'github');
        assert.equal(instances[0]['provider_id'], 12345)
        done(err);
      });
    });
  });
});
