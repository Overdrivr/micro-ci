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

  
};
