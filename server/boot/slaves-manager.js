var jenkins = require('../../lib/jenkins');
var slave_api = require('../../lib/localhost_slave_api');

//TODO put site name (127.0.0.1/ micro-ci.com) in a variable
//TODO Move as much function as possible in each model
//TODO manage the err and not throw them
//TODO replace on method by operation hooks
module.exports = function slavesManager(app) {

  console.log(app.get('nbOfSlaves'));
  console.log("Enabling slaves manager");



  app.get('/slaveManager/slave/:ip/boot',
  function(req, res){//Slave complete is booting operation
    console.log(req.params.ip);
    res.status(200).end();
    Slave.findOne({where:{status:"booting"}}, function(err, slave)
    {
      if(err)
      throw err;

      slave.updateAttributes({status: "Building"}, function(err)
      {
        if(err)
        throw err;
      });
      jenkins.create_node("slave_"+slave.getId(), req.params.ip, function(err)
      {
        if(err)
        throw err;
      });
    });
  });

  //A build is created
  app.models.Build.on('changed', function (build)
  {
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
  });

  //A build is complete
  app.get('/build/:id/complete',
  function(req, res){
    console.log(req.params.id);
    //Update build status to complete:
    Build.findOne({where:{id:req.params.id}}, function(err, build)
    {
      if(err)
      throw err;
      //Get build status
      jenkins.get_build_status(build.getId(), function(err, status)
      {
        if(err)
        throw err;
        build.updateAttributes({status: status}, function(err)
        {
          if(err)
          throw err;

          res.status(200).end();
        });
      });
    });



  });

  //A slave is powering down check if we have to start a new one
  app.get('/slaveManager/slave/:ip/end',
  function(req, res){

    Slave.findOne({where:{ip:req.params.ip}}, function(err, slave)
    {
      if(err)
      throw err;

      //Remove the slave node from jenkins
      jenkins.remove_node("slave_" + slave.getId(), function(err) {
        if(err)
        throw err;

        //Remove the slave in the db
        Slave.destroyById(slave.getId(), function(err)
        {
          if(err)
          throw err;

          Slave.check_and_boot_slave(function(err) {
            if(!err)//We can boot a slave
              slave_api.boot_slave("http://127.0.0.1:3000");
          });
          res.status(200).end();
        });
      });
    });
  });
}
