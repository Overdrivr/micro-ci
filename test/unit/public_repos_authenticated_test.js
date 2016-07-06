
describe('Repositories endpoint with authenticated client', function() {
  var request    = require('supertest'),
      assert     = require('chai').assert,
      async      = require('async'),
      clear      = require('clear-require'),
      repodata   = require('./test-setup').repo,
      commit     = require('./test-setup').commit,
      app        = {},
      validtoken = {};

  var nock = require('nock');
  var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
  var nockJenkins = nock(url);

  var url =  'http://0.0.0.0:3000';
  var nockNode = nock(url);

  var fixtures = require("fixturefiles");

    after(function(done)
    {
      if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
        return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
      nock.cleanAll();
      done();
    });

    // Create a test user for authenticated requests
    before(function(done) {
      clear('../../server/server');
      app = require('../../server/server');


      var build_id = 1;
      var jobName = 'build_' + build_id;
      var slaveName = 'slave_' + build_id;
      var slave_id = build_id;

      nockJenkins
      .head('/job/' + jobName + '/api/json') //Job creation
      .reply(404)
      .post('/createItem?name=' + jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://0.0.0.0:3000/api/Builds/'+build_id+'/complete</url><event>completed</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>sleep 3\necho &apos;End of Build&apos;\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })

      nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
      .reply(200);

      async.waterfall([
        function(callback) {
          app.models.Client.create({
            username: "foo",
            email: "foo@foo123112eae1.com",
            password: "bar",
            provider: 'foobarprovider',
            provider_id: 87334702902
          }, function(err, user) {
            if (err) return callback(err);
            if (!user) return callback(new Error('User could not be created'));
            callback(null, user);
          });
        },
        function(user, callback) {
          app.models.Client.generateVerificationToken(user,
          function(err, token) {
            if (err) return callback(err);
            if (!token) return callback(new Error('token could not be created'));
            validtoken = token;
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
        .get('/api/Repositories/1/commits/2' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /PUT repo commit by repo & commit id', function(done) {
      request(app)
        .put('/api/Repositories/1/commits/2' + '?access_token=' + validtoken)
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
        .delete('/api/Repositories/1/commits/2' + '?access_token=' + validtoken)
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
});
