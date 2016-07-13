var jenkins = require('../../server/jenkinsInstance').jenkinsInstance;
var config  = require('../../server/config.json');


module.exports = function(Build) {
  var pendingBuild = 0;

  Build.get_nbPendingBuild = function() {
    return pendingBuild;
  }

  Build.inc_nbPendingBuild = function() {
    pendingBuild++;
  }

  Build.dec_nbPendingBuild = function() {
    if(pendingBuild > 0) {
      pendingBuild--;
    } else {
      return new Error("There is no pendingBuild. Cannot decrease the counter.");
    }
  }

  //A build is created
  Build.observe('after save', function (ctx, next) {
    if(!ctx.isNewInstance) return  next();
    var build = ctx.instance;
    if(build.status !== "created") return  next();

    build.updateAttributes({ status: "waiting" })
    .then(function() {
      build.job(function(err, job)
      {
        if(err) throw err;
        if(job === undefined) throw new Error("Build should be link to a job");
        return  jenkins.build(build.getId(), job.yaml, "http://"+config.host+":"+config.port);
      })
    })
    .then(function()
    {
      Build.inc_nbPendingBuild();
      return Build.app.models.Slave.check_and_boot_slave();
    })
    .then(function() {next()})
    .catch(function(err) {cb(err);})

  });

  Build.complete = function(id, cb) {
    var build;
    var slave;
    var Slave = Build.app.models.Slave;
    //Update build status to complete:
    Build.findOne({where:{id:id}})
    .then(function(pbuild) {
      build = pbuild;
      return jenkins.get_build_status(build.getId())
    })
    .then(function(status) {return build.updateAttributes({status: status})})
    .then(function() {return jenkins.get_slave(build.getId())})
    .then(function(slaveName) {
        var slave_id = parseInt(slaveName.match(/\d+/g)[0]);
        return Slave.findOne({where:{id:slave_id}});
    })
    .then(function(pslave) {
        if(!pslave)  throw new Error("No slave with ID:" + slave_id);
        slave = pslave;
        return jenkins.remove_node(slave.getId());
      })
    .then(function() { return Slave.destroyById(slave.getId())})
    .then(function() { return Slave.check_and_boot_slave()})
    .then(function() { cb(null, slave.getId());})
    .catch(function(err) { cb(err);})

  }

  Build.remoteMethod(
    'complete',
    {
      accepts: [{arg: 'id', type: 'number'}],
      http: {path:'/:id/complete', verb: 'post'}
    }
  );
};
