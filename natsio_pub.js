module.exports = function(RED) {

  function NatsPubNode(n) {
    RED.nodes.createNode(this, n);

    this.server = RED.nodes.getNode(n.server);
    if(this.server.nc) {
      this.status({fill:"green",shape:"dot",text:"connected"});
    } else {
      this.status({fill:"red",shape:"ring",text:"disconnected"});
    }
    
    var node = this;

    node.on('input', function(msg) {
      var subject = msg.replyTo || msg.topic || n.subject;
      var message = msg.payload || n.message;

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
  RED.nodes.registerType("natsio-pub",NatsPubNode);
}
