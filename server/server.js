import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import crypto from "node:crypto";
import { Server as SocketServer } from "socket.io";

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) || "*";
const MAX_SEGMENTS_PER_ROOM = Number(process.env.MAX_SEGMENTS || 200);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

const rooms = new Map();

const createRoom = ({
  id = crypto.randomUUID().slice(0, 8),
  title = "",
  prompt = "",
} = {}) => {
  const room = {
    id,
    title: title.trim() || "Historia colaborativa",
    prompt: prompt.trim(),
    segments: [],
    participants: new Map(),
    createdAt: Date.now(),
  };
  rooms.set(room.id, room);
  return room;
};

const getRoom = (roomId, options = {}) => {
  const room =
    rooms.get(roomId) ||
    (options.createIfMissing
      ? createRoom({ id: roomId, title: `Sala ${roomId}` })
      : null);
  return room;
};

const toPublicRoom = (room) => ({
  id: room.id,
  title: room.title,
  prompt: room.prompt,
  createdAt: room.createdAt,
  segments: room.segments,
  participants: Array.from(room.participants.values()),
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: rooms.size });
});

app.get("/api/stories", (_req, res) => {
  const summaries = Array.from(rooms.values()).map((room) => ({
    id: room.id,
    title: room.title,
    prompt: room.prompt,
    createdAt: room.createdAt,
    segments: room.segments.length,
    participants: room.participants.size,
  }));
  res.json(summaries);
});

app.post("/api/stories", (req, res) => {
  const { title, prompt } = req.body || {};
  const room = createRoom({ title, prompt });
  res.status(201).json(toPublicRoom(room));
});

app.get("/api/stories/:id", (req, res) => {
  const { id } = req.params;
  const room = getRoom(id);
  if (!room) {
    res.status(404).json({ message: "Sala no encontrada" });
    return;
  }
  res.json(toPublicRoom(room));
});

const emitRoomState = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }
  io.to(roomId).emit("room_state", toPublicRoom(room));
};

io.on("connection", (socket) => {
  socket.on("join_room", ({ roomId, username, prompt }) => {
    const normalizedRoomId = typeof roomId === "string" ? roomId.trim() : "";
    if (!normalizedRoomId) {
      socket.emit("error_message", "roomId es requerido");
      return;
    }

    const name = (username || "Anónimo").trim().slice(0, 32);
    const initialPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const room =
      getRoom(normalizedRoomId, { createIfMissing: true }) ||
      createRoom({
        id: normalizedRoomId,
        title: `Sala ${normalizedRoomId}`,
        prompt: initialPrompt,
      });

    room.participants.set(socket.id, {
      id: socket.id,
      name,
      joinedAt: Date.now(),
    });

    if (initialPrompt && !room.prompt) {
      room.prompt = initialPrompt;
    }

    socket.join(normalizedRoomId);
    socket.data.roomId = normalizedRoomId;
    socket.data.username = name;

    socket.emit("room_state", toPublicRoom(room));
    socket
      .to(normalizedRoomId)
      .emit("system_message", `${name} se unió a la sala`);
    emitRoomState(normalizedRoomId);
  });

  socket.on("submit_segment", ({ roomId, text }) => {
    const providedRoomId = typeof roomId === "string" ? roomId.trim() : "";
    const targetRoomId = providedRoomId || socket.data.roomId;
    if (!targetRoomId) {
      socket.emit("error_message", "Primero debes unirte a una sala");
      return;
    }

    const room = getRoom(targetRoomId);
    if (!room) {
      socket.emit("error_message", "La sala ya no existe");
      return;
    }

    const cleanText = (text || "").trim();
    if (!cleanText) {
      return;
    }

    const segment = {
      id: crypto.randomUUID(),
      author: socket.data.username || "Anónimo",
      text: cleanText.slice(0, 600),
      createdAt: Date.now(),
    };

    room.segments.push(segment);
    if (room.segments.length > MAX_SEGMENTS_PER_ROOM) {
      room.segments.splice(0, room.segments.length - MAX_SEGMENTS_PER_ROOM);
    }

    io.to(targetRoomId).emit("new_segment", segment);
    emitRoomState(targetRoomId);
  });

  socket.on("clear_story", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.segments = [];
    emitRoomState(roomId);
  });

  socket.on("disconnecting", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.participants.delete(socket.id);
    socket.to(roomId).emit("system_message", `${socket.data.username} salió`);
    emitRoomState(roomId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
