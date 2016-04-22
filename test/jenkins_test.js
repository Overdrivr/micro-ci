var assert = require('assert');

var sinon = require('sinon');
var Jenkins = require('../lib/jenkins');
var should = require('should');
var nock = require('nock');

var assert = require('assert')
var fixtures = require("fixturefiles")
describe('jenkins', function() {
  beforeEach(function() {
    this.sinon = sinon.sandbox.create();
    this.url = process.env.JENKINS_TEST_URL || 'http://localhost:8080';
    this.nock = nock(this.url);

    this.jenkins = new Jenkins.Jenkins(this.url); //TODO review the naming issue

  });

  afterEach(function(done) {
    this.sinon.restore();
    done();
  });

 describe('build', function() {
  describe('runBuild', function() {
  it('should run a build', function(done) {
    var build_id = 3;
    var jobName = 'build_' + build_id;
    this.nock
         .head('/job/' + jobName + '/api/json')
         .reply(404)
         .post('/createItem?name=' + jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://localhost/</url><event>all</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>echo &apos;Hello&apos; \nexit 0\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
         .reply(200)
         .post('/job/' + jobName + '/build')
         .reply(201, '', { location: this.url + '/queue/item/1/' })

  var yaml = {build : ["echo 'Hello' ", "exit 0"]};

  this.jenkins.build(build_id, yaml, "http://localhost/",
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
   this.nock
        .head('/job/' + jobName + '/api/json')
        .reply(200)
        .post('/createItem?name=' + jobName, fixtures.jobCreate)
        .reply(200)
        .post('/job/' + jobName + '/build')
        .reply(201, '', { location: this.url + '/queue/item/1/' })

 var yaml = {build : ["echo 'Hello' ", "exit 0"]};

 this.jenkins.build(build_id, yaml, "http://localhost/",
   function(err, data)
   {
     assert(err != null);
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
     this.nock
          .head('/job/' + jobName + '/api/json')
          .reply(404)
   this.jenkins.get_build_status(build_id,
     function(err, data)
     {
       assert(err != null);
       assert(data == null);
       done();
     });
   });
  });
  });

  describe('JobSucess', function() {
   it('Job succes', function(done) {
     var build_id = 3;
     var jobName = 'build_' + build_id;
     this.nock
          .head('/job/' + jobName + '/api/json')
          .reply(200)
          .get('/queue/api/json')
          .reply(200, fixtures.emptyQueue)
          .get('/job/' + jobName + '/1/api/json')
          .reply(201, fixtures.jobSuccess)


          this.jenkins.get_build_status(build_id,
            function(err, data)
            {
              assert(err == null);
              assert(data == "success");
              done();
            });
   });
  } );

  describe('JobFail', function() {
   it('Job failed', function(done) {
     var build_id = 4;
     var jobName = 'build_' + build_id;
     this.nock
          .head('/job/' + jobName + '/api/json')
          .reply(200)
          .get('/queue/api/json')
          .reply(200, fixtures.emptyQueue)
          .get('/job/' + jobName + '/1/api/json')
          .reply(201, fixtures.jobFail)


          this.jenkins.get_build_status(build_id,
            function(err, data)
            {
              assert(err == null);
              assert(data == "fail");
              done();
            });
   });
  });

  describe('JobOngoing', function() {
   it('Job ongoing', function(done) {
     var build_id = 3;
     var jobName = 'build_' + build_id;
     this.nock
          .head('/job/' + jobName + '/api/json')
          .reply(200)
          .get('/queue/api/json')
          .reply(200, fixtures.emptyQueue)

          .get('/job/' + jobName + '/1/api/json')
          .reply(200, fixtures.jobOngoing)


          this.jenkins.get_build_status(build_id,
            function(err, data)
            {
              assert(err == null);
              assert(data == "ongoing");
              done();
            });
   });

  });

  describe('JobQueued', function() {
   it('Job queued', function(done) {
     var build_id = 3;
     var jobName = 'build_' + build_id;
          this.nock
            .head('/job/' + jobName + '/api/json')
            .reply(200)
            .get('/queue/api/json')
            .reply(201, fixtures.jobQueue)
            .get('/job/'+jobName+'/1/api/json')
            .reply(201);

          this.jenkins.get_build_status(build_id,
            function(err, data)
            {
              assert(err == null);
              assert(data == "waiting");
            });
              done();
   });
  });
});