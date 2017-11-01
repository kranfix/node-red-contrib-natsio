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
    server += n.host + ':' + n.port

    //node.log('NATS sever: '+ server)
    try {
      node.nc = nats.connect({
        'servers': [server],
        'maxReconnectAttempts': -1,
        'reconnectTimeWait': 250
      });

      node.nc.on('connect', () => {
        node.st.emit('status',{fill:"green",shape:"dot",text:"connected"});
      });
      node.nc.on('reconnecting', () => {
        node.st.emit('status', {fill:"green",shape:"ring",text:"connecting"});
      });
      node.nc.on('reconnected', () => {
        node.st.emit('status', {fill:"green",shape:"dot",text:"reconnected"});
      });
      node.nc.on('disconnect', () => {
        node.st.emit('status', {fill:"red",shape:"ring",text:"disconnected"})
      });
    } catch (e){
      node.st.emit('status', {fill:"red",shape:"ring",text:"Broker not found"})
      node.log(e)
    }

    node.on('close', function() {
      if (node.nc) {
        node.nc.close();
      }
    });
  }
  RED.nodes.registerType('remote-server',RemoteServerNode);
}
