module.exports = function(Commit) {
  Commit.disableRemoteMethod('create', true);
  Commit.disableRemoteMethod('upsert', true);
  Commit.disableRemoteMethod('updateAttributes', false);
  Commit.disableRemoteMethod('deleteById', true);
  Commit.disableRemoteMethod('updateAll', true);
  Commit.disableRemoteMethod('createChangeStream', true);
  Commit.disableRemoteMethod("count", true);
  Commit.disableRemoteMethod("findOne", true);
  Commit.disableRemoteMethod('__create__jobs', false);
  Commit.disableRemoteMethod('__delete__jobs', false);
  Commit.disableRemoteMethod('__destroyById__jobs', false);
  Commit.disableRemoteMethod('__updateById__jobs', false);
};
