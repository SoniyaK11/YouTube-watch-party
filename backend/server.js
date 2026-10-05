const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();


// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
    res.send("Watch Party Backend is running!");
});


// ========================================
// SEND PARTICIPANT LIST
// ========================================

function sendParticipants(roomId) {

    const room = rooms.get(roomId);

    if (!room) return;

    const users = [
        {
            socketId: room.host,
            username: room.hostUsername,
            role: "Host"
        }
    ];

    room.participants.forEach((participant) => {

        users.push({
            socketId: participant.socketId,
            username: participant.username,
            role: "participant"
        });

    });

    io.to(roomId).emit("participants_updated", {
        users: users
    });
}


// ========================================
// CLOSE ROOM
// ========================================

function closeRoom(roomId) {

    const room = rooms.get(roomId);

    if (!room) return;

    console.log(
        `Closing room ${roomId}`
    );

    io.to(roomId).emit("room_closed");

    rooms.delete(roomId);
}


// ========================================
// REMOVE PARTICIPANT
// ========================================

function removeParticipant(
    roomId,
    socketId
) {

    const room = rooms.get(roomId);

    if (!room) return;

    const participantIndex =
        room.participants.findIndex(
            participant =>
                participant.socketId === socketId
        );

    if (participantIndex !== -1) {

        room.participants.splice(
            participantIndex,
            1
        );

        console.log(
            `Participant left room ${roomId}`
        );

        sendParticipants(roomId);
    }
}


// ========================================
// WEBSOCKET CONNECTION
// ========================================

