var fixtures = require("fixturefiles"),
    assert   = require('assert'),
    request  = require('supertest'),
    async    = require('async'),
    clear    = require('clear-require')
    nock     = require('nock'),
    config    = require('../../server/config'),
    app      = {},
    mockery = require('mockery-next');

var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nockJenkins = nock(url);

var url =  'http://'+config.host+':'+config.port;
var nockNode = nock(url);

describe('QueuedBuild', function() {

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

    mockery.deregisterAll();
    mockery.disable();

    nock.cleanAll();
    done();
  });


  it('Create  multiple builds and check queue is working', function(done) {
    var maxNbOfSlaves = 3; //TODO should be commng from a global var

    function create_job(i, cb)
    {
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
      .post('/createItem?name='+jobName)
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .head('/computer/'+slaveName+'/api/json')// Slave creation
      .reply(404)
      .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+build_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%2241bc3d31-9703-40dc-887f-f16561a4d3a6%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")
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


      nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
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
          .post('/api/Slaves/'+slave_id+'/boot')
          .send({ip: '127.0.0.1'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(204, function(err, res){
            if(err) return done(err);

            app.models.Slave.findOne({where:{id:build_id}},function(err, slave) {
              if(err) return done(err);
              assert.equal(slave.status, "building");
              cb();
            });

          });
        });
      });
    });
  }

    function loopFunction(j, cb)
    {
      create_job(j, function()
      {
        if(j < maxNbOfSlaves)
        {
          j++
          loopFunction(j, cb);
        }
        else
        cb();
      });
    }
    var k = 1;


    loopFunction(k, function()
    {
      //We reached maximum number of slave, if we now create a build it should not create slave
      build_id = maxNbOfSlaves + 1;
      var jobName = 'build_' + build_id;
      var slaveName = 'slave_' + build_id;
      var slave_id = build_id;
      nockJenkins
      .head('/job/' + jobName + '/api/json') //Job creation
      .reply(404)
      .post('/createItem?name='+jobName)
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .head('/computer/'+slaveName+'/api/json')// Slave creation
      .reply(404)
      .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+build_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%2241bc3d31-9703-40dc-887f-f16561a4d3a6%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")
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

      nockNode.post('/api/Slaves/'+slave_id+'/boot')//localhost boot
      .reply(200);

      app.models.Job.create({
        yaml:{build: ["sleep 3", "echo 'End of Build'"]}
      },
      function(err, job)
      {
        app.models.Slave.findOne({where:{id:build_id}},function(err, slave) {
          if(err) return done(err);
          assert.equal(slave, null); //No slave is created



          //End a build and release a slave
          request(app)
          .post('/api/Builds/1/complete')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(204, function(err, res){
            if(err) return done(err);
            app.models.Build.findOne({where:{id:1}},function(err, build) {
              assert.equal(build.status, "success");

              //Check build is now running and slave on
              app.models.Slave.findOne({where:{id:build_id}},function(err, slave) {
                if(err) return done(err);

                assert.equal(slave.status, 'booting');
                //Simulate booted slave:
                request(app)
                .post('/api/Slaves/'+slave_id+'/boot')
                .send({ip: '127.0.0.1'})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(204, function(err, res){
                  if(err) return done(err);

                  app.models.Slave.findOne({where:{id:build_id}},function(err, slave) {
                    if(err) return done(err);
                    assert.equal(slave.status, "building");

                    //Now complete all the build and kill all the slave

                    function create_func(path) { return function(cb) { request(app).post(path).set('Accept', 'application/json').expect('Content-Type', /json/).expect(204, cb)}}
                    var funcArray = [];
                    for(var p=2; p <= maxNbOfSlaves+1; p++ )
                    {
                      var path ='/api/Builds/'+p+'/complete';
                      funcArray.push(create_func(path))
                    }

                    async.series(funcArray, function(err)
                    {
                      app.models.Build.count({status:'success'},function(err, cnt)
                      {
                        assert.equal(cnt, maxNbOfSlaves+1); //All job should be success
                        app.models.Slave.find({},function(err, cnt)
                        {
                          if(err) return done(err);

                          assert.equal(cnt, 0); //All slaves should be removed
                          done();
                        });

                      });

                    }
                  );

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
