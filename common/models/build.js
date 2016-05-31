var jenkinsConf = require('../../server/jenkins.json');
var Jenkins = require('../../lib/jenkins');
var jenkins =  new Jenkins(jenkinsConf.host, jenkinsConf.credential);

//TODO put site name (127.0.0.1/ micro-ci.com) in a variable
//TODO manage the err and not throw them

module.exports = function(Build) {
  var pendingBuild=0;

  Build.get_nbPendingBuild = function()
  {
    return pendingBuild;
  }

  Build.inc_nbPendingBuild = function()
  {
    pendingBuild++;
  }

  Build.dec_nbPendingBuild = function()
  {
    if(pendingBuild > 0)
    {
      pendingBuild--;
      return null;
    }
    else {
      return new Error("There is no pendingBuild. Cannot decrease the counter.");

    }
  }


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

              Build.inc_nbPendingBuild();
              Build.app.models.Slave.check_and_boot_slave(function(err) {
                if(err) return next(err);
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

  Build.complete = function(id, cb)
  {
    //Update build status to complete:
    Build.findOne({where:{id:id}}, function(err, build)
    {
      if(err)
      return cb(err);
      //Get build status
      jenkins.get_build_status(build.getId(), function(err, status)
      {
        if(err)
        return cb(err);
        build.updateAttributes({status: status}, function(err)
        {
          if(err) return cb(err);

          //Remove the slave
          jenkins.get_slave(build.getId(), function(err, slaveName)
          {
            if(err) return cb(err);
            var Slave = Build.app.models.Slave;
            var slave_id = parseInt(slaveName.match(/\d+/g)[0]);
            Slave.findOne({where:{id:slave_id}}, function(err, slave)
            {
              if(err) return cb(err);
              if(!slave) return cb(new Error("No slave with ID:" + slave_id));

              //Remove the slave node from jenkins
              jenkins.remove_node(slave.getId(), function(err) {
                if(err) return cb(err);

                //Remove the slave in the db
                Slave.destroyById(slave.getId(), function(err)
                {
                  if(err) return cb(err);
                    Slave.check_and_boot_slave(function(err) {
                      if(err) return cb(err);
                      cb(null, slave.getId());
                  });
                });
              });
            });
          });
        });
      });
    });
  }
  Build.remoteMethod(
    'complete',
    {
      accepts: [{arg: 'id', type: 'number'}],
      http: {path:'/:id/complete', verb: 'post'}
    }
  );
};
