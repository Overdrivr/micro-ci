

describe('Unauthenticated commits', function (){



describe('Commits endpoint', function() {
  var request  = require('supertest'),
      assert   = require('chai').assert;

  var commit = require('./test-setup').commit;
  var app  = require('../../server/server');

 require('./test-setup');


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
});
