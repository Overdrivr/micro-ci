var url = process.env.JENKINS_TEST_URL || 'http://localhost:8080';

var assert = require('assert');

var Jenkins = require('../../lib/jenkins');
var jenkins =  new Jenkins(url, "099c7823-795b-41b8-81b0-ad92f79492e0");

var should = require('should');
var nock = require('nock')(url);

var assert = require('assert')
var fixtures = require("fixturefiles")
describe('jenkins', function() {

  describe('build', function() {
    describe('runBuild', function() {
      it('should run a build', function(done) {
        var build_id = 3;
        var jobName = 'build_' + build_id;
        nock
        .head('/job/' + jobName + '/api/json')
        .reply(404)
        .post('/createItem?name=' + jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://localhost//api/Build/3/complete</url><event>all</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://localhost//api/Slave/{slave_id}/end</url><event>all</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>echo &apos;Hello&apos; \nexit 0\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
        .reply(200)
        .post('/job/' + jobName + '/build')
        .reply(201, '', { location: url + '/queue/item/1/' })

        var yaml = {build : ["echo 'Hello' ", "exit 0"]};

        jenkins.build(build_id, yaml, "http://localhost/",
        function(err, data)
        {
          should.not.exist(err);
          done();
        });
      });

    });

    describe('Job exist', function() {
      it('The job already exist', function(done) {
        var build_id = 3;
        var jobName = 'build_' + build_id;
        nock
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .post('/createItem?name=' + jobName, fixtures.jobCreate)
        .reply(200)
        .post('/job/' + jobName + '/build')
        .reply(201, '', { location: url + '/queue/item/1/' })

        var yaml = {build : ["echo 'Hello' ", "exit 0"]};

        jenkins.build(build_id, yaml, "http://localhost/",
        function(err, data)
        {
          assert.throws(function(){throw (err);},/Job build_3 already exist/);
          assert.equal(data, null);
          done();
        });
      });

    });

  });


  describe('GetStatus', function() {
    describe('Notexist', function() {
      it('Job does not exist', function(done) {
        var build_id = 3;
        var jobName = 'build_' + build_id;
        nock
        .head('/job/' + jobName + '/api/json')
        .reply(404)
        jenkins.get_build_status(build_id,
          function(err, data)
          {
            assert.throws(function(){throw (err);},/Job build_3 does not exist/);
            assert.equal(data, null);
            done();
          });
        });
      });


  describe('JobSucess', function() {
    it('Job succes', function(done) {
      var build_id = 3;
      var jobName = 'build_' + build_id;
      nock
      .head('/job/' + jobName + '/api/json')
      .reply(200)
      .get('/queue/api/json')
      .reply(200, fixtures.emptyQueue)
      .get('/job/' + jobName + '/1/api/json')
      .reply(201, fixtures.jobSuccess)


      jenkins.get_build_status(build_id,
        function(err, data)
        {
          assert.equal(err, null);
          assert.equal(data, "success");
          done();
        });
      });
    } );

    describe('JobFail', function() {
      it('Job failed', function(done) {
        var build_id = 4;
        var jobName = 'build_' + build_id;
        nock
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .get('/queue/api/json')
        .reply(200, fixtures.emptyQueue)
        .get('/job/' + jobName + '/1/api/json')
        .reply(201, fixtures.jobFail)


        jenkins.get_build_status(build_id,
          function(err, data)
          {
            assert.equal(err, null);
            assert.equal(data, "fail");
            done();
          });
        });
      });

  describe('JobOngoing', function() {
    it('Job ongoing', function(done) {
      var build_id = 3;
      var jobName = 'build_' + build_id;
      nock
      .head('/job/' + jobName + '/api/json')
      .reply(200)
      .get('/queue/api/json')
      .reply(200, fixtures.emptyQueue)

      .get('/job/' + jobName + '/1/api/json')
      .reply(200, fixtures.jobOngoing)


      jenkins.get_build_status(build_id,
        function(err, data)
        {
          assert.equal(err, null);
          assert.equal(data, "ongoing");
          done();
        });
      });

    });

    describe('JobQueued', function() {
      it('Job queued', function(done) {
        var build_id = 3;
        var jobName = 'build_' + build_id;
        nock
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .get('/queue/api/json')
        .reply(201, fixtures.jobQueue)
        .get('/job/'+jobName+'/1/api/json')
        .reply(201);

        jenkins.get_build_status(build_id,
          function(err, data)
          {
            assert.equal(err, null);
            assert.equal(data, "waiting");
          });
          done();
        });
      });
    });

  describe('log', function() {
    describe('GetLog', function() {
      it('Return build log', function(done) {
        var build_id = 3;
        var jobName = 'build_' + build_id;
        nock
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .get('/job/' + jobName + '/1/consoleText')
        .reply(200, fixtures.buildLog, { 'Content-Type': 'text/plain;charset=UTF-8' });

        jenkins.get_build_log(build_id,
          function(err, data)
          {
            should.not.exist(err);
            assert.equal(data, fixtures.buildLog);
            done();
          });
        });

      });

      describe('Notexist', function() {
        it('Job does not exist', function(done) {
          var build_id = 3;
          var jobName = 'build_' + build_id;
          nock
          .head('/job/' + jobName + '/api/json')
          .reply(404)
          jenkins.get_build_log(build_id,
            function(err, data)
            {
              assert.throws(function(){throw (err);},/Job build_3 does not exist/);
              assert.equal(data, null);
              done();
            });
          });
        });

      });

    describe('node', function() {
      describe('CreateNode', function() {
        it('Create a simple ssh node', function(done) {
          var ip = "92.128.12.7";
          var id = 62;
          var name = "slave_" + id;
          nock
          .head('/computer/' + name + '/api/json')
          .reply(404)
          .post("/computer/doCreateItem?" + fixtures.nodeCreateQuery )
          .reply(302, '', { location: 'http://localhost:8080/computer/' });

          jenkins.create_node(id, ip,
            function(err, data)
            {
              should.not.exist(err);
              should.not.exist(data);
              done();
            });
          });

        });
      describe('NodeExist', function() {
        it('Create Node already exist', function(done) {
          var ip = "92.128.12.7";
          var id = 62;
          var name = "slave_" + id;
          nock
          .head('/computer/' + name + '/api/json')
          .reply(200)
          jenkins.create_node(id, ip,
            function(err, data)
            {
              assert.throws(function(){throw (err);},/Node slave_62 already exist/);
              should.not.exist(data);
              done();
            });
          });

        });

      describe('RemoveNodeDoesNotExist', function() {
        it('Remove a Node which does not exist', function(done) {
          var id = 62;
          var name = "slave_" + id;
          nock
          .head('/computer/' + name + '/api/json')
          .reply(404)

          jenkins.remove_node(id,
            function(err)
            {
              assert.throws(function(){throw (err);},/Node slave_62 does not exist/);
              done();
            });
          });
        });

      describe('RemoveNode', function() {
        it('Remove a node', function(done) {
          var id = 62;
          var name = "slave_" + id;
          nock
          .head('/computer/' + name + '/api/json')
          .reply(200)
          .post('/computer/' + name + '/doDelete')
          .reply(302, '')
          jenkins.remove_node(id,
            function(err)
            {
              should.not.exist(err);
              done();
            });
          });
        });
    });
});
