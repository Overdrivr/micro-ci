var app = require('../../server/server');
var request = require('supertest');
var assert = require('chai').assert;
var token = '';

describe('Client endpoint', function() {
  before(function(done) {
    // Create a dummy user to ensure endpoints won't return 404 because model is not found
    // Rather than endpoint does not exist
    app.models.Client.create({
      email: 'foo@foo.com',
      password: 'dummy',
      provider: 'local',
      provider_id: 1
    }, function(err, user) {
      if (err) return done(err);
      token = user.token;
      done();
    });
  });

  it('must not expose /GET', function(done) {
    request(app)['get']('/api/Clients/')
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });
  it('must not expose /PUT', function(done) {
    request(app)['put']('/api/Clients/')
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });
  it('must not expose /POST', function(done) {
    request(app)['post']('/api/Clients/')
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /GET/count', function(done) {
    request(app)['get']('/api/Clients/count' + '?access_token=' + token)
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/login', function(done) {
    request(app)['post']('/api/Clients/login' + '?access_token=' + token)
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
    request(app)['post']('/api/Clients/reset' + '?access_token=' + token)
      .send({
        password: 'bar'
      })
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/update', function(done) {
    request(app)['post']('/api/Clients/update' + '?access_token=' + token)
      .send({
        provider: 'foo'
      })
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });

  it('must not expose /POST/logout', function(done) {
    request(app)['post']('/api/Clients/logout' + '?access_token=' + token)
      .expect(404, function(err, response) {
        if (err) return done(err);
        done();
      });
  });
});
