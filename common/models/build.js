var jenkins = require('../../server/jenkinsInstance').jenkinsInstance;
var config  = require('../../server/config.json');

module.exports = function(Build) {
  var pendingBuild = 0;

  Build.getNbPendingBuild = function() {
    return pendingBuild;
  };

  Build.incNbPendingBuild = function() {
    pendingBuild++;
  };

  Build.decNbPendingBuild = function() {
    if(pendingBuild > 0) {
      pendingBuild--;
    } else {
      return new Error('There is no pendingBuild. Cannot decrease the counter.');
    }
  };

  //A build is created
  Build.observe('after save', function (ctx, next) {
    if(!ctx.isNewInstance) return  next();
    var build = ctx.instance;
    if(build.status !== 'created') return  next();

    build.updateAttributes({ status: 'waiting'})
    .then(function() {
      build.job(function(err, job)
      {
        if(err) throw err;
        if(job === undefined) throw new Error('Build should be link to a job');
        return  jenkins.build(build.getId(), job.yaml, 'http://' + config.host + ':' + config.port);
      });
    })
    .then(function()
    {
      Build.incNbPendingBuild();
      return Build.app.models.Slave.checkAndBootSlave();
    })
    .then(function() {next();})
    .catch(function(err) {next(err);});
  });

  Build.complete = function(id, cb) {
    var build;
    var slave;
    var Slave = Build.app.models.Slave;
    //Update build status to complete:
    Build.findOne({where:{id:id}})
    .then(function(pbuild) {
      build = pbuild;
      return jenkins.getBuildStatus(build.getId());
    })
    .then(function(status) {return build.updateAttributes({status: status});})
    .then(function() {return jenkins.getSlave(build.getId());})
    .then(function(slaveName) {
        var slaveId = parseInt(slaveName.match(/\d+/g)[0]);
        return Slave.findOne({where:{id:slaveId}});
    })
    .then(function(pslave) {
        if(!pslave)  throw new Error('No slave found with the requested id');
        slave = pslave;
        return jenkins.removeNode(slave.getId());
      })
    .then(function() { return Slave.destroyById(slave.getId());})
    .then(function() { return Slave.checkAndBootSlave();})
    .then(function() { cb(null, slave.getId());})
    .catch(function(err) { cb(err);});
  };

  Build.remoteMethod(
    'complete',
    {
      accepts: [{arg: 'id', type: 'number'}],
      http: {path:'/:id/complete', verb: 'post'}
    }
  );
};
