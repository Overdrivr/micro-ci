var assert = require('assert');

var sinon = require('sinon');
var jenkins = require('../lib/jenkins');
var should = require('should');
var nock = require('nock');

var fixtures = require("fixturefiles")
describe('jenkins', function() {
  beforeEach(function() {
    this.sinon = sinon.sandbox.create();

    this.url = process.env.JENKINS_TEST_URL || 'http://localhost:8080';
    this.nock = nock(this.url);
    this.jenkins = jenkins();
  });

  afterEach(function(done) {
    this.sinon.restore();
  });

 describe('build', function() {
  it('should run a build', function(done) {
    var build_id = 3;
    var jobName = 'build_' + build_id;
    this.nock
         .head('/job/' + jobName + '/api/json')
         .reply(404)
         .post('/createItem?name=' + jobName, fixtures.jobCreate)
         .reply(200)
         .head('/job/' + jobName + '/api/json')
         .reply(200);

  var yaml = {build : ["echo 'Hello' ", "exit 0"]};

  console.log(this.jenkins);
  this.jenkins.build(build_id, yaml, "http://localhost/",
    function(err, data)
    {
      should.not.exist(err);
    });
  });

});

});
//var yaml = {build : ["echo 'Hello' ", "sleep 2", "exit 1"]};
//create_job("42", yaml, "http://localhost/");


/*
get_build_status(42, function(err, status)
  {
    if(err) throw err;
    console.log("status: " + status);
  });
//*/
/*
get_build_log(42, function(err, log)
  {
    if(err) throw err;
    console.log("status: " + log);
  });
*/
