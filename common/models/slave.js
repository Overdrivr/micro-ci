
var jenkinsConf = require('../../server/jenkins.json');
var Jenkins = require('../../lib/jenkins');


var jenkins =  new Jenkins(jenkinsConf.host, jenkinsConf.credential);

var isIp = require('is-ip');

var maxNbOfSlaves = 3;// TODO to be migrate in a parameters

var slave_api = require('../../lib/localhost_slave_api');

module.exports = function(Slave) {

  //This function check if we can powerup a slave and will power up if possible
  Slave.check_and_boot_slave = function(cb)//Callback is used to inform that you can reate a slave
  {
    console.log("TTTT", Slave.app.models.Build);

    // if we have not reach the limit of slaves, power up one
    Slave.count( {}, function(err, cnt){
      if(err)
        return cb(err);
      if(cnt < maxNbOfSlaves)
      {
        Slave.create({status:"booting"}, function (err)
        {
          if(err)
            return cb(err);

            slave_api.boot_slave("127.0.0.1", function(err)
            {
              if(err)
                return next(err);
              return cb();
            });
        });
      }
      else
        return cb(new Error('Max number of slave has been reached'));
    });
  }


  Slave.boot = function(ip, cb) {
    if(isIp(ip))
    {

      Slave.findOne({where:{status:"booting"}}, function(err, slave) //At least one slave should be in boot mode
      {
        if(err || !slave)
          return cb(new Error("No slave in booting mode" + slave));
        slave.updateAttributes({status: "building", IP:ip}, function(err)
        {
          if(err)
            return cb(err)

          jenkins.create_node(slave.getId(), ip, function(err)
          {
            if(err)
              return cb(err)

            return cb(null, slave.getId());
          });
        });

      });
    }
    else {
      return cb(new Error("IP " + ip + " is not a valid IP"))
    }
  }

  Slave.remoteMethod(
    'boot',
    {
      accepts: [{arg: 'ip', type: 'string'}],
      returns: {arg: 'id', type:'number'},
      http: {path:'/:ip/boot', verb: 'post'}
    }
  );

  //Slave is powering down remove it from here
  Slave.end = function(id, cb) //A slave finished is powering down
  {
      Slave.findOne({where:{id:id}}, function(err, slave)
      {
        if(err || !slave)
          return cb(new Error("No slave with IP:" + ip));

        //Remove the slave node from jenkins
        jenkins.remove_node(slave.getId(), function(err) {
          if(err)
            return cb(err);

          //Remove the slave in the db
          Slave.destroyById(slave.getId(), function(err)
          {
            if(err)
              return cb(err);

            Slave.check_and_boot_slave(function(err) { //TODO to boot a slave we should have at least one build in the queue. Maybe I have to create an hook in slaves-manager. Migrate it in the slave manger with a hook
              if(err)
                return cb(err);
              cb(null, slave.getId());
              });
          });
        });
      });
  }

  Slave.remoteMethod(
    'end',
    {
      accepts: [{arg: 'id', type: 'number'}],
      returns: {arg: 'id', type: 'number'},
      http: {path:'/:id/end', verb: 'post'}
    }
  );

};
