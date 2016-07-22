var jenkins   = require('../../server/jenkinsInstance').jenkinsInstance,
    config    = require('../../server/config'),
    isIp      = require('is-ip'),
    slaveApi  = require('../../lib/localhost_slave_api'),
    utils     = require('../../lib/utils');
var maxNbOfSlaves = config.nbOfSlaves;

module.exports = function(Slave) {

  // This function check if we can powerup a slave and will power up if possible
  // Callback is used to inform that you can reate a slave
  Slave.checkAndBootSlave = function(cb) {

    cb = cb || utils.createPromiseCallback();

    // There are no pendings build
    if(Slave.app.models.Build.getNbPendingBuild() <= 0){
      cb();
      return ;
    }

    // if we have not reach the limit of slaves, power up one
    Slave.count({})
    .then(function (cnt) {
      if(cnt >= maxNbOfSlaves){
        throw new RangeError('Max number of slave has been reached');
      }
      return Slave.create({status:'booting'});
    })
    .then(function(slave)
    {
      var err = Slave.app.models.Build.decNbPendingBuild();
      if(err) throw err;
      return slaveApi.bootSlave(slave.id, 'http://' + config.host + ':' + config.port);
    })
    .then(function(){
      cb();
      return ;
    })
    .catch(function(err) {
      //No error should be issued to the calling fonction if we have reach the max number of slave
      if(err instanceof RangeError)
        return cb();
      else
        return cb(err);
    });
    return cb.promise;
  };


  Slave.boot = function(id, ip, cb) {    
    var slave ;
    if(!isIp(ip)) return cb(new Error('IP ' + ip + ' is not a valid IP'));
    //At least one slave should be in boot mode
    Slave.findOne({where:{id:id}})
    .then(function(pslave)
    {
      slave = pslave;
      if(!slave) throw new Error('No slave with id ' + slave);
      if(slave.status != "booting") throw new Error('Slave is not booting but in ' + slave.status + ' mode');
      return slave.updateAttributes({status: 'building', IP:ip});
    })
    .then(function() { return jenkins.createNode(slave.getId(), ip);})
    .then(function(){ cb(null, slave.getId());})
    .catch(function(err) {cb(err);});
  };

  Slave.remoteMethod(
    'boot',
    {

      accepts: [{arg: 'id', type: 'number'}, {arg: 'ip', type: 'string'}],
      http: {path:'/:id/boot'}
    }
  );
};
