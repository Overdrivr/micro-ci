var request = require('supertest'),
    assert  = require('chai').assert,
    app     = require('../../server/server');

require('./test-setup');

var repodata = {
  platform: "github",
  remoteId: 12345
};

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
          platform: 'bitbucket',
          remoteId: 123,
        })
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt allow to /POST a new repo', function(done) {
      request(app)
        .post('/api/Repositories')
        .set('Accept', 'application/json')
        .send({
          platform: 'bitbucket',
          remoteId: 123,
        })
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('allows /GET a repo by id', function(done) {
      request(app)
        .get('/api/Repositories/1')
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
        .head('/api/Repositories/1')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('/HEAD repo by id with id=2 returns 404', function(done) {
      request(app)
        .head('/api/Repositories/2')
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('doesnt allow /PUT repo by id with id=1', function(done) {
      request(app)
        .put('/api/Repositories/1')
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
        .delete('/api/Repositories/1')
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('allow /GET repo commits by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          assert.property(res,'body');
          done();
        });
    });

    it('doesnt allow /POST repo commits by repo id', function(done) {
      request(app)
        .post('/api/Repositories/1/commits')
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
        .delete('/api/Repositories/1/commits')
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo commit by repo & commit id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits/1')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt allow /PUT repo commit by repo & commit id', function(done) {
      request(app)
        .put('/api/Repositories/1/commits/1')
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
        .delete('/api/Repositories/1/commits/1')
        .set('Accept', 'application/json')
        .expect(401, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET commit count by repo id', function(done) {
      request(app)
        .get('/api/Repositories/1/commits/count')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET if repo exists by repo id=1', function(done) {
      request(app)
        .get('/api/Repositories/1/exists')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET if repo exists by repo id doesnt exist', function(done) {
      request(app)
        .get('/api/Repositories/3454/exists')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo owner by repo id=1', function(done) {
      request(app)
        .get('/api/Repositories/1/owner')
        .set('Accept', 'application/json')
        .expect(200, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('/GET repo owner if repo doesnt exist', function(done) {
      request(app)
        .get('/api/Repositories/3543/owner')
        .set('Accept', 'application/json')
        .expect(404, function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it('doesnt find /POST repo in chunks', function(done) {
      request(app)
        .post('/api/Repositories/update')
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
