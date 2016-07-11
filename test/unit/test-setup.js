var app;

var repodata = {
  platform: "github",
  remoteId: 12345
};

var commit = {
  commithash: 'al234',
  repositoryId: 222
};


var config    = require('../../server/config');
var nock = require('nock');
var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nockJenkins = nock(url);

var url =  'http://'+config.host+':'+config.port;
var nockNode = nock(url);


var fixtures = require("fixturefiles");


after(function(done)
{
  if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
    return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
  nock.cleanAll();
  done();
});

before(function(done) {

    delete require.cache[require.resolve('../../server/server')]
    app  = require('../../server/server');

    var build_id = 1;
    var jobName = 'build_' + build_id;
    var slaveName = 'slave_' + build_id;
    var slave_id = build_id;

    nockJenkins
    .head('/job/' + jobName + '/api/json') //Job creation
    .reply(404)
    .post('/createItem?name=' + jobName)
    .reply(200)
    .post('/job/' + jobName + '/build')
    .reply(201, '', { location: url + '/queue/item/1/' })

    nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
    .reply(200);

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
