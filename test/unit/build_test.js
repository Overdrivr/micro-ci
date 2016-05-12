var assert = require('assert');

var app = require('../../server/server');


describe('Build_test', function() {

  describe('Build', function() {
    it('Create a build and lunch it on a slave', function(done) {

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
          done();
        }
      )
    });
  })
  });



});
