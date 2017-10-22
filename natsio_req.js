var nats = require('nats');

module.exports = function(RED) {

  function NatsRequestNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);

    var node = this;

    node.on('input', function(msg) {
      var subject = msg.replyTo || msg.topic || config.subjec;
      var message = msg.payload || config.message

      if(subject){
        node.server.nc.request(subject, function(response) {
          msg.payload = response
          node.send(msg);
        })
      }
    });

    node.on('close', function() {
      if (node.server.nc) {
        node.server.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-request",NatsRequestNode);
}
