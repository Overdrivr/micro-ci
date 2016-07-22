var request     = require('supertest'),
    clear       = require('clear-require'),
    assert      = require('chai').assert;

describe('Github webhook', function() {
  var pushPayload = require('./github-webhook-push-payload-repo1.json'),
      pingPayload = require('./github-webhook-ping-payload-repo2.json'),
      repoId      = null,
      config      = require('../../server/config'),
      nock        = require('nock');
      app         = {};

  var jenkinsURL = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
  var serverURL = 'http://'+config.host+':'+config.port;

  var nockJenkins = nock(jenkinsURL);
  var nockNode = nock(serverURL);

  after(function(done)
  {
    if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
      return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
    nock.cleanAll();
    done();
  });

  // Create a test repository
  before(function(done){
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
    .reply(201, '', { location: serverURL + '/queue/item/1/' })

    nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
    .reply(200);

    build_id = 2;
    jobName = 'build_' + build_id;
    slaveName = 'slave_' + build_id;
    slave_id = build_id;
    nockJenkins
    .head('/job/' + jobName + '/api/json') //Job creation
    .reply(404)
    .post('/createItem?name=' + jobName)
    .reply(200)
    .post('/job/' + jobName + '/build')
    .reply(201, '', { location: serverURL + '/queue/item/1/' })

    nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
    .reply(200);

    app.models.Repository.create({
      platform: "github",
      remoteId: pushPayload.repository.id
    }, function(err, repo) {
      if (err) return done(err);
      if (!repo) return done(Error("Repository instance not created."));

      repoId = repo.id;
      app.models.Commit.deleteAll({
        id: {neq: 0}
      }, function(err, res) {
        if (err) return done(err);

        // Create a dummy commit to highlight 2+ instances side-effects
        app.models.Commit.create({
          commithash: 'eadebf2e36'
        }, function(err, commit) {
          if (err) return done(err);
          if (!commit) return done(Error("Commit not created."));

          // Create a dummy github repo to highlight 2+ instances side-effects
          app.models.Repository.create({
            platform: "github",
            remoteId: 1234
          }, function(err, repo) {
            if (err) return done(err);
            if (!repo) return done(Error("Repository instance not created."));
            done();
          });
        });
      });
    });
  });
  // See https://developer.github.com/v3/activity/events/types/#events-api-payload-19
  // See example test payload https://gist.github.com/tschaub/2463cc33badbeb0dd047
  it('calls the endpoint properly',
  function(done){
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send(pushPayload)
      .expect(204, function(err, res){
        if (err) return done(err);
        done();
      });
  });

  it('can find the new Commit, and its belonging job',
  function(done){
      app.models.Commit.findOne({
        where: {
          commithash: pushPayload.after
        },
        include: 'jobs'
      }, function(err, instance) {
        var commitdata = instance.toJSON();
        if (err) return done(err);
        if (!commitdata) return done(new Error("Commit not found."));
        assert.strictEqual(commitdata.jobs.length, 1);
        done();
    });
  });

  it('can find the new Commit from the repository', function (done) {
    app.models.Repository.findOne({
      where: {
        platform: "github",
        remoteId: pushPayload.repository.id
      },
      include: 'commits'
    }, function (err, repo) {
      if (err) return done(err);
      commitData = repo.toJSON();
      assert.strictEqual(commitData.commits.length, 1);
      assert.strictEqual(commitData.commits[0].commithash, pushPayload.after);
      done();
    });
  });

  it('can be called several time with the same data without effect', function (done) {
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send(pushPayload)
      .expect(204, function(err, res) {
        if (err) return done(err);
        app.models.Commit.find({
          'where': {
            'commithash': pushPayload.after
          }
        }, function(err, commits) {
          if (err) return done(err);
          assert.strictEqual(commits.length, 1);
          done();
        });
      });
  });

  it('can be called with ping payload on a non-existing repo and return repo not found',
  function(done){
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send(pingPayload)
      .expect(404, function(err, res){
        if (err) return done(err);
        assert.strictEqual(res.body.error.message, 'Github repository with id '+ pingPayload.repository.id + ' not found.');
        done();
      });
  });

  it('can be called with ping payload on an existing repo and return 204',
  function(done){
    app.models.Repository.create({
      platform: 'github',
      remoteId: pingPayload.repository.id
    })
    .catch(function(err) {
      return done(err);
    })
    .then(function(repo) {
      if(!repo) return done(Error('Test repo for ping payload not created'));

      request(app)
        .post('/api/Repositories/webhook/github')
        .set('Accept', 'application/json')
        .send(pingPayload)
        .expect(204, function(err, res){
          console.log(res.body);
          if (err) return done(err);
          done();
        });
    })
  });


  it('can be called with empty payload without issue',
  function(done){
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send({ })
      .expect(400, function(err, res){
        assert.strictEqual(res.body.error.message, 'repository is a required arg');
        if (err) return done(err);
        done();
      });
  });

  it('can be called with defined /repository/ arg but undefined /after/ arg without issue',
  function(done){
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send({ repository: {} })
      .expect(400, function(err, res){
        assert.strictEqual(res.body.error.message, 'repository.id is undefined');
        if (err) return done(err);
        done();
      });
  });

  it('can be called with defined payload fields with undefined values without issue',
  function(done){
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send({
        after: "",
        repository: {
          id: undefined
        }
      })
      .expect(400, function(err, res){
        assert.strictEqual(res.body.error.message, 'repository.id is undefined');
        if (err) return done(err);
        done();
      });
  });

  //TODO: Test with tampered data (a wrong secret key)
  //TODO: Test POST a commit with same hash but from different platform
});
