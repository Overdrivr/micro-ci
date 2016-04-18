
var passport = require('passport');
var providers = require('../providers.example.json');
//
// Boot script to initialize third party login and linking to all provriders
//

module.exports = function initPassportProviders(app) {
  console.log("Initializing providers.");
  for(var i = 0 ; i < providers.length ; i++) {
    initProvider(app, providers[i]);
    console.log("Enabled provider : " + providers[i].name);
  }
};


function initProvider(app, provider) {
  var Strategy = require(provider.module).Strategy;
  passport.use(new Strategy({
      clientID: provider.client_id,
      clientSecret: provider.client_secret,
      callbackURL: 'http://127.0.0.1:3000/auth/' + provider.name + '/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {

        console.log("Called back from " + provider.name);
        console.log(profile.id);
        console.log(profile.displayName);
        console.log(profile.username);
        console.log(profile.profileUrl);
        console.log(profile.emails);
        return done(null, profile);
      });
    }
  ));

  app.get('/auth/' + provider.name,
    passport.authenticate(provider.name, { scope: [ 'user:email' ] }),
    function(req, res){
      // The request will be redirected, not called.
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
          // The request will be redirected, not called.
        });

      app.get('/link/' + provider.name + '/callback',
        passport.authorize(provider.name, { failureRedirect: '/login' }),
        function(req, res) {
          console.log("Linked successfully.");
          res.redirect('/account');
        });
    }
};