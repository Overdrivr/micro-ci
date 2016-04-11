var loopback = require('loopback');
var boot = require('loopback-boot');
var passport = require('passport');
var session = require('express-session');
var path = require('path');

var app = module.exports = loopback();

// Setup the view engine (jade)
var p = path.join(path.dirname(__dirname), 'client');
app.set('views', p);
app.set('view engine', 'jade');

// Configure sessions and passport
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

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

// Execute all boot scripts in ./server/boot
boot(app, __dirname);

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
