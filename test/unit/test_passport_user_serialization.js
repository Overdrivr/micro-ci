var clear  = require('clear-require'),
    app    = require('../../server/server'),
    assert = require('chai').assert;

var user = {
  provider: 'gitlabfoobaryo',
  id: 9683543
};

var user2 = {
  provider: 'gitbob',
  id: 96232424032
}

var serializedUserId;

describe('user serialization', function(){

  before(function()
  {
    delete require.cache[require.resolve('../../server/server')]
    app  = require('../../server/server');
  });

  before(function(done) {
    app.models.Client.create({
      provider: 'github',
      provider_id: 1230323810,
      email: '1230323810@micro-ci.github.com',
      password: 'fowocnroi'
    }, function(err, instances) {
      if (err) return done(err);
      if (!instances) return done(Error('Client could not be created'));
      done();
    });
  });

  it('creates a new user the first time', function(done){
    app.serializeUser(user, function(err, userdata){
      if (err) return done(err);
      assert(userdata, 'userdata is empty.');
      assert.lengthOf(Object.keys(userdata), 2);
      assert.property(userdata, 'accessToken');
      assert.property(userdata, 'userId');
      serializedUserId = userdata.userId;
      app.models.Client.findById(serializedUserId, function(err, instances) {
        if (err) return done(err);
        assert.property(instances, 'provider');
        assert.property(instances, 'provider_id');
        assert.equal(instances['provider'], user.provider);
        assert.equal(instances['provider_id'], user.id)
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

      app.models.Client.findById(serializedUserId, function(err, instances) {
        if (err) return done(err);
        assert.property(instances, 'provider');
        assert.property(instances, 'provider_id');
        assert.equal(instances['provider'], user.provider);
        assert.equal(instances['provider_id'], user.id)
        done();
      });
    });
  });

  it('deserializes the newly created user', function(done) {
    app.deserializeUser({
        userId: serializedUserId,
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

  it('doesnt serialize a user with non-valid id', function(done) {
    app.serializeUser({
        provider: user2.provider,
        provider_id: undefined
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with non-valid provider', function(done) {
    app.serializeUser({
        provider: undefined,
        provider_id: user2.id
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with non-valid id but same provider than another user', function(done) {
    app.serializeUser({
        provider: user.provider,
        provider_id: undefined
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with non-valid provider but same id than another user', function(done) {
    app.serializeUser({
        provider: undefined,
        provider_id: user.id
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt deserialize a user with undefined userId', function(done) {
    app.deserializeUser({
        userId: undefined,
      }, function(err, userdata) {
        assert.isNotOk(userdata, 'Found a user while it should not');
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });
});
