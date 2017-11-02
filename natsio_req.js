var nats = require('nats');

module.exports = function(RED) {

  function NatsRequestNode(n) {
    RED.nodes.createNode(this, n);

    this.server = RED.nodes.getNode(n.server);

    this.server.st.on('status', (st) => {
      this.status(st)
    });

    var node = this;

    node.on('input', function(msg) {
      var subject = msg.replyTo || msg.topic || config.subjec;
      var opt_msg = msg.payload || n.message || null
      var opt_options = {
        max: msg.maxReplies || (n.maxReplies == -1? null:n.maxReplies)
      }
      if(subject){
        node.server.nc.request(subject, opt_msg, opt_options, function(response) {
          node.status({fill:"green",shape:"dot",text:"connected"})
          msg.payload = response
          node.send(msg);
        })
      }
    });

    //node.on('close', () => { });
  }
  RED.nodes.registerType("nats-request",NatsRequestNode);
}
