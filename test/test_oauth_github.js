var assert = require('assert');
var request = require('supertest');
var app = require('../server/server');
var parse = require('url-parse');

describe('User', function() {
  it('should be redirected to github when clicking /auth/github', function(done) {
    request(app)['get']('/auth/github')
      .set('Accept', 'application/json') // Accept json or something else ?
      .expect(302, function(err, res) {
        if (err)  return done(err);
        url = parse(res.headers.location, true);
        assert.equal(url.host, 'github.com');
        done();
      });
  });
});

describe('micro-ci', function() {
  it('should decode github callback on auth/github/callback', function(done) {
    request(app)['get']('/auth/github/callback')// TODO: Add a fake token to the response otherwise passport will attempt again to redirect to github
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);
        console.log(res.headers);
        done();
      });
  });
});
