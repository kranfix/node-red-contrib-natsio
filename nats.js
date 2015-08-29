module.exports = function(RED) {
    function NatsSubNode(config) {
      RED.nodes.createNode(this, config);

      this.address = config.address;
      this.port = config.port;
      this.user = config.user;
      this.pass = config.pass;
      this.subject = config.subject;
      
      var nats = require('nats');
      var server = 'nats://' + config.user + ':' + config.pass + '@' + this.address + ':' + this.port + '/';

      this.nc = nats.connect({'servers': [server]});
      console.log('nats server connect:' + server);
      
      var node = this;

      var sid = this.nc.subscribe(this.subject,  function(message, reply, subject) {
        //console.log('subject: ' + subject + 'message: ' + message);
        var msg = {payload: ''};
        msg.payload = {
          'subject': subject,
          'message': message
        }
        node.send(msg);
      });

      this.on('close', function() {
        if (this.nc) {
          this.nc.unsubscribe(this.subject,sid);
          this.nc.close();
        }
      });
    }
    RED.nodes.registerType("nats-sub",NatsSubNode);
}
