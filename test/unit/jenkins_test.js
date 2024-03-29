var assert   = require('assert'),
    Jenkins  = require('../../lib/jenkins'),
    nock =  require('nock'),
    fixtures = require("fixturefiles"),
    should = require('should');

var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nockJenkins = nock(url);
var jenkins =  new Jenkins(url, "099c7823-795b-41b8-81b0-ad92f79492e0");

describe('jenkins', function() {

  afterEach(function(done)
  {
    if(nock.pendingMocks().length >  0) //Make sure no pending mocks are available. Else it could influence the next test
      return done(new Error("Pending mocks in nock :"+ nock.pendingMocks().length))
    nock.cleanAll();
    done();
  });

  describe('build', function() {
    describe('runBuild', function() {
      it('should run a build', function(done) {
        var build_id = 3;
        var jobName = 'build_' + build_id;
        nockJenkins
        .head('/job/' + jobName + '/api/json')
        .reply(404)
        .post('/createItem?name=' + jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://localhost/api/Builds/3/complete</url><event>completed</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>echo &apos;Hello&apos; \nexit 0\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
        .reply(200)
        .post('/job/' + jobName + '/build')
        .reply(201, '', { location: url + '/queue/item/1/' })

        var yaml = {build : ["echo 'Hello' ", "exit 0"]};

        jenkins.build(build_id, yaml, 'http://localhost',
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
        nockJenkins
        .head('/job/' + jobName + '/api/json')
        .reply(200)


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
        nockJenkins
        .head('/job/' + jobName + '/api/json')
        .reply(404)
        jenkins.getBuildStatus(build_id,
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
      nockJenkins
      .head('/job/' + jobName + '/api/json')
      .reply(200)
      .get('/queue/api/json')
      .reply(200, fixtures.emptyQueue)
      .get('/job/' + jobName + '/1/api/json')
      .reply(201, fixtures.jobSuccess)


      jenkins.getBuildStatus(build_id,
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
        nockJenkins
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .get('/queue/api/json')
        .reply(200, fixtures.emptyQueue)
        .get('/job/' + jobName + '/1/api/json')
        .reply(201, fixtures.jobFail)


        jenkins.getBuildStatus(build_id,
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
      nockJenkins
      .head('/job/' + jobName + '/api/json')
      .reply(200)
      .get('/queue/api/json')
      .reply(200, fixtures.emptyQueue)

      .get('/job/' + jobName + '/1/api/json')
      .reply(200, fixtures.jobOngoing)


      jenkins.getBuildStatus(build_id,
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
        nockJenkins
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .get('/queue/api/json')
        .reply(201, fixtures.jobQueue)

        jenkins.getBuildStatus(build_id,
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
        nockJenkins
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .get('/job/' + jobName + '/1/consoleText')
        .reply(200, fixtures.buildLog, { 'Content-Type': 'text/plain;charset=UTF-8' });

        jenkins.getBuildLog(build_id,
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
          nockJenkins
          .head('/job/' + jobName + '/api/json')
          .reply(404)
          jenkins.getBuildLog(build_id,
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
          nockJenkins
          .head('/computer/' + name + '/api/json')
          .reply(404)
          .post("/computer/doCreateItem?" + fixtures.nodeCreateQuery )
          .reply(302, '', { location: 'http://localhost:8080/computer/' });

          jenkins.createNode(id, ip,
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
          nockJenkins
          .head('/computer/' + name + '/api/json')
          .reply(200)
          jenkins.createNode(id, ip,
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
          nockJenkins
          .head('/computer/' + name + '/api/json')
          .reply(404)

          jenkins.removeNode(id,
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
          nockJenkins
          .head('/computer/' + name + '/api/json')
          .reply(200)
          .post('/computer/' + name + '/doDelete')
          .reply(302, '')
          jenkins.removeNode(id,
            function(err)
            {
              should.not.exist(err);
              done();
            });
          });
        });

        describe('GetSlave', function() {
          it('Get on which slave built has been done ', function(done) {
            var build_id = 3;
            var jobName = 'build_' + build_id;
            nockJenkins
            .head('/job/' + jobName + '/api/json')
            .reply(200)
            .get('/job/'+jobName+'/1/api/json')
            .reply(201, fixtures.jobSuccess);

            jenkins.getSlave(build_id,
              function(err, data)
              {
                assert.equal(err, null);
                assert.equal(data, "slave_12");
              });
              done();
            });
          });


          describe('GetSlaveNotExist', function() {
            it('Get slave of an not existing built', function(done) {
              var build_id = 3;
              var jobName = 'build_' + build_id;
              nockJenkins
              .head('/job/' + jobName + '/api/json')
              .reply(404)

              jenkins.getSlave(build_id,
                function(err, data)
                {
                  assert.throws(function(){throw (err);},/Job build_3 does not exist/);
                  assert.equal(data, null);
                });
                done();
              });
            });


    });
});
