
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

//
// Boot script to initialize third party login and linking to github
//

module.exports = function initPassportGithub(app) {
  console.log("Enabling third-party login and link with Github");

  var GITHUB_CLIENT_ID = "4120fdd8fbdae8a65e2d";
  var GITHUB_CLIENT_SECRET = "c607f5e599b0b6dbf54228eeae8c388a73f5c98d";

  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHub will redirect the user
  //   back to this application at /auth/github/callback
  app.get('/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] }),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    });

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/account');
    });

  // GET /link/githu
  //  Use authorize to link a third party account to the account
  app.get('/link/github',
     passport.authorize('github', { failureRedirect: '/login' }),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    });

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/link/github/callback',
  passport.authorize('github', { failureRedirect: '/login' }),
    function(req, res) {
      console.log("Linked successfully.");
      res.redirect('/account');
    });

  /*

  app.post('/signup', function (req, res, next) {

    var Client = app.models.Client;

    var newUser = {};
    newUser.email = req.body.email.toLowerCase();
    newUser.username = req.body.username.trim();
    newUser.password = req.body.password;

    Client.create(newUser, function (err, user) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        console.log("Created ",user);
        // Passport exposes a login() function on req (also aliased as logIn())
        // that can be used to establish a login session. This function is
        // primarily used when users sign up, during which req.login() can
        // be invoked to log in the newly registered user.
        req.login(user, function (err) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          return res.redirect('/auth/account');
        });
      }
    });
  });
  */

  passport.use(new GitHubStrategy({
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:3000/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {

        // To keep the example simple, the user's GitHub profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the GitHub account with a user record in your database,
        // and return that user instead.
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
