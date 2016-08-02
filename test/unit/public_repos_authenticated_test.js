var request     = require('supertest'),
    assert      = require('chai').assert,
    async       = require('async'),
    clear       = require('clear-require'),
    ttl         = require('../../server/session-config.json').ttl,
    repoPayload = require('./github-repos-getall-payload.json'),
    mockery = require('mockery-next');


describe('Repositories endpoint with authenticated client', function() {

  var config     = require('../../server/config'),
      fixtures   = require("fixturefiles"),
      nock       = require('nock');
      app        = {},
      validtoken = {};

  var repodata = {
    platform: "github",
    remoteId: 12345
  };

  var commit = {
    commithash: 'al234',
    repositoryId: 222
  };

  var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
  var nockJenkins = nock(url);

  var url =  'http://'+config.host+':'+config.port;
  var nockNode = nock(url);


    after(function(done)
    {
      if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
        return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
      nock.cleanAll();

      mockery.deregisterAll();
      mockery.disable();

      done();
    });

    // Create a test user for authenticated requests
    before(function(done) {
      mockery.registerSubstitute('../../lib/gce_api', "../../lib/localhost_slave_api");
      mockery.enable({
        warnOnUnregistered: false
      });

      clear('../../server/server');
      app = require('../../server/server');

      var build_id = 1;
      var jobName = 'build_' + build_id;
      var slaveName = 'slave_' + build_id;
      var slave_id = build_id;

      nockJenkins
      .head('/job/' + jobName + '/api/json') //Job creation
      .reply(404)
      .post('/createItem?name=' + jobName)
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })

      nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
      .reply(200);

      async.waterfall([
        function(callback) {
          app.models.Client.create({
            username: "foo",
            email: "foo@foo123112eae1.com",
            password: "bar",
            provider: 'foobarprovider',
            providerId: 87334702902
          }, function(err, user) {
            if (err) return callback(err);
            if (!user) return callback(new Error('User could not be created'));
            callback(null, user);
          });
        },
        function(user, callback) {
          user.createAccessToken(ttl, function(err, token) {
            if (err) return callback(err);
            if (!token) return callback(new Error('token could not be created'));
            validtoken = token.id;
            callback();
          });
        },
        function(callback) {
          app.models.Repository.create(repodata, function(err, repo) {
            if (err) return callback(err);
            if (!repo) return callback(Error('Could not create repository.'));
            callback(null, repo);
          });
        },
        function(repository, callback) {
          repository.commits.create(commit, function(err, inst) {
            if (err) return done(err);
            if (!inst) return done(Error('Could not create commit.'));
            commit.id = inst.id;
            callback(null, inst);
          });
        },
        function(commit, callback) {
          commit.jobs.create({
              commitId: "f2ea2dcadf",
              yaml:{build: ["sleep 3", "echo 'End of Build'"]}
            },
            function (err, job) {
              if (err) return callback(err);
              if (!job) return callback(new Error('job was not created'));
              callback();
          });
        }
      ], function(err, result) {
        if (err) return done(err);
        done();
      });
    });

    it('hides /PUT a new repo', function(done) {
      request(app)
        .put('/api/Repositories' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .send({
          platform: 'github',
          remoteId: 123,
        })
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /POST a new repo', function(done) {
      request(app)
        .post('/api/Repositories/' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .send({
          platform: 'github',
          remoteId: 123,
        })
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET a repo by id', function(done) {
      request(app)
        .get('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          assert.deepEqual(res.body.platform, repodata.platform);
          assert.equal(res.body.remoteId, repodata.remoteId);
          done();
        });
    });

    it('/HEAD repo by id with id=1 returns 200', function(done) {
      request(app)
        .head('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('/HEAD repo by id with id=2 returns 404', function(done) {
      request(app)
        .head('/api/Repositories/2' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('hides /PUT repo by id with id=1', function(done) {
      request(app)
        .put('/api/Repositories/1' + '?access_token=' + validtoken)
        .send({
          platform: 'gitbucket',
          remoteId: 13,
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('hides /DELETE repo by id with id=1', function(done) {
      request(app)
        .delete('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo commits by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('hides /POST repo commits by repo id', function(done) {
      request(app)
        .post('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .send({
          commmithash: 'ead2ed923ud8hd289hd'
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /DELETE repo commits by repo id', function(done) {
      request(app)
        .delete('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo commit by repo & commit id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /PUT repo commit by repo & commit id', function(done) {
      request(app)
        .put('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .send({
          commithash: 'eade'
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /DELETE repo commit by repo & commit id', function(done) {
      request(app)
        .delete('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET commit count by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits/count' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET if repo exists by repo id=1', function(done) {
      request(app)
        .get('/api/Repositories/1/exists' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET if repo exists by repo id doesnt exist', function(done) {
      request(app)
        .get('/api/Repositories/3454/exists' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo owner by repo id=1', function(done) {
      request(app)
        .get('/api/Repositories/1/owner' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo owner if repo doesnt exist', function(done) {
      request(app)
        .get('/api/Repositories/3543/owner' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /POST repo in chunks', function(done) {
      request(app)
        .post('/api/Repositories/update' + '?access_token=' + validtoken)
        .send({
          platform: "boo"
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET /me/github returns user repo list when authenticated',
    function(done) {
      var nockGithub = nock('https://api.github.com/')
        .get('/user/repos')
        .query({access_token: validtoken})
        .reply(200, repoPayload);

      request(app)
        .get('/api/Repositories/me/github' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.lengthOf(res.body.repositories,3);
          assert.deepEqual(res.body.repositories[0], "miccibart/bartjs");
          assert.deepEqual(res.body.repositories[1], "miccibart/Datung");
          assert.deepEqual(res.body.repositories[2], "miccibart/ReadDat");
          done();
        });
    });
});
