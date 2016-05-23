var fixtures = require("fixturefiles")

var assert = require('assert');

var app = require('../../server/server');
var request = require('supertest');

var url = process.env.JENKINS_TEST_URL || 'http://127.0.0.1:8080';
var nock = require('nock')(url);

var async = require('async')


//TODO BUILD status is waiting or created but no other status availabe !

  describe('SimpleBuild', function() {
    it('Create a build and lunch it on a slave', function(done) {
      var build_id = 1;
      var jobName = 'build_' + build_id;
      nock
      .head('/job/' + jobName + '/api/json') //Job creation
      .reply(404)
      .post('/createItem?name=' + jobName, '<project><action></action><description></description><keepDependencies>false</keepDependencies><properties><com.tikal.hudson.plugins.notification.HudsonNotificationProperty plugin="notification@1.10"><endpoints><com.tikal.hudson.plugins.notification.Endpoint><protocol>HTTP</protocol><format>JSON</format><url>http://127.0.0.1:3000/build/1/complete</url><event>all</event><timeout>30000</timeout><loglines>0</loglines></com.tikal.hudson.plugins.notification.Endpoint></endpoints></com.tikal.hudson.plugins.notification.HudsonNotificationProperty></properties><scm class="hudson.scm.NullSCM"></scm><canRoam>true</canRoam><disabled>false</disabled><blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding><blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding><triggers></triggers><concurrentBuild>false</concurrentBuild><builders><hudson.tasks.Shell><command></command></hudson.tasks.Shell></builders><publishers></publishers><buildWrappers></buildWrappers></project>')
      .reply(200)
      .post('/job/' + jobName + '/build')
      .reply(201, '', { location: url + '/queue/item/1/' })
      .head('/job/'+jobName+'/api/json')
      .reply(200)
      .head('/computer/slave_1/api/json')// Slave creation
      .reply(404)
      .post("/computer/doCreateItem?name=slave_1&type=hudson.slaves.DumbSlave%24DescriptorImpl&json=%7B%22name%22%3A%22slave_1%22%2C%22nodeDescription%22%3A%22%22%2C%22numExecutors%22%3A1%2C%22remoteFS%22%3A%22%2F%22%2C%22labelString%22%3A%22%22%2C%22mode%22%3A%22NORMAL%22%2C%22type%22%3A%22hudson.slaves.DumbSlave%24DescriptorImpl%22%2C%22retentionStrategy%22%3A%7B%22stapler-class%22%3A%22hudson.slaves.RetentionStrategy%24Always%22%7D%2C%22nodeProperties%22%3A%7B%22stapler-class-bag%22%3A%22true%22%7D%2C%22launcher%22%3A%7B%22stapler-class%22%3A%22hudson.plugins.sshslaves.SSHLauncher%22%2C%22credentialsId%22%3A%22099c7823-795b-41b8-81b0-ad92f79492e0%22%2C%22host%22%3A%22127.0.0.1%22%2C%22port%22%3A22%7D%7D")
      .reply(302, '', { location: 'http://localhost:8080/computer/' })
      .head('/job/' + jobName + '/api/json') //Job status
      .reply(200)
      .get('/queue/api/json')
      .reply(200, fixtures.emptyQueue)
      .get('/job/' + jobName + '/1/api/json')
      .reply(201, fixtures.jobSuccess)
      .head('/computer/slave_1/api/json')
      .reply(200)
      .post('/computer/slave_1/doDelete')
      .reply(302, '');


      app.models.Job.create({
        yaml:{build: ["sleep 3", "echo 'End of Build'"]}
      },
      function(err, job)
      {
        app.models.Build.create({
          status:"created",
          builddate:new Date(),
          jobId:job.getId()
        }, function(err, build)
        {
          app.models.Slave.findOne({},function(err, slave) {
            if(err) return done(err);
            assert.equal(slave.status, "booting");
            //Simulate booted slave:
            request(app)
            .post('/api/Slaves/127.0.0.1/boot')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, function(err, res){
              if(err) return done(err);
              assert.equal(res.body.id, 1);

              app.models.Slave.findOne({},function(err, slave) {
                if(err) return done(err);
                assert.equal(slave.status, "building");


                //Simulate build end
                request(app)
                .post('/api/Builds/1/complete')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(204, function(err, res){
                  if(err) return done(err);
                  app.models.Build.findOne({},function(err, build) {
                    assert.equal(build.status, "success");
                    //Slave end
                    request(app)
                    .post('/api/Slaves/1/end')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(204, function(err, res){
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
  });
