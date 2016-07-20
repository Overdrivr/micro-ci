var clear  = require('clear-require'),
    assert = require('chai').assert,
    app    = {};

var user = {
  provider: 'gitlabfoobaryo',
  id: 9683543,
  accessToken: 'eade123'
};

var user2 = {
  provider: 'gitbob',
  id: 96232424032,
  accessToken: '1ade22f3'
}

var serializedUserId;

describe('user serialization', function(){

  before(function(done) {
    clear('../../server/server');
    app = require('../../server/server');

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

  it('initially finds 0 accessToken inside the database', function(done){
    app.models.AccessToken.count(function(err, count){
      if (err) return done(err);
      assert.deepEqual(count, 0);
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

  it('finds the accessToken inside the database afterward', function(done){
    app.models.AccessToken.find(function(err, token){
      if (err) return done(err);
      assert.lengthOf(token, 1);
      assert.deepEqual(token[0].id, user.accessToken);
      done();
    });
  });

  it('doesnt create two users for same provider and id', function(done){
    app.serializeUser({
      provider: user.provider,
      id: user.id,
      accessToken: 'eade14223126fefe'
    }, function(err, userdata) {
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
        id: undefined,
        accessToken: 'eade12fefe'
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with non-valid provider', function(done) {
    app.serializeUser({
        provider: undefined,
        id: user2.id,
        accessToken: 'eade123ae4'
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with non-valid id but same provider than another user', function(done) {
    app.serializeUser({
        provider: user.provider,
        id: undefined,
        accessToken: 'eae123'
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with non-valid provider but same id than another user', function(done) {
    app.serializeUser({
        provider: undefined,
        id: user.id,
        accessToken: 'ead45ee4324e123'
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with valid provider and id but non-existing accessToken', function(done) {
    app.serializeUser({
        provider: user.provider,
        id: user.id + 12345
      }, function(err, userdata) {
        assert.isNotOk(userdata);
        if (err) return done();
        done(Error('Expected error was not returned.'));
    });
  });

  it('doesnt serialize a user with valid provider and id but undefined accessToken', function(done) {
    app.serializeUser({
        provider: user.provider,
        id: user.id + 1234567,
        accessToken: undefined
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
