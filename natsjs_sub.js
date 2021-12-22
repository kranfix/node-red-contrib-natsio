module.exports = function(RED) {

  function NatsJsSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)
    /*
    node.server.on('Status', (st) => { // (status,action)
      node.log("natsserver", node.server.server,st )

      if (st.text == 'connected') {
        const subjects = n.subjects.split(/[\r\n]+/)
        debugger;
        node.server.nc.jetstreamManager().then( (jsm) => {
          node.jsm = jsm
          node.log(node.jsm)
          node.jsm.streams.add({ name: stream, subjects: subjects });
  
          node.sid = node.server.nc.subscribe(n.stream,
            {max: n.maxWanted,queue:n.queue},
            (message, replyTo, stream) => {
              node.send({payload: message, topic: stream, replyTo: replyTo});
            }
          );
          * /
        } )

      }
      this.status(st)
    });

    node.on('close', () => {
      if (node.sid) {
        node.server.nc.unsubscribe(node.sid);
      }
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    });
    */
  }
  RED.nodes.registerType("natsjs-sub",NatsJsSubNode);
}
