var assert = require('assert');
var request = require('request');
var nb_of_build = 5;
var async = require('async');
var config  = require('../../server/config.json');

describe('e2eBuild', function() {
  it('Test e2e build on jenkins', function(done) {
    this.timeout(0);
    request.post('http://'+config.host+':'+config.port+'/api/Jobs', {form:{"yaml": {"build": ["sleep 0", "echo 'End of Build'"]}}},  function(err,httpResponse,body){
      if(err) return done(err);

      function create_func() { return function(cb) {request.post('http://'+config.host+':'+config.port+'/api/Builds', {form:{ "status":"created",  "builddate":"2016",  "jobId":1}},  cb)}}

      var func_array = [];
      for(var i =0; i < nb_of_build; i++)
      func_array.push(create_func());

      async.series(func_array, function(err)
      {
        if(err) return done(err);

        //Wait build complete
        function waitBuild(waitingBuilds)
        {
          if(waitingBuilds)
          {
            request.get('http://'+config.host+':'+config.port+'/api/Builds',  function(err, httpResponse, body)
            {
              builds = JSON.parse(body);
              waitingBuilds = 0;
              for(var i = 0; i <  builds.length ; i++)
              {
                var build = builds[i];
                //console.log(builds);
                if(build.status != 'success')
                {
                  waitingBuilds = 1;
                  break;
                }
              }
              return setTimeout(function() {waitBuild(waitingBuilds)}, 500);
          })
        }
        else {
          //Check all the slave has been removed
          request.get('http://'+config.host+':'+config.port+'/api/Slaves',  function(err, httpResponse, body)
          {
            if(JSON.parse(body).length > 0)
            {
              return done(new Error("Still pending slaves but all builds are complete"));
            }
            return done();

          });
        }

        }
        waitBuild(1);
      })


      });
  })
});
