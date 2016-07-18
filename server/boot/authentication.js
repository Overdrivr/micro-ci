module.exports = function enableAuthentication(server) {
  console.log('Enabling authentication.');
  // enable authentication
  server.enableAuth();
};
