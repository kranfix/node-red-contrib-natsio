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
          stream: n.stream,
          config: {
            description: "node-red " + n.name,
            deliver_policy: n.deliverPolicy,
            deliver_subject: n.deliverySubject,
            ack_policy: n.ackPolicy,
            deliver_policy: n.deliverPolicy,
            replay_policy: n.replayPolicy,
          }
          //  ack_wait: nanos(30 * 1000),
        }
        //TODO: Implement all options


        /**
         OPTS
        
        
            mack: boolean;
            stream: string;
            callbackFn?: JsMsgCallback;
            name?: string;
            ordered: boolean;
            max?: number;
            queue?: string;
            debug?: boolean;
            isBind?: boolean;
          config: Partial<ConsumerConfig>;
        
         */

        if (n.maxWanted) {
          opts.max = n.maxWanted
        }


        /**
CONFIG:
              description?: string;
    "ack_policy": AckPolicy;
    "ack_wait"?: Nanos;
    "deliver_policy": DeliverPolicy;
    "deliver_subject"?: string;
    "deliver_group"?: string;
    "durable_name"?: string;
    "filter_subject"?: string;
    "flow_control"?: boolean;
    "idle_heartbeat"?: Nanos;
    "max_ack_pending"?: number;
    "max_deliver"?: number;
    "max_waiting"?: number;
    "opt_start_seq"?: number;
    "opt_start_time"?: string;
    "rate_limit_bps"?: number;
    "replay_policy": ReplayPolicy;
    "sample_freq"?: string;
    "headers_only"?: boolean;
}
         */


        if (n.durable) {
          opts.config.durable = n.durable;
        }
        if (n.filterSubject) {
          opts.config.filter_subject = n.filterSubject
        }

        opts.callbackFn = (err, msg) => {
          if (err) {
            node.log("jestream-error: " + err)
            return
          }
          if (msg) {
            node.send({ payload: msg, topic: msg.subject });
          }
        }

        const js = node.server.nc.jetstream()
        try {
          const sub = js.subscribe(n.filterSubject, opts);

          n.sub = sub

          const done = (async () => {
      
            sub.close().then(() => {
              sub.destroy();
              n.sub = null;
            }).catch((e) => {
              debugger
            })


          });
        } catch (e) {
          this.status({ fill: "red", shape: "dot", text: e });
        }
      }
      this.status(st)
    });

    node.on('close', () => {
      if (n.sub) {
        n.sub.destroy();
      }
      n.sub = null
      node.server.setMaxListeners(node.server.getMaxListeners() - 1)
    });
  }
  RED.nodes.registerType("natsjs-sub", NatsJsSubNode);
}
