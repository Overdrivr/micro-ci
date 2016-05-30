var jenkinsConf = require('../../server/jenkins.json');
var Jenkins = require('../../lib/jenkins');
var jenkins =  new Jenkins(jenkinsConf.host, jenkinsConf.credential);


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
