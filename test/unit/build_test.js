var assert = require('assert');

var app = require('../../server/server');

var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nock = require('nock')(url);


describe('Build_test', function() {

  describe('Build', function() {
    it('Create a build and lunch it on a slave', function(done) {

      var build_id = 1;
      var jobName = 'build_' + build_id;
      nock
      .head('/job/' + jobName + '/api/json')
      .reply(404)
      .post('/createItem?name=build_1', '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://127.0.0.1:3000/build/1/complete</url><event>all</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command></command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })
      app.models.Job.create({
        yaml:"BadYaml"
      },
      function(err, job)
      {
        app.models.Build.create({
          status:"created",
          builddate:new Date(),
          jobId:job.getId()
        },
        function(err, build)
        {
          console.log("Err", err);
          setTimeout(done,5000);
        }
      )
    });
  })
  });



});
