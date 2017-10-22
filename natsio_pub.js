module.exports = function(RED) {

  function NatsPubNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);

    var node = this;
    node.on('input', function(msg) {
      var subject = msg.replyTo || msg.topic || config.subject;
      var message = msg.payload || config.message;

      if(subject && message){
        this.server.nc.publish(subject, message);
      }
    });

    node.on('close', function() {
      if (node.server.nc) {
        node.server.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-pub",NatsPubNode);
}
