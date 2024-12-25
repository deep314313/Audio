const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        // Leave previous rooms
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });

        // Join new room
        socket.join(roomId);

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        
        // Add user to room
        rooms.get(roomId).add({ socketId: socket.id, userId });

        // Notify others in room
        socket.to(roomId).emit('user-joined', {
            userId,
            socketId: socket.id
        });

        // Send list of existing users to the new user
        const usersInRoom = Array.from(rooms.get(roomId))
            .filter(user => user.socketId !== socket.id)
            .map(user => ({
                userId: user.userId,
                socketId: user.socketId
            }));

        socket.emit('existing-users', usersInRoom);
        
        console.log(`User ${userId} joined room ${roomId}`);
        console.log('Users in room:', usersInRoom);
    });

    socket.on('disconnect', () => {
        // Remove user from all rooms
        rooms.forEach((users, roomId) => {
            const user = Array.from(users).find(u => u.socketId === socket.id);
            if (user) {
                users.delete(user);
                socket.to(roomId).emit('user-disconnected', socket.id);
                console.log(`User ${user.userId} disconnected from room ${roomId}`);
            }
        });
    });

    // Handle WebRTC signaling
    socket.on('signal', ({ targetId, signal }) => {
        console.log(`Signal from ${socket.id} to ${targetId}:`, signal.type || 'ICE candidate');
        io.to(targetId).emit('signal', {
            userId: socket.id,
            signal
        });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
