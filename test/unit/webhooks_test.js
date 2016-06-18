var request = require('supertest');
var assert = require('chai').assert;
var app = require('../../server/server');
var loopback = require('loopback');
var fakepayload = require('./fake-github-push-payload.json');
var repoId = null;

describe('Fake github webhook', function(){
  // Create a test repository
  before(function(done){
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
        done();
      });
  });
  
  //TODO: Test with tampered data (a wrong secret key)
  //TODO: Test POST a commit with same hash but from different platform
});
