var request = require('supertest'),
    assert  = require('chai').assert,
    app     = require('../../server/server');

describe('Build endpoint', function() {
  before(function(done){
    app.models.Build.create({
      status: "started",
      log: "fooooo",
      builddate: "2016-05-28",
      buildtime: "2016-05-28",
      text: 0,
      data: 0,
      bss: 0,
      id: 0
    }, function(err, build) {
      if (err) return done(err);
      if (!build) return done(err);
      done();
    })
  });

  it('doesnt expose /GET all builds', function(done) {
    request(app)
      .get('/api/Builds/')
      .set('Accept', 'application/json')
      .expect(401, function(err, res) {
        if (err) return done(err);
        done();
      });
  });

});
