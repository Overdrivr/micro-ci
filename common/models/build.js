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
          if(err)
            return cb(err);

          cb(null);
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
