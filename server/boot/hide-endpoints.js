module.exports = function(app){
  var Client = app.models.Client;

  Client.disableRemoteMethod('create', true);
  Client.disableRemoteMethod('upsert', true);
  Client.disableRemoteMethod('updateAll', true);
  Client.disableRemoteMethod('updateAttributes', false);

  Client.disableRemoteMethod('find', true);
  Client.disableRemoteMethod('findById', true);
  Client.disableRemoteMethod('findOne', true);

  Client.disableRemoteMethod('deleteById', true);

  Client.disableRemoteMethod('confirm', true);
  Client.disableRemoteMethod('count', true);
  Client.disableRemoteMethod('exists', true);
  Client.disableRemoteMethod('resetPassword', true);

  Client.disableRemoteMethod('login', true);
  Client.disableRemoteMethod('logout', true);

  Client.disableRemoteMethod('__count__accessTokens', false);
  Client.disableRemoteMethod('__create__accessTokens', false);
  Client.disableRemoteMethod('__delete__accessTokens', false);
  Client.disableRemoteMethod('__destroyById__accessTokens', false);
  Client.disableRemoteMethod('__findById__accessTokens', false);
  Client.disableRemoteMethod('__get__accessTokens', false);
  Client.disableRemoteMethod('__updateById__accessTokens', false);

};
