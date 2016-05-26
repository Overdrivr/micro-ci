var request = require('supertest'),
    assert  = require('chai').assert,
    app     = require('../../server/server');

require('./test-setup');

var validtoken = '';
var repodata = {
  platform: "github",
  remoteId: 12345
};

describe('Repositories endpoint', function() {
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
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt allow to /POST a new repo', function(done) {
      request(app)
        .post('/api/Repositories/' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .send({
          platform: 'github',
          remoteId: 123,
        })
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('allows /GET a repo by id', function(done) {
      request(app)
        .get('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          assert.deepEqual(res.body.platform, repodata.platform);
          assert.equal(res.body.remoteId, repodata.remoteId);
          done();
        });
    });

    it('/HEAD repo by id with id=1 returns 200', function(done) {
      request(app)
        .head('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('/HEAD repo by id with id=2 returns 404', function(done) {
      request(app)
        .head('/api/Repositories/2' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('doesnt allow /PUT repo by id with id=1', function(done) {
      request(app)
        .put('/api/Repositories/1' + '?access_token=' + validtoken)
        .send({
          platform: 'gitbucket',
          remoteId: 13,
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('doesnt allow /DELETE repo by id with id=1', function(done) {
      request(app)
        .delete('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('allow /GET repo commits by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('doesnt allow /POST repo commits by repo id', function(done) {
      request(app)
        .post('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .send({
          commmithash: 'ead2ed923ud8hd289hd'
        })
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt allow /DELETE repo commits by repo id', function(done) {
      request(app)
        .delete('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo commit by repo & commit id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt allow /PUT repo commit by repo & commit id', function(done) {
      request(app)
        .put('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .send({
          commithash: 'eade'
        })
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt allow /DELETE repo commit by repo & commit id', function(done) {
      request(app)
        .delete('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET commit count by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits/count' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET if repo exists by repo id=1', function(done) {
      request(app)
        .get('/api/Repositories/1/exists' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET if repo exists by repo id doesnt exist', function(done) {
      request(app)
        .get('/api/Repositories/3454/exists' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo owner by repo id=1', function(done) {
      request(app)
        .get('/api/Repositories/1/owner' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo owner if repo doesnt exist', function(done) {
      request(app)
        .get('/api/Repositories/3543/owner' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt find /POST repo in chunks', function(done) {
      request(app)
        .post('/api/Repositories/update' + '?access_token=' + validtoken)
        .send({
          platform: "boo"
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
});