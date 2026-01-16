const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://94.20.153.234/",
        methods: ["GET", "POST"]
    }
});
app.use(express.static("public"));
app.use(cors());

io.on("connection", (socket) => {

    socket.on("joinRoom", (room) => {
        socket.join(room);
    });

    socket.on("sendData", (data) => {
        io.to(data.room).emit("receiveData", data);
    });

    socket.on("disconnect", () => {
        console.log("İstifadəçi ayrıldı:", socket.id);
    });
});

server.listen(3089, () => {
    console.log("Server 3089 portunda işləyir...");
});
