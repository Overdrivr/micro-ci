var assert = require('assert'),
    clear  = require('clear-require'),
    mockery = require('mockery-next');

describe('CreateJob', function() {

  var fixtures = require("fixturefiles"),
      config   = require('../../server/config'),
      nock     = require('nock'),
      app      = {};

  var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
  var nockJenkins = require('nock')(url);

  var url = 'http://'+config.host+':'+config.port;
  var nockNode = require('nock')(url);

  before(function(){
    mockery.registerSubstitute('../../lib/gce_api', "../../lib/localhost_slave_api");
    mockery.enable({
      useCleanCache: false,
      warnOnUnregistered: false
    });

    clear('../../server/server');
    app = require('../../server/server');
  });

  afterEach(function(done)
  {
    if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
      return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
    nock.cleanAll();

    mockery.deregisterAll();
    mockery.disable();

    done();
  });

  after(function(done)
  {
    mockery.deregisterAll();
    mockery.disable();

    done();
  });


  it('Create a job and check a build is created', function(done) {


    var build_id=1;
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
    .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+slave_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%2241bc3d31-9703-40dc-887f-f16561a4d3a6%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")

    nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
    .reply(200);

    app.models.Job.create({
      yaml:{build: ["sleep 3", "echo 'End of Build'"]}
    },
    function(err, job)
    {
      if(err) return done(err);
        app.models.Build.find({where:{jobId:job.getId()}},function(err, builds) {
          if(err) return done(err);
          assert.equal(builds.length, 1, "Only one build should be created");
          assert.equal(builds[0].status, "waiting", "Build should be waiting");
          done();
        });
    });
  });
});
