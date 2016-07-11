var fixtures = require("fixturefiles"),
    assert   = require('assert'),
    nock     = require('nock'),
    request  = require('supertest'),
    async    = require('async'),
    clear    = require('clear-require'),
    config    = require('../../server/config'),
    app      = {};

var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nockJenkins = nock(url);

var url =  'http://'+config.host+':'+config.port;
var nockNode = nock(url);


describe('SimpleBuild', function() {

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

  it('Creates a build and launches it on a slave', function(done) {
    //Get next id
    app.models.Build.findOne({order: 'id DESC'},function(err, build) {
      if(build != null)
      {
        var build_id = build.id +1;
      }
      else {
        var build_id = 1;
      }
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
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .head('/computer/'+slaveName+'/api/json')// Slave creation
      .reply(404)
      .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+slave_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%2241bc3d31-9703-40dc-887f-f16561a4d3a6%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")

      .reply(302, '', { location: 'http://localhost:8080/computer/' })
      .head('/job/' + jobName + '/api/json') //Job status
      .reply(200)
      .get('/queue/api/json')
      .reply(200, fixtures.emptyQueue)
      .get('/job/' + jobName + '/1/api/json')
      .reply(201, fixtures.jobSuccess)
      .head('/computer/'+slaveName+'/api/json')
      .reply(200)
      .post('/computer/'+slaveName+'/doDelete')
      .reply(302, '')
      .get('/job/'+jobName+'/1/api/json')
      .reply(201, {"actions":[{"causes":[{"shortDescription":"Started by user anonymous","userId":null,"userName":"anonymous"}]}],"artifacts":[],"building":true,"description":null,"displayName":"#1","duration":0,"estimatedDuration":-1,"executor":{},"fullDisplayName":"Test3 #1","id":"1","keepLog":false,"number":1,"queueId":9,"result":"SUCCESS","timestamp":1461214209569,"url":"http://127.0.0.1:8080/job/Test3/1/","builtOn":slaveName,"changeSet":{"items":[],"kind":null},"culprits":[]});

      nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
      .reply(200);


      app.models.Job.create({
        yaml:{build: ["sleep 3", "echo 'End of Build'"]}
      },
      function(err, job)
      {
        if(err) return done(err);
        app.models.Slave.findOne({where:{id:build_id}},function(err, slave) {
          if(err) return done(err);

          assert.equal(slave.status, "booting");
          //Simulate booted slave:

          request(app)
          .get('/api/Slaves/127.0.0.1/boot')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, function(err, res){
            if(err) return done(err);
            assert.equal(res.body.id, slave_id);

            app.models.Slave.findOne({},function(err, slave) {
              if(err) return done(err);
              assert.equal(slave.status, "building");


              //Simulate build end
              request(app)
              .post('/api/Builds/'+build_id+'/complete')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(204, function(err, res){
                if(err) return done(err);
                app.models.Build.findOne({},function(err, build) {
                  assert.equal(build.status, "success");
                  app.models.Slave.exists(1, function(err, exist) {

                    if(exist)
                    return done(new Error("Slave should be removed because it has been used"))
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
