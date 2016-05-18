module.exports = function initRoutes(app) {
  console.log("Enabling routing.");

  // Simple route middleware to ensure user is authenticated.
  //   Use this route middleware on any resource that needs to be protected.  If
  //   the request is authenticated (typically via a persistent login session),
  //   the request will proceed.  Otherwise, the user will be redirected to the
  //   login page.
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }

  /// ROUTING
  app.get('/', function (req, res, next) {
    res.render('pages/index', {
      user: req.user,
      url: req.url
    });
  });

  app.get('/login', function (req, res, next) {
    res.render('pages/login', {
      user: req.user,
      url: req.url
    });
  });

  app.get('/signup', function (req, res, next) {
    res.render('pages/signup', {
      user: req.user,
      url: req.url
    });
  });

  app.get('/account', ensureAuthenticated, function(req, res){
    res.render('pages/loginProfiles', {
       user: req.user,
     });
  });
};
