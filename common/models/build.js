var jenkinsConf = require('../../server/jenkins.json');
console.log(jenkinsConf.host);
var Jenkins = require('../../lib/jenkins');
var jenkins =  new Jenkins(jenkinsConf.host, jenkinsConf.credential);


module.exports = function(Build) {


  Build.complete = function(id, cb)
  {
    //Update build status to complete:
    Build.findOne({where:{id:req.params.id}}, function(err, build)
    {
      if(err)
        return cb(err);
      //Get build status
      jenkins.get_build_status(build.getId(), function(err, status)
      {
        if(err)
          throw err;
        build.updateAttributes({status: status}, function(err)
        {
          if(err)
            return cb(err);

          cb(null);
        });
      });
    });
  }
  Build.remoteMethod(
    'boot',
    {
      accepts: [{arg: 'id', type: 'number'}],
      http: {path:'/:id/complete'}
    }
  );


    //A build is created
    Build.observe('after save', function (ctx, next)
    {
      if(ctx.isNewInstance !== undefined)
      {
        var build = ctx.instance
        if(build.status == "created")
        {          
          build.updateAttributes({status: "waiting"}, function(err)
          {
            if(err)
              next(err);


            //Get yaml content
            build.job(function(err, job)
            {

              if(err)
                next(err);
              if(job === undefined)
                next(new Error("Build should be link to a job"));


              //push the build to jenkins
              jenkins.build(build.getId(), job.yaml, "http://127.0.0.1:3000/build/"+build.getId()+"/complete", function(err)
              {
                if(err)
                  next(err);

                Slave.check_and_boot_slave(function(err) {
                  if(err)
                    next(err)

                  slave_api.boot_slave("http://127.0.0.1:3000");
                  next();
                });
              });
            });
          });
        }
        else
          next();
      }
      else
        next();
    }
  );
};
