var nats = require('nats');

module.exports = function (RED) {

  function NatsRequestNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)
    node.server.on('Status', (st) => {
      this.status(st)
    });

    if (n.maxReplies == -1) {
      n.maxReplies = null
    }

    node.on('input', function (msg) {
      var subject = msg.replyTo || msg.topic || n.subject;
      var opt_msg = msg.payload || n.message
      var opt_options = {
        max: msg.maxReplies || n.maxReplies
      }
      if (subject && !node.server.nc.closed) {
        let sid = node.server.nc.request(subject, opt_msg, opt_options, function (response) {
          msg.payload = response
          node.send(msg);
        })
        if (n.timeout) {
          let expected = n.maxReplies || 1
          node.server.nc.timeout(sid, n.timeout, expected, () => {
            node.log("Emitiendo timeout")
            msg.timeout = "Timeout error afer " + n.timeout + 'ms'
            node.send(msg);
          })
        }
      }
    });

    node.on('close', () => {
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    })
  }
  RED.nodes.registerType("nats-request", NatsRequestNode);
}
