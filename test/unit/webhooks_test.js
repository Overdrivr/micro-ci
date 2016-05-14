var request = require('supertest');
var assert = require('chai').assert;
var app = require('../../server/server');
var loopback = require('loopback');

var fakepayload = require('./fake-github-push-payload.json');

describe('Fake github webhook', function(){
  // Create a test repository
  before(function(done){
      app.models.Repository.create({
        platform: "github",
        remoteId: fakepayload.repository.id
      }, done);
  });
  // See https://developer.github.com/v3/activity/events/types/#events-api-payload-19
  // See example test payload https://gist.github.com/tschaub/2463cc33badbeb0dd047
  it('calls the endpoint properly',
  function(done){
    request(app)
      .post('/api/Repositories/webhook/github')
      .set('Accept', 'application/json')
      .send(fakepayload)
      .expect(204, function(err, res){
        if(err) return done(err);
        done();
      });
  });

  it('created a new Commit with received webhook data',
  function(done){
    app.models.Commit.exists(1,function(err, exists) {
      if(!exists) return done(new Error('Commit does not exists.'));
      done();
    });
  });

  it('can find the new Commit and it contains the received data',
  function(done){
      app.models.Commit.findById(1,function(err, instance) {
        if(err) return done(err);
        if(!instance) return done(new Error("Commit not found."));
        assert.equal(instance.commithash, fakepayload.after);
        done();
    });
  });
  //TODO: Test with tampered data (a wrong secret key)
  /*
  it('calls the endpoint with tampered data using a not-existing commit',
  function(done){
    fakepayload.after = "eades4hd83jsswd340ddee"
    request(app)
    .post('/api/Repositories/webhook/github')
    .set('Accept', 'application/json')
    .send(fakepayload)
    .expect(204, function(err, res){
      if(err) return done(err);
      done();
    });
  });*/
});
