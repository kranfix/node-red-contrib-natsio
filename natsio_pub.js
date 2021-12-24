module.exports = function (RED) {

  function NatsPubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    const te = new TextEncoder();

    node.server = RED.nodes.getNode(n.server)
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)
    node.server.on('Status', (st) => {
      node.status(st)
    });

    node.on('input', function (msg) {
      if (this.server.nc) {
        var subject = n.subject
        if (!subject || subject == "") {
          subject = msg.replyTo || msg.topic;
        }
        var message = n.message
        if (!message || message == "") {
          message = msg.payload;
        }
        if (typeof message === 'object') {
          message = JSON.encode(message)
        }
        if (subject && message) {
          this.server.nc.publish(subject, te.encode(message));
        }
      }
    });

    node.on('close', () => {
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    });
  }
  RED.nodes.registerType("natsio-pub", NatsPubNode);
}
