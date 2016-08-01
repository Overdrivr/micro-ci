module.exports = function(Job) {

  //Job created -> create a build
  Job.observe('after save', function (ctx, next) {
    if(!ctx.isNewInstance) return  next();
    var job = ctx.instance;
    Job.app.models.Build.create({
      status: 'created',
      builddate:new Date(),
      jobId:job.getId()}, function(err, build){
        if(err) return next(err);
        next();
      });
    });
  };
