var loopback = require('loopback');
var boot = require('loopback-boot');
var passport = require('passport');
var session = require('express-session');
var path = require('path');
const crypto = require('crypto');
var async = require('async');

var app = module.exports = loopback();

// Setup the view engine (jade)
var p = path.join(path.dirname(__dirname), 'client');
app.set('views', p);
app.set('view engine', 'jade');

// Configure sessions and passport
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 3600
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.serializeUser = function(user, done) {
  // PassportJS is signalling the creation of a new User.
  // Since this user will authenticate through OAuth and not our LB app
  // It doesn't need (and should not be able to) connect using standard LB /login endpoint
  // Since LB User model requires an email and password anyway
  // Generate a unique email from provider and user's provider id
  // And generate a cryptographically strong password
  async.waterfall([
    // Check user doesn't exist
    function(callback) {
      app.models.Client.find({
        where: {
          provider: user.provider,
          provider_id: user.provider_id
        }
      }, function(err, clients) {
        if (err) return callback(err);
        if (clients.length > 1) return callback(Error('Multiple clients matching search pattern. Aborting'));
        if (clients.length == 1) return callback('ok', clients[0]);
        callback();
      });
    },
    // Then generate unique email and strong password for new user
    function(callback) {
      crypto.randomBytes(256, function(err, buf) {
        if (err) return callback(err);
        var userdata = {
              email: user.id + '@micro-ci.' + user.provider + '.com',
              password: buf.toString('hex'),
              provider: user.provider,
              provider_id: user.id
        }
        callback(null, userdata);
      });
    },
    // Persist it into the database
    function(userdata, callback) {
      app.models.Client.create(userdata, function(err, client) {
        if (err) return callback(err);
        if (!client) return callback(Error('Client could not be created.'));
        callback(null, client);
      });
    },
  ], function(err, client) {
      if (err && err != 'ok') return done(err);

      // Generate a token to return to the client to enable client-side session persistence
      app.models.Client.generateVerificationToken(client, function(err, token) {
        if(err) return done(err);
        var responsedata = {
          userId: client.id,
          accessToken: token
        };
        done(null, responsedata);
      });
  });
};

app.deserializeUser = function(userdata, done) {
  app.models.Client.find({
    where: {
      provider: userdata.provider,
      provider_id: userdata.userid
    }
  }, function(err, user) {
    if(err) return done(err);
    if(!user) return done(Error('Client [' + userdata.provider + '] : ' + userdata.id + 'not found.'));
    done(null, {
      provider_id: user[0].provider_id,
      provider: user[0].provider
    });
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
