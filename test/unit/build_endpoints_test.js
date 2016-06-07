var request = require('supertest'),
    assert  = require('chai').assert,
    app     = require('../../server/server');

var builddata = {
  status: "started",
  log: "fooooo",
  builddate: "2016-05-28",
  buildtime: "2016-05-28",
  text: 0,
  data: 0,
  bss: 0
};

describe('Build endpoint with unauthenticated client', function() {
  before(function(done){
    app.models.Build.create(builddata, function(err, build) {
      if (err) return done(err);
      if (!build) return done(new Error('test build instance could not be created'));
      done();
    })
  });

  it('hides /GET all builds', function(done) {
    request(app)
      .get('/api/Builds/')
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /PUT a build', function(done) {
    request(app)
      .put('/api/Builds/')
      .send(builddata)
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /POST a build', function(done) {
    request(app)
      .post('/api/Builds/')
      .send(builddata)
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/GET a build by id', function(done) {
    request(app)
      .get('/api/Builds/1')
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        assert.property(res, 'body');
        assert.deepEqual(builddata.log, res.log);
        done();
      });
  });

  it('/HEAD an existing build returns 200', function(done) {
    request(app)
      .head('/api/Builds/1')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/HEAD a non existing build returns 404', function(done) {
    request(app)
      .head('/api/Builds/12133423')
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /PUT a build by id', function(done) {
    request(app)
      .put('/api/Builds/1')
      .send(builddata)
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /DELETE a build by id', function(done) {
    request(app)
      .delete('/api/Builds/1')
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/GET/exists a build', function(done) {
    request(app)
      .get('/api/Builds/1/exists')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/GET/exists a non existing build', function(done) {
    request(app)
      .get('/api/Builds/213123121/exists')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/GET parent job from a build id', function(done) {
    request(app)
      .get('/api/Builds/1/job')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /GET build change-stream', function(done) {
    request(app)
      .get('/api/Builds/1/change-stream')
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /POST build change-stream', function(done) {
    request(app)
      .post('/api/Builds/1/change-stream')
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/GET build count', function(done) {
    request(app)
      .get('/api/Builds/count')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('/GET build findOne', function(done) {
    request(app)
      .get('/api/Builds/findeOne')
      .send({
        where: {
          id: 1
        }
      })
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('hides /POST build in chunks', function(done) {
    request(app)
      .post('/api/Builds/update')
      .send({
        builddata,
        builddata
      })
      .set('Accept', 'application/json')
      .expect(404, function(err, res) {
        if (err) return done(err);
        done();
      });
  });


});
