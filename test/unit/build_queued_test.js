var fixtures = require("fixturefiles")

var assert = require('assert');

var request = require('supertest');

var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nock = require('nock')(url);

var url =  'http://0.0.0.0:3000';
var nockNode = require('nock')(url);


var async = require('async')

var app = require('../../server/server');
describe('QueuedBUild', function() {

  it('Create  multiple builds and check queue is working', function(done) {

    var maxNbOfSlaves = 3; //TODO should be commng from a global var

    function create_job(i, cb)
    {
      var build_id = i;
      var jobName = 'build_' + build_id;
      var slaveName = 'slave_' + build_id;
      nock
      .head('/job/' + jobName + '/api/json') //Job creation
      .reply(404)
      .post('/createItem?name='+jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://0.0.0.0:3000/api/Builds/'+build_id+'/complete</url><event>completed</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>sleep 3\necho &apos;End of Build&apos;\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .head('/computer/'+slaveName+'/api/json')// Slave creation
      .reply(404)
      .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+build_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%22099c7823-795b-41b8-81b0-ad92f79492e0%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")
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
      .head('/job/'+jobName+'/api/json')
      .reply(200)
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
          .post('/api/Slaves/127.0.0.1/boot')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, function(err, res){
            if(err) return done(err);
            assert.equal(res.body.id, build_id);

            app.models.Slave.findOne({where:{id:build_id}},function(err, slave) {
              if(err) return done(err);
              assert.equal(slave.status, "building");
              cb();
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
      nock
      .head('/job/' + jobName + '/api/json') //Job creation
      .reply(404)
      .post('/createItem?name='+jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://0.0.0.0:3000/api/Builds/'+build_id+'/complete</url><event>completed</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command>sleep 3\necho &apos;End of Build&apos;\n</command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .head('/computer/'+slaveName+'/api/json')// Slave creation
      .reply(404)
      .post("/computer/doCreateItem?name="+slaveName+"&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22"+slaveName+"%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22~%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%2C%22hudson-slaves-EnvironmentVariablesNodeProperty%22%3A%7B%22env%22%3A%7B%22key%22%3A%22slave_id%22%2C%22value%22%3A"+build_id+"%7D%7D%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%22099c7823-795b-41b8-81b0-ad92f79492e0%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")
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
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .get('/job/'+jobName+'/1/api/json')
      .reply(201, {"actions":[{"causes":[{"shortDescription":"Started by user anonymous","userId":null,"userName":"anonymous"}]}],"artifacts":[],"building":true,"description":null,"displayName":"#1","duration":0,"estimatedDuration":-1,"executor":{},"fullDisplayName":"Test3 #1","id":"1","keepLog":false,"number":1,"queueId":9,"result":"SUCCESS","timestamp":1461214209569,"url":"http://127.0.0.1:8080/job/Test3/1/","builtOn":slaveName,"changeSet":{"items":[],"kind":null},"culprits":[]});

      nockNode.get('/api/Slaves/127.0.0.1/boot')//localhost boot
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
                .post('/api/Slaves/127.0.0.1/boot')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, function(err, res){
                  if(err) return done(err);
                  assert.equal(res.body.id, build_id);

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
