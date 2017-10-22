var nats = require('nats');

module.exports = function(RED) {

  function NatsSubNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    this.subject = config.subject;

    var node = this;

    var sid = node.server.nc.subscribe(this.subject,  function(message, replyTo, subject) {
      //console.log('subject: ' + subject + 'message: ' + message);
      var msg = {
        payload: message,
        topic: subject
      };

      if(replyTo){
        msg.replyTo = replyTo
      }
      node.send(msg);
    });

    node.on('close', function() {
      if (node.server.nc) {
        //node.server.nc.unsubscribe(this.subject,sid);
        node.server.nc.unsubscribe(subject,sid);
        node.server.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-sub",NatsSubNode);
}
