var clear = require('clear-require'),
    mockery = require('mockery-next'),
    request = require('supertest');
    assert  = require('chai').assert,
    session = require('supertest-session'),
    nock = require('nock'),
    payload = require('./github-repos-getall-payload.json'),
    passport = require('passport');

describe('Middleware that moves accessToken from req.session.passport to authorization header',
  function(){
  var app = {};
  var testsession = {};
  var clientToken = 'eade123';

  before(function(done){

    mockery.registerSubstitute('../../server/providers.json',
                               './mock/provider-mock.json');
    mockery.enable({
      useCleanCache: false,
      warnOnUnregistered: false
    });

    clear('../../server/server');
    clear('../../server/boot/passport-providers');
    app = require('../../server/server');

    testsession = session(app);

    passport._strategies.mock.verify = function(a,b,c,done){
      done(null, {
        provider: 'github',
        id: 1234,
        accessToken: clientToken
      });
    };
    done();
  });

  after(function(){
    mockery.disable();
    clear('../../server/boot/passport-providers');

    if(nock.pendingMocks().length >  0)
      console.log("Pending mocks in nock :"+ nock.pendingMocks())
    nock.cleanAll();
  });

  it('creates the session ', function(done){
    testsession
      .get('/auth/mock/callback?__mock_strategy_callback=true')
      .expect(302, function(err, res){
        if(err) return done(err);
        done();
      });
  });

  it('makes an authenticated request, simply using the session data',
  function(done){
    var nockGithub = nock('https://api.github.com/')
      .get('/user/repos')
      .query({access_token: clientToken})
      .reply(200, payload);

    testsession.get('/api/Repositories/me/github')
      .expect(200, function(err, res){
        if(err) return done(err);
        assert.lengthOf(res.body.repositories,3);
        assert.deepEqual(res.body.repositories[0], "miccibart/bartjs");
        assert.deepEqual(res.body.repositories[1], "miccibart/Datung");
        assert.deepEqual(res.body.repositories[2], "miccibart/ReadDat");
        done();
    });
  });

});
