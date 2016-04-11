var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

// Setup the view engine (jade)
var path = require('path');
var p = path.join(path.dirname(__dirname), 'client');

app.set('views', p);
app.set('view engine', 'jade');

// boot scripts mount components like REST API
boot(app, __dirname);

//// PASSPORT RELATED STUFF
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
var GoogleOAuthStrategy = require('passport-google-oauth20').Strategy;
var session = require('express-session');

var GITHUB_CLIENT_ID = "4120fdd8fbdae8a65e2d";
var GITHUB_CLIENT_SECRET = "c607f5e599b0b6dbf54228eeae8c388a73f5c98d";

var GOOGLE_CLIENT_ID = "137968292615-degfvgs90u2c0r4e800tlrv0gti0dosf.apps.googleusercontent.com"
var GOOGLE_CLIENT_SECRET = "NkPmr4_uv123GcCUGz_zdUBK"

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

passport.use(new GoogleOAuthStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
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

passport.serializeUser(function(user, done) {
  console.log("Serializing User");
  console.log(Object.keys(user));
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("Deserializing User");
  console.log(Object.keys(obj));
  done(null, obj);
});

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

/// ROUTING
app.get('/', function (req, res, next) {
  res.render('pages/index', {user:
    req.user,
    url: req.url
  });
});

app.get('/login', function (req, res, next) {
  res.render('pages/login', {user:
    req.user,
    url: req.url
  });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('pages/loginProfiles', {
     user: req.user,

   });
});

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

// GET /auth/google
app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'https://www.googleapis.com/auth/userinfo.email' ] }),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/google/callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
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

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  console.log("not authenticated, redirecting.")
  res.redirect('/login');
}
