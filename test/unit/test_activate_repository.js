var request     = require('supertest'),
    assert      = require('chai').assert,
    async       = require('async'),
    clear       = require('clear-require'),
    nock        = require('nock'),
    githubrepo  = require('./github-repos-getall-payload.json')[0];

describe('Repositories /activate endpoint', function() {

  var validtoken  = {},
      secondtoken = {};

  var repodata = {
    platform: 'github',
    remoteId: githubrepo.id
  };

  // Create a test user for authenticated requests
  before(function(done) {
    console.log(repodata);
    clear('../../server/server');
    app = require('../../server/server');

    async.waterfall([
      function(callback) {
        // Create a first test user
        app.models.Client.create({
          username: "foo",
          email: "foo@foo123112eae1.com",
          password: "bar",
          provider: 'github',
          providerId: githubrepo.owner.id
        }, function(err, user) {
          if (err) return callback(err);
          if (!user) return callback(new Error('User could not be created'));
          callback(null, user);
        });
      },
      function(user, callback) {
        user.createAccessToken(1000000, function(err, token) {
          if (err) return callback(err);
          if (!token) return callback(new Error('token could not be created'));
          validtoken = token.id;
          callback();
        });
      },
      // Create a second test user
      function(callback) {
        app.models.Client.create({
          username: "bar",
          email: "bar@foo123112eae1.com",
          password: "bar",
          provider: 'github',
          providerId: 123456
        }, function(err, user) {
          if (err) return callback(err);
          if (!user) return callback(new Error('User could not be created'));
          callback(null, user);
        });
      },
      function(user, callback) {
        user.createAccessToken(1000000, function(err, token) {
          if (err) return callback(err);
          if (!token) return callback(new Error('token could not be created'));
          secondtoken = token.id;
          callback();
        });
      }
    ], function(err, result) {
      if (err) return done(err);
      done();
    });
  });

  it('doesnt allow unauthenticated clients to activate a repository',
  function(done){
    request(app)
      .post('/api/Repositories/activate')
      .send(repodata)
      .expect(401, function (err, res){
        if (err) {
          return done(err);
        }
        done();
      })
  });

  it('allows the remote owner of a repository to activate it',
  function(done){
    var nockGithub = nock('https://api.github.com/')
      .get('/repositories/' + githubrepo.id)
      .query({access_token: validtoken})
      .reply(200, githubrepo);

    request(app)
      .post('/api/Repositories/activate')
      .set('authorization', validtoken)
      .send(repodata)
      .expect(204, function (err, res){
        console.log(res.body);
        assert.lengthOf(nock.pendingMocks(), 0);
        if (err) return done(err);
        nock.cleanAll();
        done();
      })
  });

  it('finds the created repository', function(done){
    app.models.Repository.find({ where: repodata }, function(err, repos) {
      if (err) return done(err);
      assert.lengthOf(repos, 1);
      done();
    });
  });

  it('allows the remote owner of a repository to activate it again',
  function(done){
    var nockGithub = nock('https://api.github.com/')
      .get('/repositories/' + githubrepo.id)
      .query({access_token: validtoken})
      .reply(200, githubrepo);

    request(app)
      .post('/api/Repositories/activate')
      .set('authorization', validtoken)
      .send(repodata)
      .expect(204, function (err, res){
        assert.lengthOf(nock.pendingMocks(), 0);
        if (err) return done(err);
        nock.cleanAll();
        done();
      });
  });

  it('still only finds a single repository', function(done){
    app.models.Repository.find({ where: repodata }, function(err, repos) {
      if (err) return done(err);
      console.log(repos);
      assert.lengthOf(repos, 1);
      done();
    });
  });

  it('doesnt allow an authenticated user but not the owner of a repository to activate it',
  function(done){
    var nockGithub = nock('https://api.github.com/')
      .get('/repositories/' + githubrepo.id)
      .query({access_token: secondtoken})
      .reply(200, githubrepo);

    request(app)
      .post('/api/Repositories/activate')
      .set('authorization', secondtoken)
      .send(repodata)
      .expect(401, function (err, res){
        console.log(res.body);
        assert.lengthOf(nock.pendingMocks(), 0);
        if (err) return done(err);
        nock.cleanAll();
        done();
      });
  });

});
