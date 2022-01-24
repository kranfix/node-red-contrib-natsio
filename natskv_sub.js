module.exports = function (RED) {

  function NatsKVSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1)
    node.server.on('Status', (st) => { // (status,action)
      node.log("nats-server status: " + st.text)
      if (st.text == 'connected') {
        function sendValue(entry) {
          if (entry) {
            result = null
            if (entry.operation == "PUT") {
              var data = new TextDecoder().decode(entry.value)
              if (n.json) {
                try {
                  const json = JSON.parse(data);
                  data = json;
                } catch (e) {
                  data = {
                    error: e
                  };
                }
              }
              result = { payload: data, topic: n.view + "." + entry.key }
            } else {
              result = { payload: null, topic: n.view + "." + entry.key }
            }
            node.send(result);
          }
        }
        const js = node.server.nc.jetstream()
        js.views.kv(n.view, { history: 1 }).then((kv) => {
          (async () => {
            if (n.fetchState) {
              const keys = await kv.keys();
              for await (const key of keys) {
                sendValue(await kv.get(key))
              }
            }
            const watch = ! await kv.watch();
            if (watch) {
              for await (const e of watch) {
                sendValue(e)
              }
            } else {
              node.log("nats-watch watch returned empty watcher");  
            }

          })().catch((reason) => {
            node.log("nats-watch error: " + reason);
          });
        }).catch((reason) => {
          node.log("nats-watch error: " + reason);
        });
      } else {
        console.warn(st.text);
      }
      this.status(st);
    });

    node.on('close', () => {
      if (node.sub) {
        node.sub.destroy();
      }
      node.sub = null
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    });
  }
  RED.nodes.registerType("natskv-sub", NatsKVSubNode);
}
