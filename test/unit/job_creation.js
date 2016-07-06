
describe('CreateJob', function() {

  var fixtures = require("fixturefiles")
  var app = require('../../server/server');
  var assert = require('assert');

  var nock = require('nock');
  var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
  var nockJenkins = require('nock')(url);

  var url =  'http://0.0.0.0:3000';
  var nockNode = require('nock')(url);

  var clear = require('clear-require');

  before(function(){
    clear('../../server/server');
    app = require('../../server/server');
  });

  afterEach(function(done)
  {
    if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
      return done(new Error("Pending mocks in nock :"+ nock.pendingMocks()))
    nock.cleanAll();
    done();
  });


  it('Create a job and check a builds are created', function(done) {


    var build_id=1;
    var jobName = 'build_' + build_id;
    var slaveName = 'slave_' + build_id;
    var slave_id = build_id;
    nockJenkins
    .head('/job/' + jobName + '/api/json') //Job creation
    .reply(404)
    .post('/createItem?name=' + jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://0.0.0.0:3000/api/Builds/'+build_id+'/complete</url><event>completed</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>sleep 3\necho &apos;End of Build&apos;\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
    .reply(200)
    .post('/job/' + jobName + '/build')
    .reply(201, '', { location: url + '/queue/item/1/' })
    .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+slave_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%22099c7823-795b-41b8-81b0-ad92f79492e0%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")

    nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
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
