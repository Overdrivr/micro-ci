var jenkins = require('../../lib/jenkins'); //TODO this should be available for anyone
var slave_api = require('../../lib/localhost_slave_api');

//TODO put site name (127.0.0.1/ micro-ci.com) in a variable
//TODO manage the err and not throw them
//TODO replace on method by operation hooks
module.exports = function slavesManager(app) {

  console.log(app.get('nbOfSlaves'));
  console.log("Enabling slaves manager");


  //A build is created
  Build.observe('after save', function (ctx, next())
  {
    if(ctx.isNewInstance !== undefined)
    {
      var build = ctx.instance
      if(build.status == "created")
      {
        build.updateAttributes({status: "waiting"}, function(err)
        {
          if(err)
            throw err;

          //Get yaml content
          build.job(function(err, job)
          {
            //push the build to jenkins
            jenkins.build(build.getId(), job.yaml, "http://127.0.0.1:3000/build/"+build.getId()+"/complete", function(err)
            {
              if(err)
                throw err;

              Slave.check_and_boot_slave(function(err) {
                if(!err)//We can boot a slave
                  slave_api.boot_slave("http://127.0.0.1:3000");
              });
            });
          });
        });
      }
    }
    next();
  }
);

}
