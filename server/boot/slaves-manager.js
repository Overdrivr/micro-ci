var jenkinsConf = require('../../server/jenkins.json');
var Jenkins = require('../../lib/jenkins');
var jenkins =  new Jenkins(jenkinsConf.host, jenkinsConf.credential);


//TODO put site name (127.0.0.1/ micro-ci.com) in a variable
//TODO manage the err and not throw them
module.exports = function slavesManager(app) {

  //TODO this function is here because I need to have access to slave model. What do you think Remi?
  //A build is created
  app.models.Build.observe('after save', function (ctx, next)
  {
    if(ctx.isNewInstance !== undefined)
    {
      var build = ctx.instance
      if(build.status == "created")
      {
        build.updateAttributes({status: "waiting"}, function(err)
        {
          if(err)
            return next(err);


          //Get yaml content
          build.job(function(err, job)
          {

            if(err)
              return next(err);
            if(job === undefined)
              return next(new Error("Build should be link to a job"));


            //push the build to jenkins
            jenkins.build(build.getId(), job.yaml, "http://127.0.0.1:3000", function(err)
            {
              if(err)
                return next(err);

              app.models.Build.inc_nbPendingBuild();
              app.models.Slave.check_and_boot_slave(function(err) {
                if(err)
                  return next(err);
                return next();
              });
            });
          });
        });
      }
      else
        return  next();
    }
    else
      return  next();
  });
}
