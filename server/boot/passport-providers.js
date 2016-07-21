var debug = require('debug')('uci:boot:passport');
var passport = require('passport');
var providers = require('../providers.json');
//
// Boot script to initialize third party login and linking to all provriders
//

module.exports = function initPassportProviders(app) {
  debug('Initializing providers.');
  for(var i = 0 ; i < providers.length ; i++) {
    initProvider(app, providers[i]);
    debug('Enabled provider : ' + providers[i].name);
  }
};

function initProvider(app, provider) {
  var Strategy = require(provider.module).Strategy;
  passport.use(new Strategy({
      clientID: provider.clientId,
      clientSecret: provider.clientSecret,
      callbackURL: 'http://127.0.0.1:3000/auth/' + provider.name + '/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        var responsedata = {
          provider: profile.provider,
          id: profile.id,
          accessToken: accessToken
        }
        return done(null, responsedata);
      });
    }
  ));

  app.get('/auth/' + provider.name,
    passport.authenticate(provider.name, { scope: provider.scope }),
    function(req, res){
      // The request will be redirected, this is not called.
    });

  app.get('/auth/' + provider.name + '/callback',
    passport.authenticate(provider.name, { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/account');
    });

    // If accounts can be linked to this provider
    if(provider.link) {
      app.get('/link/' + provider.name,
         passport.authorize(provider.name, { failureRedirect: '/login' }),
        function(req, res){
          // The request will be redirected, this is not called.
        });

      app.get('/link/' + provider.name + '/callback',
        passport.authorize(provider.name, { failureRedirect: '/login' }),
        function(req, res) {
          res.redirect('/account');
        });
    }
}
