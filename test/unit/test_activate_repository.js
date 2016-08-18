var request     = require('supertest'),
    assert      = require('chai').assert,
    async       = require('async'),
    clear       = require('clear-require'),
    nock        = require('nock'),
    githubrepo  = require('./github-repos-getall-payload.json')[0];

describe('Repositories /activate endpoint', function() {

  var validtoken  = {},
      secondtoken = {};

  var validclient = {};

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
        validclient = user;
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

  afterEach(function(){
    nock.cleanAll();
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

  it('doesnt allows the remote owner of a repository to activate it with unvalid data',
  function(done){
    request(app)
      .post('/api/Repositories/activate')
      .set('authorization', validtoken)
      .send({
        platform: repodata.platform,
        remoteId: ''
      })
      .expect(500, function (err, res){
        done(err);
      });
  });

  it('doesnt allows the remote owner of a repository to activate it with unvalid data bis',
  function(done){
    request(app)
      .post('/api/Repositories/activate')
      .set('authorization', validtoken)
      .send({
        platform: '',
        remoteId: repodata.remoteId
      })
      .expect(500, function (err, res){
        done(err);
      });
  });

  it('allows the remote owner of a repository to activate it',
  function(done){
    var nockGithub = nock('https://api.github.com/')
      .get('/repositories/' + githubrepo.id)
      .query({access_token: validtoken})
      .reply(200, githubrepo)
      .post('/repositories/'+ githubrepo.owner.login + '/' + githubrepo.name + '/hooks')
      .reply(201, {
        id: 1,
        url: "https://api.github.com/repos/octocat/Hello-World/hooks/1",
        test_url: "https://api.github.com/repos/octocat/Hello-World/hooks/1/test",
        ping_url: "https://api.github.com/repos/octocat/Hello-World/hooks/1/pings",
        name: "web",
        events: [
          'push',
          'pull_request'
        ],
        active: true,
        config: {
          url: "http://example.com/webhook",
          content_type: "json"
        },
        updated_at: "2011-09-06T20:39:23Z",
        created_at: "2011-09-06T17:26:27Z"
      });


    request(app)
      .post('/api/Repositories/activate')
      .set('authorization', validtoken)
      .send(repodata)
      .expect(204, function (err, res){
        assert.lengthOf(nock.pendingMocks(), 0, 'Not all nocked endpoints were called');
        done(err);
      })
  });

  it('finds the created repository', function(done){
    app.models.Repository.find({ where: repodata }, function(err, repos) {
      if (err) return done(err);
      assert.lengthOf(repos, 1);
      done();
    });
  });

  it('finds the created repository through the client instance requesting it',
  function(done){
    validclient.__get__repositories({}, function(err, repos){
      if (err) return done(err);
      assert.lengthOf(repos,1);
      done();
    });
  });

  it('doesnt do anything if remote owner of a repository activate an already active repo',
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
        assert.lengthOf(nock.pendingMocks(), 0, 'Not all nocked endpoints were called');
        done(err);
      });
  });

  it('still only finds a single repository', function(done){
    app.models.Repository.find({ where: repodata }, function(err, repos) {
      if (err) return done(err);
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
        assert.lengthOf(nock.pendingMocks(), 0, 'Not all nocked endpoints were called');
        done(err);
      });
  });

});
