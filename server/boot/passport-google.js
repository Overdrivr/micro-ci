var passport = require('passport');
var GoogleOAuthStrategy = require('passport-google-oauth20').Strategy;

module.exports = function initPassportGoogle(app) {
  console.log("Enabling third-party login with Google");

  var GOOGLE_CLIENT_ID = "137968292615-degfvgs90u2c0r4e800tlrv0gti0dosf.apps.googleusercontent.com";
  var GOOGLE_CLIENT_SECRET = "NkPmr4_uv123GcCUGz_zdUBK";

  app.get('/auth/google',
    passport.authenticate('google', { scope: [ 'https://www.googleapis.com/auth/userinfo.email' ] }),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    });

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/account');
    });

  passport.use(new GoogleOAuthStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:3000/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        console.log("Called back from google.");
        //console.log(Object.keys(profile));
        console.log(profile.id);
        console.log(profile.displayName);
        console.log(profile.username);
        console.log(profile.profileUrl);
        console.log(profile.emails);
        return done(null, profile);
      });
    }
  ));
}
