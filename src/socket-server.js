const net = require('net');
const fs = require('fs');

let id = 1;

class MsgServer {
  constructor(file, msgParser){
    debugger;
    this.file = file;

    this.connections = new Set();

    let that = this;
    this.unixServer = net.createServer(function(conn) {
      console.debug('Client connected');

      that.connections.add(conn);
      console.log('#Connections: ' + that.connections.size);

      conn.on('end', function(){
        that.connections.delete(conn);
        console.debug('Client disconnected');
      });

      conn.on('close', function(){
        that.connections.delete(conn);
        console.debug('Server closed client-connection');
      });

      conn.on('error', function(e){
        conn.destroy();
        console.debug('Error. Closing client-connection');
        console.error(e);
      });

      conn.on('data', function(data){
        let incoming = data.toString();
        console.debug('Data received: ' + incoming);
        let request = safeJsonParse(incoming);
        if (request.type && request.msg){
          msgParser(request.type, request.msg);
        }
      });
    });

    this.unixServer.on('error', function(e) {
      console.log(e);
    });

    this.unixServer.on('listening', function() {
      console.log('Server listening');
    });

  }

  stop() {
    this.connections.forEach( (conn) => {
      conn.destroy();
    });
    this.unixServer.close();
    this.unixServer.unref();
  }

  write(type, data) {
    let msg = {id: id, type: type , content: data};

    this.connections.forEach( (conn) => {
      conn.write(JSON.stringify(msg));
    });
    id += 1;
  }

  start() {
    console.debug('Starting...');
    console.debug(this.file);
    debugger;
    let that = this;
    fs.stat(this.file, function(err) {
      debugger;
      if (!err) {
        console.debug('Socket file exists, will be deleted');
        fs.unlinkSync(that.file);
      }
      console.debug('Server started at ' + that.file);
      that.unixServer.listen(that.file);
    });

  }

}

function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch (err) {
      console.error('Kein JSON: ' + str);
      return {};
    }
  }

module.exports = MsgServer;
