var request  = require('supertest'),
    assert   = require('chai').assert,
    app      = require('../../server/server');
    repodata = require('./test-setup');

var validtoken = '';

describe('Repositories endpoint', function() {
  describe('with authenticated user', function() {
    // Create a test user for authenticated requests
    before(function(done) {
        app.models.Client.create({
          username: "foo",
          email: "foo@bar.com",
          password: "bar",
          provider: 'github',
          provider_id: 12348566
        }, function(err, user) {
          if (err) return done(err);
          if (!user) return done(new Error('User could not be created'));

          app.models.Client.generateVerificationToken(user,
            function(err, token) {
              if (err) return done(err);
              if (!token) return done(new Error('token could not be created'));
              validtoken = token;
              done();
          });
        });
    });

    it('hides /PUT a new repo', function(done) {
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

    it('hides /POST a new repo', function(done) {
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

    it('/GET a repo by id', function(done) {
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

    it('hides /PUT repo by id with id=1', function(done) {
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

    it('hides /DELETE repo by id with id=1', function(done) {
      request(app)
        .delete('/api/Repositories/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo commits by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('hides /POST repo commits by repo id', function(done) {
      request(app)
        .post('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .send({
          commmithash: 'ead2ed923ud8hd289hd'
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /DELETE repo commits by repo id', function(done) {
      request(app)
        .delete('/api/Repositories/1/commits' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
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

    it('hides /PUT repo commit by repo & commit id', function(done) {
      request(app)
        .put('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .send({
          commithash: 'eade'
        })
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('hides /DELETE repo commit by repo & commit id', function(done) {
      request(app)
        .delete('/api/Repositories/1/commits/1' + '?access_token=' + validtoken)
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
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

    it('hides /POST repo in chunks', function(done) {
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
