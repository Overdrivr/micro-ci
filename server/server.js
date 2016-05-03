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

app.serializeUser = function(user, done) {
  var userdata = {
    "provider": user.provider,
    "provider_id": user.id
  };
  //TODO: Check it cannot create two different users in the database with same provider and provider_id
  app.models.UserIdentity.upsert(userdata, function(err, models) {
    if (err) return done(err);
    if (!models) return done(Error('Client could not be created.'));
    done(null, userdata);
  });
};

app.deserializeUser = function(userdata, done) {
  app.models.UserIdentity.find({
    where: {
      provider: userdata.provider,
      provider_id: userdata.userid
    }
  }, function(err, user) {
    if(err) return done(err);
    if(!user) return done(Error('Client [' + userdata.provider + '] : ' + userdata.id + 'not found.'));
    console.log("Found user", user);
    done(null, user);
  });
};

passport.serializeUser(app.serializeUser);
passport.deserializeUser(app.deserializeUser);

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
