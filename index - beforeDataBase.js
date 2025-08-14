const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

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
  
  socket.on("leave_room", (data) => {
	socket.leave(data);
	console.log(`User with ID: ${socket.id} left room: ${data}`);
  });

  socket.on("send_message", (data) => {
    if(data.type == "Graphics" || data.type == "Expand"){
      socket.to(data.room).emit("receive_message", data);
    }
	if(data.type == "DataBase"){
		
	}
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
  
});

server.listen(3044, () => {
  console.log("Socket.io SERVER RUNNING port - 3044");
});

//socket.io config end