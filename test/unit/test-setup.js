var app = require('../../server/server');

var repodata = {
  platform: "github",
  remoteId: 12345
};

before(function(done) {
    app.models.Repository.create(repodata, function(err, repo) {
      if (err) return done(err);
      if (!repo) return done(Error('Could not create repository.'));

      // Related method not found, to investigate.
      //app.models.Repository.__create__commits({
      app.models.Commit.create({
        commithash: 'fed92efegad289hd',
        repositoryId: 1
      }, function(err, commit) {
        if (err) return done(err);
        if (!commit) return done(Error('Could not create commit.'));

        done();
      });
    });
});

module.exports = repodata;
