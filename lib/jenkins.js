var jenkins = require('jenkins');
var xml = require('xml');
var utils = require('./utils');

// Jenkins class
//credentialId: CredentialID to be used to connect to the slave generate by jenkins (ex :099c7823-795b-41b8-81b0-ad92f79492e0)
function Jenkins(opts, credentialId)
{
  if (typeof opts === 'string') {
    opts = { baseUrl: opts };
  } else {
    opts = opts || {};
  }

  if (!opts.baseUrl) {
    if (opts.url) {
      opts.baseUrl = opts.url;
      delete opts.url;
    } else {
      throw new Error('baseUrl required');
    }
  }

  if(!credentialId) {
    throw new Error('Please provide credentialId');
  }
  this.credentialId = credentialId;
  this.jenkins = new jenkins(opts.baseUrl);
}


// get_build_log Return log of a specific build
//build_id: id of the build
//callback
Jenkins.prototype.get_build_log = function(build_id, callback)
{
  var name =  'build_' + build_id;

  //Check the job does not exist
  this.jenkins.job.exists(name, function(err, exists) {
    if (err) return callback(err);
    if(!exists) return callback(Error("Job "+ name + " does not exist"));

    this.jenkins.build.log(name, 1, function(err, data) {
      if (err) return callback(err);
      return callback(null, data);
    }.bind(this));
  }.bind(this));
}

// get_build_status Return the status of a running job
//build_id: id of the build
//callback
Jenkins.prototype.get_build_status =function (build_id, callback)
{
  var name =  'build_' + build_id;

  callback = callback || utils.createPromiseCallback();
  //Check the job does not exist
  this.jenkins.job.exists(name, function(err, exists) {

    if (err) {
      callback(err);
      return;
    }
    if(!exists) {
      callback(Error("Job "+ name + " does not exist"));
      return;
    }

    this.jenkins.queue.list(function(err, queue) {
      if (err) {
        callback(err);
        return;
      }
      if(!queue) { callback(Error('Queue is undefined')); return;}

      // If build is being queued for execution
      for(var i in queue) {
        if(queue[i].task.name == name)  {
          callback(null, "waiting");
          return ;
        }
      }

      // If build is after queuing
      this.jenkins.build.get(name, 1, function(err, data) {
        if (err)
        {
          callback(Error("Job "+ name + " does not exist"));
          return ;
        }

        var status = data["result"];

        if(status == 'SUCCESS') {
          callback(null, 'success');
          return ;
         }
        if(status == 'FAILURE') {
          callback(null, 'fail');
          return ;
        }
        if(status == null){
          callback(null, 'ongoing');
          return ;
        }
        callback(Error("Unknow return status" + status));
        return ;

      }.bind(this));
    }.bind(this));
  }.bind(this));

  return callback.promise;
}

// get_slave Return on which slave the built is running
//build_id: id of the build
//callback
Jenkins.prototype.get_slave =function (build_id, callback)
{
  var name =  'build_' + build_id;

  callback = callback || utils.createPromiseCallback();
  //Check the job does not exist
  this.jenkins.job.exists(name, function(err, exists) {
    if (err){
      callback(err);
      return ;
    }
    if(!exists) {
      callback(Error("Job "+ name + " does not exist"));
      return ;
    }
      this.jenkins.build.get(name, 1, function(err, data) {
        if (err){
           callback(err);
           return ;
        }
        callback(null, data["builtOn"]);
        return ;

      }.bind(this));
    }.bind(this));

  return callback.promise;
}

// create_job Create a jenkins job and send it to jenkins for run
//build_id: id of the build
//yaml: parsed yaml file
//endpoint: url of the callback when job completed
Jenkins.prototype.build = function (build_id, yaml, baseUrl, callback)
{
  var name = 'build_' +build_id;

  callback = callback || utils.createPromiseCallback();
  var builds = [];
  var commands = "";
  for(var i in yaml['build'])  {
    commands += yaml['build'][i] + "\n"
  }
  var config = {project :
      [{action:""},
      {description:""},
      {keepDependencies:false},
      {properties: [
        {"com.tikal.hudson.plugins.notification.HudsonNotificationProperty": [{_attr:{plugin:"notification@1.10"}},
        {endpoints: [{
          "com.tikal.hudson.plugins.notification.Endpoint" : [
            {protocol: "HTTP"},
            {format:"JSON"},
            {url:baseUrl + "/api/Builds/"+build_id+"/complete"},
            {event:"completed"},
            {timeout:30000},
            {loglines:0}
          ]}]
        }
      ]}
    ]},
    {scm : [{_attr:{class:"hudson.scm.NullSCM"}}]},
    {canRoam:true},
    {disabled:false},
    {blockBuildWhenDownstreamBuilding:false},
    {blockBuildWhenUpstreamBuilding:false},
    {triggers:""},
    {concurrentBuild : false},
    {builders:[
      {"hudson.tasks.Shell" : [{command:commands}]}
    ]},
    {publishers:""},
    {buildWrappers:""}
  ]};

  //Check the job does not exist
  this.jenkins.job.exists(name, function(err, exists) {
    if (err){
      callback(err);
      return ;
    }
    if(exists)
    {
     callback(Error("Job "+ name + " already exist"));
     return;
    }

      //Create the job
      this.jenkins.job.create(name, xml(config), function(err) {

        if(err){
          callback(err);
          return ;
        }
        //Build the job:
        this.jenkins.job.build(name, function(err){
          callback(err);
          return ;
        });

      }.bind(this));
  }.bind(this));
  return callback.promise;
}



// create_node Create a slave knowing is IP
// name slave name
// ip slave ip
// credential jenkins credential
//callback
Jenkins.prototype.create_node = function(id, ip, callback)
{
  //Check the job does not exist
  var name = "slave_" + id;
  this.jenkins.node.exists(name, function(err, exists) {
    if (err) return callback(err)
    if(exists) return callback(Error("Node "+ name + " already exist"));

    var opts = {
      name: name,
      nodeDescription: "",
      numExecutors: 1,
      remoteFS: "~/",
      labelString: "",
      mode: "NORMAL",
      type:'hudson.slaves.DumbSlave$DescriptorImpl',
      retentionStrategy: {'stapler-class': "hudson.slaves.RetentionStrategy$Always"},
      nodeProperties: {"stapler-class-bag":"true",
                        "hudson-slaves-EnvironmentVariablesNodeProperty":{"env":{"key":"slave_id","value":id}}},
      launcher:  {'stapler-class' : "hudson.plugins.sshslaves.SSHLauncher",
      credentialsId: this.credentialId,
      host: ip,
      port: 22
      }
    };

    this.jenkins.node.create(opts, function(err){
      if(err) return callback("This error could be due an invalid credentialId \n Err:" + err);
      callback();
    }.bind(this));
  }.bind(this));
}


// remove_node Remove a node by name
// name slave name
Jenkins.prototype.remove_node = function(id, callback)
{
  var name = "slave_" + id;

  callback = callback || utils.createPromiseCallback();
  //Check the job does not exist
  this.jenkins.node.exists(name, function(err, exists) {
    if (err) {
      callback(err)
      return ;
    }
    if(!exists){
     callback(Error("Node "+ name + " does not exist"));
     return ;
   }
    this.jenkins.node.destroy(name, callback);
    return ;
  }.bind(this));

  return callback.promise;
}
module.exports = Jenkins;
