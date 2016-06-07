var request  = require('supertest'),
    assert   = require('chai').assert,
    app      = require('../../server/server');

var commit = {
  commithash: 'al234',
  repositoryId: 222
};

describe('Commits endpoint', function() {
  before(function(done){
    app.models.Commit.create(commit, function (err, instance) {
      if (err) return done(err);

      instance.jobs.create({
        commitId: "f2ea2dcadf"
      }, function (err, job) {
        if (err) return done(err);
        if (!job) return done(new Error('job was not created'));
        done();
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
    .get('/api/Commits/1')
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
    .head('/api/Commits/1')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /PUT Commit by id', function(done) {
    request(app)
    .put('/api/Commits/1')
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
    .delete('/api/Commits/1')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commit with id = 1 exists', function(done) {
    request(app)
    .get('/api/Commits/1/exists')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
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

  it('/GET Commit with id = 1 jobs', function(done) {
    request(app)
    .get('/api/Commits/1/jobs')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /POST Commit/jobs with id = 1', function(done) {
    request(app)
    .post('/api/Commits/1/jobs')
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
    .delete('/api/Commits/1/jobs')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commits/1/jobs/1', function(done) {
    request(app)
    .get('/api/Commits/1/jobs/1')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /PUT Commits/1/jobs/1', function(done) {
    request(app)
    .put('/api/Commits/1/jobs/1')
    .send({
      commitId: 'ffeaf324f78d'
    })
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('hides /DELETE Commits/1/jobs/1', function(done) {
    request(app)
    .delete('/api/Commits/1/jobs/1')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commits/1/jobs/count', function(done) {
    request(app)
    .get('/api/Commits/1/jobs/count')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('/GET Commits/1/repository', function(done) {
    request(app)
    .get('/api/Commits/1/repository')
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
