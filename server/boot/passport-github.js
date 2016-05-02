
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

//
// Boot script to initialize third party login and linking to github
//

module.exports = function initPassportGithub(app) {
  console.log("Enabling third-party login and link with Github");

  var GITHUB_CLIENT_ID = "4120fdd8fbdae8a65e2d";
  var GITHUB_CLIENT_SECRET = "c607f5e599b0b6dbf54228eeae8c388a73f5c98d";

  app.get('/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] }),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    });

  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/account');
    });

  app.get('/link/github',
     passport.authorize('github', { failureRedirect: '/login' }),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    });

  app.get('/link/github/callback',
  passport.authorize('github', { failureRedirect: '/login' }),
    function(req, res) {
      console.log("Linked successfully.");
      res.redirect('/account');
    });

  passport.use(new GitHubStrategy({
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:3000/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {

        console.log("Called back from github.");
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
};
