


describe('Commits endpoint with Unauthenticated client', function() {
  var request = require('supertest'),
      assert  = require('chai').assert,
      commit  = require('./test-setup').commit,
      clear   = require('clear-require'),
      repodata= require('./test-setup').repo;
      app     = require('../../server/server');

  var nock = require('nock');
  var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
  var nockJenkins = nock(url);

  var url =  'http://0.0.0.0:3000';
  var nockNode = nock(url);


  after(function(done)
  {
    if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
      return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
    nock.cleanAll();
    done();
  });


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

    app.models.Repository.create(repodata, function(err, repo) {
      if (err) return done(err);
      if (!repo) return done(Error('Could not create repository.'));

      app.models.Commit.create(commit, function(err, inst) {
        if (err) return done(err);
        if (!inst) return done(Error('Could not create commit.'));
        commit.id = inst.id;
        inst.jobs.create({
            commitId: "f2ea2dcadf",
            yaml:{build: ["sleep 3", "echo 'End of Build'"]}
          },
          function (err, job) {
            if (err) return done(err);
            if (!job) return done(new Error('job was not created'));
            done();
        });
      });
    });
  });

  it('/GET all commits', function(done) {
    request(app)
      .get('/api/Commits')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /PUT Commit', function(done) {
    request(app)
      .put('/api/Commits')
      .set('Accept', 'application/json')
      .send({
        commithash: 'eadeb3f4gg038se',
        repositoryId: 12345
      })
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /POST Commit', function(done) {
    request(app)
    .post('/api/Commits')
    .set('Accept', 'application/json')
    .send({
      commithash: 'eadeb3f4gg038se',
      repositoryId: 12345
    })
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commit by id = 1', function(done) {
    request(app)
    .get('/api/Commits/' + commit.id)
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      assert.deepEqual(res.body.commithash, commit.commithash);
      assert.equal(res.body.repositoryId, commit.repositoryId);
      done();
    });
  });

  it('/HEAD Commit by id = 1', function(done) {
    request(app)
    .head('/api/Commits/' + commit.id)
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /PUT Commit by id', function(done) {
    request(app)
    .put('/api/Commits/' + commit.id)
    .set('Accept', 'application/json')
    .send({
      commithash: 'eadeb3f4gg038se',
      repositoryId: 1245
    })
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /DELETE Commit by id', function(done) {
    request(app)
    .delete('/api/Commits/' + commit.id)
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commit with id exists', function(done) {
    request(app)
    .get('/api/Commits/' + commit.id + '/exists')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      assert(res.body.exists);
      done();
    });
  });

  it('/GET Commit with id = 12345 doesnt exists', function(done) {
    request(app)
    .get('/api/Commits/12345/exists')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      assert.isNotOk(res.body.exists);
      done();
    });
  });

  it('/GET Commit jobs from id', function(done) {
    request(app)
    .get('/api/Commits/' + commit.id + '/jobs')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /POST Commit/jobs with id = 1', function(done) {
    request(app)
    .post('/api/Commits/' + commit.id + '/jobs')
    .set('Accept', 'application/json')
    .send({
      commitId: "efd24e2a"
    })
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /DELETE Commit/jobs with id = 1', function(done) {
    request(app)
    .delete('/api/Commits/' + commit.id + '/jobs')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commits/' + commit.id + '/jobs/1', function(done) {
    request(app)
    .get('/api/Commits/' + commit.id + '/jobs/1')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /PUT Commits/' + commit.id + '/jobs/1', function(done) {
    request(app)
    .put('/api/Commits/' + commit.id + '/jobs/1')
    .send({
      commitId: 'ffeaf324f78d'
    })
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /DELETE Commits/' + commit.id + '/jobs/1', function(done) {
    request(app)
    .delete('/api/Commits/' + commit.id + '/jobs/1')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commits/' + commit.id + '/jobs/count', function(done) {
    request(app)
    .get('/api/Commits/' + commit.id + '/jobs/count')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commits/' + commit.id + '/repository', function(done) {
    request(app)
    .get('/api/Commits/' + commit.id + '/repository')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /GET Commits/change-stream', function(done) {
    request(app)
    .get('/api/Commits/change-stream')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /POST Commits/change-stream', function(done) {
    request(app)
    .post('/api/Commits/change-stream')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /GET Commits/count', function(done) {
    request(app)
    .get('/api/Commits/count')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /GET Commits/findOne', function(done) {
    request(app)
    .get('/api/Commits/findOne')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /POST Commits/update', function(done) {
    request(app)
    .post('/api/Commits/update')
    .send({
      id: 1
    })
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});
