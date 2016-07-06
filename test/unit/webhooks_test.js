var request     = require('supertest'),
    clear       = require('clear-require'),
    assert      = require('chai').assert
    fakepayload = require('./fake-github-push-payload.json'),
    repoId      = null,
    app         = {};

var jenkinsURL = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var serverURL =  'http://0.0.0.0:3000';

describe('Fake github webhook', function() {
  var nock = require('nock');
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

    nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
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

    nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
    .reply(200);

    app.models.Repository.create({
      platform: "github",
      remoteId: fakepayload.repository.id
    }, function(err, repo) {
      if (err) return done(err);
      if (!repo) return done(Error("Repository instance not created."));

      repoId = repo.id;
      app.models.Commit.deleteAll({
        id: {neq: 0}
      }, function(err, res) {
        if (err) return done(err);
        done();
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
      .send(fakepayload)
      .expect(204, function(err, res){
        if (err) return done(err);
        done();
      });
  });

  it('can find the new Commit, and its belonging job',
  function(done){
      app.models.Commit.findOne({
        where: {
          commithash: fakepayload.after
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
        remoteId: fakepayload.repository.id
      },
      include: 'commits'
    }, function (err, repo) {
      if (err) return done(err);
      commitData = repo.toJSON();
      assert.strictEqual(commitData.commits.length, 1);
      assert.strictEqual(commitData.commits[0].commithash, fakepayload.after);
      done();
    });
  });

  it('can be called several time with the same data without effect', function (done) {
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send(fakepayload)
      .expect(204, function(err, res) {
        if (err) return done(err);
        app.models.Commit.find({
          'where': {
            'commithash': fakepayload.after
          }
        }, function(err, commits) {
          if (err) return done(err);
          assert.strictEqual(commits.length, 1);
          done();
        });
      });
  });

  //TODO: Test with tampered data (a wrong secret key)
  //TODO: Test POST a commit with same hash but from different platform
});
