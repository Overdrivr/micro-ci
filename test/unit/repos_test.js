var request = require('supertest'),
    assert  = require('chai').assert,
    app     = require('../../server/server');

var validtoken = '';

describe('Repositories endpoint', function() {
  describe('with unauthenticated user', function (){
    it('doesnt allow to /GET all repos', function(done) {
      request(app)
        .get('/api/Repositories')
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        })
        ;
    });

    it('doesnt allow to /PUT a new repo', function(done) {
      request(app)
        .put('/api/Repositories')
        .set('Accept', 'application/json')
        .send({
          platform: 'github',
          remoteId: 123,
        })
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });

    });
  });

  describe('with authenticated user', function() {
    // Create a test user for authenticated requests
    before(function(done) {
        app.models.Client.create({
          username: "foo",
          email: "foo@foo.com",
          password: "bar"
        }, function(err, user) {
          if (err) return done(err);

          app.models.Client.generateVerificationToken(user,
            function(err, token) {
              if(err) return done(err);
              console.log(token);
              validtoken = token;
              done();
          });
        });
    });

    it('doesnt allow to /PUT a new repo', function(done) {
      request(app)
        .put('/api/Repositories' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .send({
          platform: 'github',
          remoteId: 123,
        })
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
});
