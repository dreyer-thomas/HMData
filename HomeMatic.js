const homematic = require('homematic-xmlrpc');

methods = {
   event: (err,params) => {
      // events fro homematic on value changes
   },
   newDevices: (err,params) => {
      // new devices received
   }
};


module.exports = class HomeMaticCCU {

   constructor() {
   }

   registerEvent(callback) {
      methods.event = callback;
   }

   registerNewDevices(callback) {
      methods.newDevices = callback;
   }

   createServer(serveraddress,serverport,clientaddress,clientport) {
      const rpcServer = homematic.createServer({ host: clientaddress, port: clientport });
      
      rpcServer.on('system.multicall', function(method, params, callback) {
         var response = [];
         for (var i = 0; i < params[0].length; i++) {
            if (methods[params[0][i].methodName]) {
               response.push(methods[params[0][i].methodName](null, params[0][i].params));
            }
            else {
               response.push('');
            }
         }
         callback(null, response);
      });

      rpcServer.on('event', function(err, params, callback) {
         callback(null, methods.event(err, params));
      });

      rpcServer.on('newDevices', function(err, params, callback) {
         callback(null, methods.newDevices(err, params));
      });

      var client = homematic.createClient({ host: serveraddress, port: serverport, path: '/'});
      client.methodCall('init', [clientaddress+':'+clientport , 'hmdata'], function (err, data) {  
          if (err) {
              console.log("error " + err);
          }
          else {
              console.log('callback registered at '+serveraddress+':'+serverport);
          }
      });

   }


}
