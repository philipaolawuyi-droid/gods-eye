const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const devices = new Map();

io.on("connection", (socket) => {
  socket.on("register", ({ name }) => {
    const device = {
      id: socket.id,
      name: String(name || "Authorized Device").slice(0, 50),
      consent: true,
      lat: null,
      lng: null,
      accuracy: null,
      updatedAt: null
    };
    devices.set(socket.id, device);
    io.emit("devices", Array.from(devices.values()));
  });

  socket.on("location", (data) => {
    const device = devices.get(socket.id);
    if (!device || !device.consent) return;

    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) return;

    device.lat = data.lat;
    device.lng = data.lng;
    device.accuracy = Number(data.accuracy) || null;
    device.updatedAt = new Date().toISOString();

    io.emit("location", device);
    io.emit("devices", Array.from(devices.values()));
  });

  socket.on("stopSharing", () => {
    devices.delete(socket.id);
    io.emit("devices", Array.from(devices.values()));
  });

  socket.on("disconnect", () => {
    devices.delete(socket.id);
    io.emit("devices", Array.from(devices.values()));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`God's Eye server running at http://localhost:${PORT}`);
});
