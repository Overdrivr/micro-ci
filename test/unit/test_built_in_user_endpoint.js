var clear   = require('clear-require'),
    request = require('supertest'),
    assert  = require('chai').assert;
    app     = {},
    token   = {};

describe('User endpoint', function() {

  before(function(done) {
    clear('../../server/server');
    app = require('../../server/server');
    // Create a dummy user to ensure endpoints won't return 404 because model is not found
    // Rather than endpoint does not exist
    app.models.User.create({
      email: 'foo@foo.com',
      password: 'dummy',
      provider: 'local',
      providerId: 1
    }, function(err, user) {
      if (err) return done(err);
      token = user.token;
      done();
    });
  });

  it('must not expose /GET', function(done) {
    request(app)['get']('/api/Users/')
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });
  it('must not expose /PUT', function(done) {
    request(app)['put']('/api/Users/')
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });
  it('must not expose /POST', function(done) {
    request(app)['post']('/api/Users/')
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /GET/count', function(done) {
    request(app)['get']('/api/Users/count' + '?access_token=' + token)
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/login', function(done) {
    request(app)['post']('/api/Users/login' + '?access_token=' + token)
      .send({
        email: 'foo@foo.com',
        password: 'dummy'
      })
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/reset', function(done) {
    request(app)['post']('/api/Users/reset' + '?access_token=' + token)
      .send({
        password: 'bar'
      })
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/update', function(done) {
    request(app)['post']('/api/Users/update' + '?access_token=' + token)
      .send({
        provider: 'foo'
      })
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/logout', function(done) {
    request(app)['post']('/api/Users/logout' + '?access_token=' + token)
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });
});
