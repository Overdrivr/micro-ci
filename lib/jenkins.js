
var jenkins = require('./jenkinslib/jenkins');
var xml = require('xml');



function Jenkins(opts)
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
    if (err) callback(err, null)

    else if(!exists)
      callback(Error("Job "+ name + " does not exist"), null);
    else
    this.jenkins.build.log(name, 1, function(err, data) {
      if (err) callback(err, null);

      callback(null, data)
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
    if (err) callback(err, null)

    else if(!exists)
      {
        callback(Error("Job "+ name + " does not exist"), null);

      }
    else {
      this.jenkins.queue.list(function(err, queue) {
        if (err) callback(err, null);
        else {
          if(queue != null)
            for(var i in queue)
            {
              if(queue[i].task.name == name)
              {
                callback(null, "waiting");
                return true;
              }
            }
          this.jenkins.build.get(name, 1, function(err, data) {
            if (err) callback(Error("Job "+ name + " does not exist"), 0);
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
              callback(err, returnStatus)
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


//console.log(xml(config,{ indent:true}));

//Check the job does not exist
this.jenkins.job.exists(name, function(err, exists) {
  if (err) callback(err, null);
  else if(exists)
  callback(Error("Job "+ name + " already exist"), null)
  else {


    //Create the job
    this.jenkins.job.create(name, xml(config), function(err) {
      if(err)
      callback(err, null);
      else {


        //Build the job:
        this.jenkins.job.build(name, function(err) {
          callback(err, null);
        }.bind(this));
      }


    }.bind(this));
  }
}.bind(this));
}



// create_node Create a know knowing is IP and credential Jenkins ID
// name slave name
// ip slave ip
// credential jenkins credential
//callback

/*
Jenkins.prototype.create_node = function(name, ip, credential, callback)
{
  //Check the job does not exist
  this.jenkins.node.exists(name, function(err, exists) {
    if (err) callback(err, null)

    else if(exists)
      callback(Error("Node "+ name + " already exist"), null);
    else
    {


      var req = { name: 'node.create' };

      var opts = {};
      opts.name = name;
      opts.type = opts.type || 'hudson.slaves.DumbSlave$DescriptorImpl';
      opts.retentionStrategy = opts.retentionStrategy ||
        { 'stapler-class': 'hudson.slaves.RetentionStrategy$Always' };
      opts.nodeProperties = opts.nodeProperties || { 'stapler-class-bag': 'true' };
      opts.launcher = opts.launcher ||
        { 'stapler-class': 'hudson.slaves.JNLPLauncher' };
      opts.numExecutors = opts.hasOwnProperty('numExecutors') ?
        opts.numExecutors : 2;
      opts.remoteFS = opts.remoteFS || '/var/lib/jenkins';
      opts.mode = opts.mode || (opts.exclusive ? 'EXCLUSIVE' : 'NORMAL');

      console.log(utils.options);
      utils.options(req, opts);


      req.path = '/computer/doCreateItem';
      req.query.name = name;
      req.query.type = 'hudson.slaves.DumbSlave$DescriptorImpl';
      req.query.json = JSON.stringify({
        name: name,
        nodeDescription: name,
        numExecutors: 1,
        remoteFS: "/",
        labelString: "",
        mode: "NORMAL",
        type: "hudson.plugins.sshslaves.SSHLauncher",
        retentionStrategy: "hudson.slaves.RetentionStrategy$Always",
        nodeProperties: "",
        launcher: "hudson.plugins.sshslaves.SSHLauncher",
    });
    console.log(req);

    return this.jenkins._post(
      req,
      middleware.require302('failed to create: ' + opts.name),
      middleware.empty,
      callback
    );

  }
  }.bind(this));
}
*/
module.exports = Jenkins;

/*var jj = new Jenkins('http://localhost:8080');

jj.create_node("Test3", "127.0.0.1", "0", function(err,data)
{
  console.log("err",err);
  console.log("data",data);
}

);
*/
