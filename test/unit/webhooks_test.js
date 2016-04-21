var request = require('supertest');
var assert = require('chai').assert;
var app = require('../server/server');
var loopback = require('loopback');

var fakepayload = require('fake-github-push-payload.json');

describe('Fake github webhook', function(){
  // See https://developer.github.com/v3/activity/events/types/#events-api-payload-19
  it('should call the endpoint and the content must be properly decoded',
  function(done){
    request(app)['post']('localhost:3000/api/Repositories/webhook')
      .set('Content-Type', 'application/json')
      .send({
        payload: fakepayload
      })
      .expect(200, function(err, res){
        if(err) return done(err);
        // Check a new commit instance was created under the right repo
        // Check commit instance contains right information
      })
  });
});
