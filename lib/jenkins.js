
var jenkins = require('jenkins');
var xml = require('xml');

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

  if(!credentialId)
  {
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
    if (err) return callback(err)

    else if(!exists)
      return callback(Error("Job "+ name + " does not exist"));
    else
    this.jenkins.build.log(name, 1, function(err, data) {
      if (err) return callback(err);

      return callback(null, data)
    }.bind(this));

  }.bind(this));
}

// get_build_status Return the status of a running job
//build_id: id of the build
//callback
Jenkins.prototype.get_build_status =function (build_id, callback)
{
  var name =  'build_' + build_id;

  //Check the job does not exist
  this.jenkins.job.exists(name, function(err, exists) {
    if (err) return callback(err)
      else if(!exists)
    return callback(Error("Job "+ name + " does not exist"));
    else {
      this.jenkins.queue.list(function(err, queue) {
        if (err) return callback(err);
        else {
          if(queue != null)
          for(var i in queue)
          {
            if(queue[i].task.name == name)
            {
              return callback(null, "waiting");
              return true;
            }
          }
          this.jenkins.build.get(name, 1, function(err, data) {
            if (err) return callback(Error("Job "+ name + " does not exist"), 0);
            else {
              var returnStatus = null;
              var status = data["result"];
              var err = null;
              if(status == "SUCCESS")
                returnStatus = "success";
              else if (status == "FAILURE")
                returnStatus = "fail";
              else if (status == null)
                returnStatus = "ongoing";
              else
                err = new Error("Unknow return status" + status);
              return callback(err, returnStatus)
            }
          }.bind(this));
        }
      }.bind(this));
    }
  }.bind(this));
}

// create_job Create a jenkins job and send it to jenkins for run
//build_id: id of the build
//yaml: parsed yaml file
//endpoint: url of the callback when job completed
Jenkins.prototype.build = function (build_id, yaml, endpoint, callback)
{


  var name = 'build_' +build_id;

  var builds = [];
  var commands = "";
  for(var i in yaml['build'])
  {
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
          {url:endpoint},
          {event:"all"},
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
  if (err) return callback(err);
  else if(exists)
    return callback(Error("Job "+ name + " already exist"))
  else {


    //Create the job
    this.jenkins.job.create(name, xml(config), function(err) {
      if(err)
        return callback(err);
      else {


        //Build the job:
        this.jenkins.job.build(name, function(err) {
          return callback(err);
        }.bind(this));
      }


    }.bind(this));
  }
}.bind(this));
}



// create_node Create a slave knowing is IP
// name slave name
// ip slave ip
// credential jenkins credential
//callback
Jenkins.prototype.create_node = function(name, ip, callback)
{
  //Check the job does not exist
  this.jenkins.node.exists(name, function(err, exists) {
    if (err) return callback(err)

    else if(exists)
      return callback(Error("Node "+ name + " already exist"));
    else
    {
      var opts = {name: name,
        nodeDescription: "",
        numExecutors: 1,
        remoteFS: "/",
        labelString: "",
        mode: "NORMAL",
        type:'hudson.slaves.DumbSlave$DescriptorImpl',
        retentionStrategy: {'stapler-class': "hudson.slaves.RetentionStrategy$Always"},
        nodeProperties: "",
        launcher:  {'stapler-class' : "hudson.plugins.sshslaves.SSHLauncher",
        credentialsId: this.credentialId,
        host: ip,
        port: 22
      },

    };

    this.jenkins.node.create(opts, function(err){
      if(err)
        return callback("Make sure credentialId is valid\n" + err);
      else {
        return callback();
      }
    }.bind(this));
  }
}.bind(this));
}


// remove_node Remove a node by name
// name slave name
Jenkins.prototype.remove_node = function(name, callback)
{
  //Check the job does not exist
  this.jenkins.node.exists(name, function(err, exists) {
    if (err) return callback(err)

    else if(!exists)
      return callback(Error("Node "+ name + " does not exist"));

    else {
      this.jenkins.node.destroy(name, function(err)
      {
        if(err)
          return callback(err);
        else {
          return callback();
        }
      }.bind(this));
    }
  }.bind(this));
}
module.exports = Jenkins;
