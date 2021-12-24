module.exports = function (RED) {

  function NatsJsSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)
    node.server.on('Status', (st) => { // (status,action)
      node.log("nats-server status: " + st.text)
      if (st.text == 'connected') {
        const opts = {
          name: n.name,
          deliver_policy: n.deliverPolicy,
          ack_policy: n.ackPolicy,
        //  ack_wait: nanos(30 * 1000),
          replay_policy: n.replayPolicy,
        }
        if (n.durable) {
          opts.durable = n.durable;
        }
        if (n.maxWanted) {
          opts.max = n.maxWanted
        }

        n.sub = node.server.nc.jetstream().subscribe(n.subject, opts);
        const done = (async () => {
          for await (const m of sub) {
            debugger
            node.send({ payload: m, topic: m.subject });

          }
          debugger
          n.sub.destroy();
          n.sub = null
        })
      }
      this.status(st)
    });

    node.on('close', () => {
      if (node.sub) {
        node.sub.destroy();
      }
      node.sub = null
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    });
  }
  RED.nodes.registerType("natsjs-sub", NatsJsSubNode);
}
