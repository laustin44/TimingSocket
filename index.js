const mariadb = require('mariadb');
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

// Create a pool of database connections
// Commented out for local version - uncomment for server based version
// const pool = mariadb.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'Knights123=',
//   database: 'alphalive'
// });

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
	socket.to(data).emit("new_connection", "hello");
  });
  
  socket.on("leave_room", (data) => {
    socket.leave(data);
    console.log(`User with ID: ${socket.id} left room: ${data}`);
	
  });

  socket.on("send_message", (data) => {
    if (data.type == "Graphics" || data.type == "Expand") {
      socket.to(data.room).emit("receive_message", data);
    } else if (data.type == "Database") {
      console.log("Database Not accessible on local server")
	    socket.to(data.room).emit("receive_message", data);
      // Insert client data into the database
      // pool.getConnection()
      //   .then(conn => {
      //     const timingInfo = JSON.stringify(data.message);
      //     const insertQuery = `
      //       UPDATE clients
      //       SET timing_states = '${timingInfo}'
      //       WHERE timing_info = '${data.room}'
      //     `;
      //     conn.query(insertQuery)
      //       .then(() => {
      //         console.log(`Client data inserted into database`);
      //         conn.release();
      //       })
      //       .catch(err => {
      //         console.log(err);
      //         conn.release();
      //       });
      //   })
      //   .catch(err => {
      //     console.log(err);
      //   });
    } else if (data.type == "Standings"){
		socket.to(data.room).emit("receive_message", data);
		// console.log(data)
	} else if (data.type == "HSPage"){
		socket.to(data.room).emit("receive_message", data);
		// console.log(data)
	} else if (data.type == "State"){
		socket.to(data.room).emit("receive_message", data);
	} else if (data.type == "rMonitor"){
		// console.log(data.type, data)
		socket.to(data.room).emit("receive_message", data);
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
