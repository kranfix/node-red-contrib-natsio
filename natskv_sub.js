module.exports = function (RED) {

  function NatsKVSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.kv = null;
    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1);

    function sendValue(entry, fromRefresh) {
      if (entry) {
        try {
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
            result = { payload: data, topic: n.view + "." + (fromRefresh ? "REFRESH" : entry.operation) + "." + entry.key }
          } else {
            result = { payload: null, topic: n.view + "." + entry.operation + "." + entry.key }
          }
          node.send(result);
        } catch (reason) {
          node.log("nats-watch error: " + reason);
        }
      } else {
        node.log("nats-watch error: empty entry");
      }
    }

    async function refresh() {
      if (node.kv) {
        node.emit('Status', { fill: "green", shape: "dot", text: "refresh" });
        const kv = node.kv
        const keys = await kv.keys();
        if (keys) {
          for await (const key of keys) {
            kv.get(key).then((msg) => {
              sendValue(msg)
            }).catch((reason) => {
              node.log("nats-watch error: " + reason);
            });
          }
        }
        node.emit('Status', { fill: "green", shape: "dot", text: "connected" });
      }
    };

    node.server.on('Status', (st) => { // (status,action)
      node.log("nats-server status: " + st.text)
      if (st.text == 'connected') {
        const js = node.server.nc.jetstream()
        js.views.kv(n.view, { history: 1 }).then((kv) => {
          node.kv = kv;
          (async () => {
            if (n.fetchState) {
              await refresh();
            }
            while (node.kv) {
              const watch = await kv.watch();
              if (watch) {
                for await (const e of watch) {
                  sendValue(e)
                }
              } else {
                node.log("nats-watch error: watch returned empty watcher");
              }
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



    node.on('input', function (msg) {
      // any incoming message triggers a refresh
      refresh();
    });

    node.on('close', () => {
      if (node.sub) {
        node.sub.destroy();
      }
      node.kv = null;
      node.sub = null;
      node.server.setMaxListeners(node.server.getMaxListeners() - 1);
    });
  }
  RED.nodes.registerType("natskv-sub", NatsKVSubNode);
}
