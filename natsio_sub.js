module.exports = function (RED) {

  function NatsSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)

    node.server.on('Status', (st) => { // (status,action)
      if (st.text == 'connected') {
        var opts = {}
        if (n.maxWanted > 0) {
          opts.max = n.maxWanted
        }
        if (n.queue != "") {
          opts.queue = n.queue
        }
        node.sid = node.server.nc.subscribe(n.subject, opts);
        (async () => {
          for await (const m of node.sid) {
            var data = new TextDecoder().decode(m.data)
            if (n.json) {
              try {
                const json = JSON.parse(data)
                data = json
              } catch (e) {
                data = {
                  error: e
                }
              }
            }
            node.send({ payload: data, topic: m.subject, replyTo: m.reply }, false);
          }
          await n.server.nc.closed
        })();
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
  RED.nodes.registerType("natsio-sub", NatsSubNode);
}
