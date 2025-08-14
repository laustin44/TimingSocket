const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
var net = require('net');
const fs = require('fs');
// const fetch = require("node-fetch");
var CryptoJS = require("crypto-js");
app.use(cors());

//TSL connection start
// const TSL_Port = 5298;
// const TSL_Host = '51.140.246.156';
//const TSL_Port = 5298; //Test Server
//const TSL_Host = '51.140.246.156';//Test Server
const TSL_Port = 5298; //Test Server
const TSL_Host = 'repeaters.tsl-timing.com';//Test Server
// const TSL_Port = 5101; //Race Server
// const TSL_Host = '51.141.101.71';//Race Server
const API_KEY = 'VminNETvOHBMzP0qzIL5'; //Race.tv
const SHARED_SECRET = 'G64BAh7bp5SnCyZKwcXwUk8i1r+AGYDzUiFMpDXFCTg='; //Race.tv
var connection = "false"
var client = new net.Socket();
var log = []

function processAuthChallenge(challenge) {
    // 1. Challenge is sent as a base64 encoded string. Decode it into raw bytes.
    const challengeBytes = CryptoJS.enc.Base64.parse(challenge);

    // 2. Do the same for our shared secret value.
    const secretBytes = CryptoJS.enc.Base64.parse(SHARED_SECRET);

    // 3. Calculate the SHA-256 hash of the challenge, using our secret as the key.
    const responseBytes = CryptoJS.HmacSHA256(challengeBytes, secretBytes);
    
    // 4. We now have the raw bytes of the hash. It needs to be sent back to the server
    // as a Base64 string, so encode it here before returning it.
    return CryptoJS.enc.Base64.stringify(responseBytes);
}

client.connect(TSL_Port, TSL_Host, function() {
  console.log('TSL Connected');
  client.write("");
});

client.write(`${String.fromCharCode(15)}SET Options ${JSON.stringify({
  AppName: "AlphaLive",
  SendPartialUpdates: false,
  SendGetResponseAsArray: false
})}${String.fromCharCode(13)}`);

//socket.io config start
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    if(data.type == "Graphics" || data.type == "Expand"){
      socket.to(data.room).emit("receive_message", data);
    }
    
    if(data.type == "Server"){
      client.write(`${String.fromCharCode(15)}GET ${data.message} ${String.fromCharCode(13)}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("writing")
    var currentdate = new Date();
    var dateStr = currentdate.getFullYear() + "" + (currentdate.getMonth()+1)  + "" + currentdate.getDate() + "-"  + currentdate.getHours() + "-"  + currentdate.getMinutes() + "-" + currentdate.getSeconds();
    fs.writeFileSync('./data'+dateStr+'.json', JSON.stringify(log, null, 2) , 'utf-8');
    console.log("User Disconnected", socket.id);
  });

  client.write(`${String.fromCharCode(15)}GET ActiveSession ${String.fromCharCode(13)}`);
  client.write(`${String.fromCharCode(15)}GET ActiveCompetitor ${String.fromCharCode(13)}`);
  client.write(`${String.fromCharCode(15)}GET Result ${String.fromCharCode(13)}`);
  client.write(`${String.fromCharCode(15)}GET Grid ${String.fromCharCode(13)}`);
  
  if(connection == "false"){
    client.on('data', function(data) {
    connection = "true"
    // console.log(socket.id)
    const msg = data.toString();
    var dataObj = {
      timeStamp:  new Date(Date.now()),
      data: msg
    };
    log.push(dataObj);
    var json = msg.split("DATA ")
    var i = 0
    while (i<json.length) {
      var item = json[i]
      var messageType = item.split("{")
      var subString = item.substring(item.indexOf("{")-1, item.lastIndexOf("}")+1);
      try {
        obj = {
          room: 'TSL',
          type: messageType[0].trim(),
          author: 'Server',
          message: JSON.parse(subString),
          time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
        }
        socket.broadcast.to(obj.room).emit("receive_message", obj);
        console.log("sent", obj.type)
        // console.log(subString)
        // console.log(msg)
        // if(obj.type == "ActiveCompetitor"){
        //   console.log(JSON.parse(subString).ID)
        // }
      } catch {
        // console.log("not json")
      }
      i++
    }
  })
  }
  
});

server.listen(3001, () => {
  console.log("Socket.io SERVER RUNNING port - 3001");
});

//socket.io config end