var app = require('../../server/server');
var assert = require('chai').assert;

var user = {
  provider: 'github',
  id: 9683543 // Using id instead of provider_id because Passport will call this function and provide a remote id
};

//TODO: Test serialization and deserialization with undefined data and make sure nothing happens

describe('user serialization', function(){
  it('creates a new user the first time', function(done){
    app.serializeUser(user, function(err, userdata){
      if (err) return done(err);
      assert(userdata, 'userdata is empty.');
      assert.lengthOf(Object.keys(userdata), 2);
      assert.property(userdata, 'accessToken');
      assert.property(userdata, 'userId');

      app.models.Client.find({
         where: {
           provider: user.provider,
           provider_id: user.id
         }
       }, function(err, instances) {
        if (err) return done(err);
        assert.lengthOf(instances, 1);
        assert.property(instances[0], 'provider');
        assert.property(instances[0], 'provider_id');
        assert.equal(instances[0]['provider'], user.provider);
        assert.equal(instances[0]['provider_id'], user.id)
        done();
      });
    });
  });

  it('doesnt create two users for same provider and provider_id', function(done){
    app.serializeUser(user, function(err, userdata) {
      if(err) return done(err);
      assert(userdata, 'userdata is empty.');
      assert.lengthOf(Object.keys(userdata), 2);
      assert.property(userdata, 'accessToken');
      assert.property(userdata, 'userId');

      app.models.Client.find({
        where: {
          provider: user.provider,
          provider_id: user.id
        }
      }, function(err, instances) {
        if (err) return done(err);
        assert.lengthOf(instances, 1);
        assert.property(instances[0], 'provider');
        assert.property(instances[0], 'provider_id');
        assert.equal(instances[0]['provider'], user.provider);
        assert.equal(instances[0]['provider_id'], user.id)
        done();
      });
    });
  });

  it('finds the newly created user', function(done) {
    app.deserializeUser({
        provider: user.provider,
        provider_id: user.id
      }, function(err, userdata) {
        if (err) return done(err);
        assert(userdata, 'userdata is empty.');
        assert.lengthOf(Object.keys(userdata), 2);
        assert.property(userdata, 'provider');
        assert.property(userdata, 'provider_id');
        assert.deepEqual(userdata.provider, user.provider);
        assert.deepEqual(userdata.provider_id, user.id);
        done();
    });
  });

  it('doesnt find a user with undefined provider', function(done) {
    app.deserializeUser({
        provider: undefined,
        provider_id: user.id
      }, function(err, userdata) {
        assert.isNotOk(userdata, 'Found a user while it should not');
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt find a user with undefined id', function(done) {
    app.deserializeUser({
        provider: user.provider,
        provider_id: undefined
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt find a user with non-exisiting provider but valid id', function(done) {
    app.deserializeUser({
        provider: 'hithub',
        provider_id: user.id
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });
});
