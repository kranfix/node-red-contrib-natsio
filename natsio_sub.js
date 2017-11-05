module.exports = function(RED) {

  function NatsSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)
    node.server.on('Status', (st) => { // (status,action)
      if (st.text == 'connected') {
        node.sid = node.server.nc.subscribe(n.subject,
          {max: n.maxWanted},
          (message, replyTo, subject) => {
            node.send({payload: message, topic: subject, replyTo: replyTo});
          }
        );
      }
      this.status(st)
    });


    node.on('close', () => {
      if (node.sid) {
        node.server.nc.unsubscribe(node.sid);
      }
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    });
  }
  RED.nodes.registerType("natsio-sub",NatsSubNode);
}