io.on("connection", (socket) => {

    console.log(
        "User connected:",
        socket.id
    );


    // ========================================
    // JOIN ROOM
    // ========================================

    socket.on(
        "join_room",
        ({ roomId, username }) => {

            let role;


            // =================================
            // FIRST USER = HOST
            // =================================

            if (!rooms.has(roomId)) {

                rooms.set(roomId, {

                    host:
                        socket.id,

                    hostUsername:
                        username,

                    participants: [],

                    videoId:
                        "dQw4w9WgXcQ",

                    isPlaying:
                        false,

                    currentTime:
                        0

                });

                role = "Host";

            }


            // =================================
            // OTHER USERS = PARTICIPANTS
            // =================================

            else {

                const room =
                    rooms.get(roomId);

                room.participants.push({

                    socketId:
                        socket.id,

                    username:
                        username

                });

                role =
                    "participant";

            }


            socket.join(roomId);


            const room =
                rooms.get(roomId);


            console.log(
                `${username} joined room ${roomId}`
            );


            console.log(
                "Host:",
                room.host
            );


            console.log(
                "Participants:",
                room.participants
            );


            // =================================
            // SEND ROLE
            // =================================

            socket.emit(
                "room_joined",
                {

                    roomId,

                    username,

                    role

                }
            );


            // =================================
            // SEND CURRENT PLAYBACK STATE
            // =================================

            if (
                role ===
                "participant"
            ) {

                socket.emit(
                    "sync_state",
                    {

                        currentTime:
                            room.currentTime,

                        isPlaying:
                            room.isPlaying,

                        videoId:
                            room.videoId

                    }
                );

            }


            // =================================
            // UPDATE PARTICIPANT LIST
            // =================================

            sendParticipants(
                roomId
            );

        }
    );


    // ========================================
    // CHAT MESSAGE
    // ========================================

    socket.on(
        "send_message",
        ({ roomId, message }) => {

            const room =
                rooms.get(roomId);

            if (!room) {

                console.log(
                    "Chat room not found:",
                    roomId
                );

                return;
            }


            let username = null;

            let role = null;


            // HOST

            if (
                socket.id ===
                room.host
            ) {

                username =
                    room.hostUsername;

                role =
                    "Host";

            }


            // PARTICIPANT

            else {

                const participant =
                    room.participants.find(
                        user =>
                            user.socketId ===
                            socket.id
                    );


                if (participant) {

                    username =
                        participant.username;

                    role =
                        "participant";

                }

            }


            if (!username) {

                console.log(
                    "Unauthorized chat attempt:",
                    socket.id
                );

                return;

            }


            if (
                typeof message !==
                    "string" ||
                !message.trim()
            ) {

                return;

            }


            const cleanMessage =
                message.trim();


            io.to(roomId).emit(
                "receive_message",
                {

                    username,

                    role,

                    message:
                        cleanMessage,

                    socketId:
                        socket.id

                }
            );


            console.log(
                `${username}: ${cleanMessage}`
            );

        }
    );


    // ========================================
    // LEAVE ROOM
    // ========================================

    socket.on(
        "leave_room",
        ({ roomId }) => {

            const room =
                rooms.get(roomId);


            if (!room) {

                return;

            }


            console.log(
                `${socket.id} is leaving room ${roomId}`
            );


            // =================================
            // HOST LEAVES
            // =================================

            if (
                socket.id ===
                room.host
            ) {

                console.log(
                    `Host left room ${roomId}`
                );


                closeRoom(
                    roomId
                );


                socket.leave(
                    roomId
                );


                return;

            }


            // =================================
            // PARTICIPANT LEAVES
            // =================================

            removeParticipant(
                roomId,
                socket.id
            );


            socket.to(roomId).emit(
                "user_left",
                {
                    socketId:
                        socket.id
                }
            );


            socket.leave(
                roomId
            );

        }
    );


    // ========================================
    // HOST PLAY
    // ========================================

    socket.on(
        "play",
        ({ roomId, currentTime }) => {

            const room =
                rooms.get(roomId);

            if (!room) return;


            if (
                socket.id !==
                room.host
            ) {

                console.log(
                    "Unauthorized play attempt:",
                    socket.id
                );

                return;

            }


            room.currentTime =
                currentTime;

            room.isPlaying =
                true;


            console.log(
                "Play received:",
                roomId,
                currentTime
            );


            socket.to(roomId).emit(
                "play",
                {
                    currentTime
                }
            );

        }
    );


    // ========================================
    // HOST PAUSE
    // ========================================

    socket.on(
        "pause",
        ({ roomId, currentTime }) => {

            const room =
                rooms.get(roomId);

            if (!room) return;


            if (
                socket.id !==
                room.host
            ) {

                console.log(
                    "Unauthorized pause attempt:",
                    socket.id
                );

                return;

            }


            room.currentTime =
                currentTime;

            room.isPlaying =
                false;


            console.log(
                "Pause received:",
                roomId,
                currentTime
            );


            socket.to(roomId).emit(
                "pause",
                {
                    currentTime
                }
            );

        }
    );


    // ========================================
    // HOST SEEK
    // ========================================

    socket.on(
        "seek",
        ({ roomId, currentTime }) => {

            const room =
                rooms.get(roomId);

            if (!room) return;


            if (
                socket.id !==
                room.host
            ) {

                console.log(
                    "Unauthorized seek attempt:",
                    socket.id
                );

                return;

            }


            room.currentTime =
                currentTime;


            console.log(
                "Seek received:",
                roomId,
                currentTime
            );


            socket.to(roomId).emit(
                "seek",
                {
                    currentTime
                }
            );

        }
    );


    // ========================================
    // HOST CHANGE VIDEO
    // ========================================

    socket.on(
        "change_video",
        ({ roomId, videoId }) => {

            const room =
                rooms.get(roomId);


            if (!room) {

                console.log(
                    "Room not found:",
                    roomId
                );

                return;

            }


            if (
                socket.id !==
                room.host
            ) {

                console.log(
                    "Unauthorized video change attempt:",
                    socket.id
                );

                return;

            }


            room.videoId =
                videoId;

            room.currentTime =
                0;

            room.isPlaying =
                false;


            console.log(
                "Video changed:",
                roomId,
                videoId
            );


            socket.to(roomId).emit(
                "video_changed",
                {
                    videoId
                }
            );

        }
    );


    // ========================================
    // DISCONNECT
    // ========================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "User disconnected:",
                socket.id
            );


            for (
                const [roomId, room]
                of rooms.entries()
            ) {


                // =============================
                // HOST DISCONNECTED
                // =============================

                if (
                    room.host ===
                    socket.id
                ) {

                    console.log(
                        `Host left room ${roomId}`
                    );


                    closeRoom(
                        roomId
                    );


                    continue;

                }


                // =============================
                // PARTICIPANT DISCONNECTED
                // =============================

                const participant =
                    room.participants.find(
                        user =>
                            user.socketId ===
                            socket.id
                    );


                if (participant) {

                    removeParticipant(
                        roomId,
                        socket.id
                    );

                }

            }

        }
    );

});


const PORT = 5000;


server.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);