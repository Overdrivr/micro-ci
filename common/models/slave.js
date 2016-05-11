var jenkins = require('../../lib/jenkins');

module.exports = function(Slave) {

  //This function check if we can powerup a slave and will power up if possible
  Slave.check_and_boot_slave = function(cb)//Callback is used to inform that you can reate a slave
  {
    // if we have not reach the limit of slaves, power up one
    Slave.count( {}, function(err, cnt){
      if(cnt < maxNbOfSlaves)
      {
        Slave.create({status:"booting"}, function (err)
        {
          if(err)
          return cb(err);
          cb();
        });
      }
      else
      return cb(new Error('Max number of slave has been reached'));
    });



  }

  function check_ip(ip)
  {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip))
    {
      return true;
    }
    return false
  }

  Slave.boot = function(ip cb) {

    if(check_ip(ip))
    {
      Slave.findOne({where:{status:"booting"}}, function(err, slave) //At least one slave should be in boot mode
      {
        if(err)
        return cb(new Error("No slave in booting mode"));

        slave.updateAttributes({status: "Building", IP:ip}, function(err)
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
      return cb(new Error("IP " + ip + "is not a valid IP"))
    }
  }

  Slave.remoteMethod(
    'boot',
    {
      accepts: [{arg: 'ip', type: 'string'}],
      returns: {arg: 'id', type:'number'}
    }
  );
};
