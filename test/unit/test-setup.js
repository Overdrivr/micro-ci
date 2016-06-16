var app;
var clearRequire = require('clear-require');

var repodata = {
  platform: "github",
  remoteId: 12345
};

var commit = {
  commithash: 'al234',
  repositoryId: 222
};


before(function(done) {

  clearRequire('../../server/server');
  app  = require('../../server/server');


    app.models.Repository.create(repodata, function(err, repo) {
      if (err) return done(err);
      if (!repo) return done(Error('Could not create repository.'));

      // Related method not found, to investigate.
      //app.models.Repository.__create__commits({
      app.models.Commit.create({
        commithash: 'fed92efegad289hd',
        repositoryId: 1
      }, function(err, inst) {
        if (err) return done(err);
        if (!inst) return done(Error('Could not create commit.'));

        app.models.Commit.create(commit, function (err, instance) {
          if (err) return done(err);
          commit.id = instance.id;

          instance.jobs.create({
            commitId: "f2ea2dcadf",
            yaml:{build: ["sleep 3", "echo 'End of Build'"]}
          }, function (err, job) {
            if (err) return done(err);
            if (!job) return done(new Error('job was not created'));
            done();
          });
        });
      });
    });
  });

module.exports.repo = repodata;
module.exports.commit = commit;
module.exports.app = app;
