module.exports = function(RED) {

  function NatsSubNode(config) {
    RED.nodes.createNode(this, config);

    this.subject = config.subject;

    this.server = RED.nodes.getNode(config.server);
    if(this.server.nc) {
      this.status({fill:"green",shape:"dot",text:"connected"});
    } else {
      this.status({fill:"red",shape:"ring",text:"disconnected"});
    }

    var node = this;



    var sid = node.server.nc.subscribe(this.subject,  function(message, replyTo, subject) {
      var msg = {
        payload: message,
        topic: subject
      };

      if(replyTo){
        msg.replyTo = replyTo
      }
      node.send(msg);
    });

    node.on('close', function() {
      if (node.server.nc) {
        node.server.nc.unsubscribe(subject,sid);
        node.server.nc.close();
      }
    });
  }
  RED.nodes.registerType("natsio-sub",NatsSubNode);
}
