module.exports = function(RED) {

  function NatsPubNode(n) {
    RED.nodes.createNode(this, n);

    this.server = RED.nodes.getNode(n.server);

    this.server.st.on('status', (st) => {
      this.status(st)
    });

    var node = this;

    node.on('input', function(msg) {
      var subject = msg.replyTo || msg.topic || n.subject;
      var message = msg.payload || n.message;

      if(subject && message){
        this.server.nc.publish(subject, message);
      }
    });

    //node.on('close', () => { });
  }
  RED.nodes.registerType("natsio-pub",NatsPubNode);
}
