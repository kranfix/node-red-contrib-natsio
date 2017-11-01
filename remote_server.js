var nats = require('nats');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}

module.exports = function(RED) {
  function RemoteServerNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    node.st = new MyEmitter();

    let server = 'nats://'
    if(n.user){
      server += n.user + (n.pass? ':'+ n.pass : '') + '@'
    }


    if(n.host && n.port){
      server += n.host + ':' + n.port
      //node.log('NATS sever: '+ server)
      try {
        node.nc = nats.connect({
          'servers': [server],
          'maxReconnectAttempts': -1,
          'reconnectTimeWait': 250
        });
      } catch (e){
        node.log(e)
      }
    }

    node.nc.on('connect', () => {
      node.st.emit('status', {fill:"green",shape:"dot",text:"connected"});
    });
    node.nc.on('reconnecting', () => {
      node.st.emit('status', {fill:"green",shape:"ring",text:"connecting"});
    });
    node.nc.on('reconnect', () => {
      node.st.emit('status', {fill:"green",shape:"dot",text:"connected"});
    });
    node.nc.on('disconnect', () => {
      node.st.emit('status', {fill:"red",shape:"ring",text:"disconnected"})
    });

    node.on('close', function() {
      if (node.nc) {
        node.nc.close();
      }
    });
  }
  RED.nodes.registerType('remote-server',RemoteServerNode);
}
