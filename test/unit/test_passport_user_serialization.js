var app = require('../../server/server');
var assert = require('chai').assert;

describe('user serialization', function(){
  it('should create a new user the first time', function(done){
    app.serializeUser({
      'provider': 'github',
      'id': 12345
    },
    function(err, userdata){
      if(err) return done(err);
      assert(userdata, 'userdata is empty.');
      assert.lengthOf(Object.keys(userdata), 2);
      assert.property(userdata, 'accessToken');
      assert.property(userdata, 'userId');
      assert.equal(userdata.userId, 1);

      app.models.Client.find(function(err, instances) {
        if (err) return done(err);
        assert.lengthOf(instances, 1);
        assert.property(instances[0], 'provider');
        assert.property(instances[0], 'provider_id');
        assert.equal(instances[0]['provider'], 'github');
        assert.equal(instances[0]['provider_id'], 12345)
        done();
      });

    });
  });

  it('should not create two users for same provider and provider_id', function(done){
    app.serializeUser({
      'provider': 'github',
      'id': 12345
    },
    function(err, userdata) {
      if(err) return done(err);

      assert(userdata, 'userdata is empty.');
      assert.lengthOf(Object.keys(userdata), 2);
      assert.property(userdata, 'accessToken');
      assert.property(userdata, 'userId');
      assert.equal(userdata.userId, 1);

      app.models.Client.find(function(err, instances) {
        if (err) return done(err);
        assert.lengthOf(instances, 1);
        assert.property(instances[0], 'provider');
        assert.property(instances[0], 'provider_id');
        assert.equal(instances[0]['provider'], 'github');
        assert.equal(instances[0]['provider_id'], 12345)
        done();
      });

    });
  });
});
