# Watch Party

Watch Party is a real-time YouTube video watching application that allows users to create or join a shared room and watch videos together.

The host controls the video playback, while participants automatically stay synchronized with the host. The application also provides real-time chat, participant management, and shareable room links.

## Features

- Create a Watch Party room
- Join an existing room
- Share a room using a unique room link
- Host and Participant roles
- Host-controlled play and pause
- Host-controlled video seeking
- Host can change the YouTube video
- Real-time video synchronization
- Real-time room chat
- Live participant list
- Leave room functionality
- Host-only playback controls
- Room closes when the host leaves
- Responsive user interface

## Technologies Used

### Frontend

- React
- TypeScript
- Vite
- React YouTube
- CSS

### Backend

- Node.js
- Express.js
- Socket.IO
- CORS

### Communication

Socket.IO is used for real-time communication between the host and participants.

## Project Structure

watch-party/

    src/
        App.tsx
        App.css
        lib/
            socket.ts

    server.js
    package.json
    package-lock.json
    README.md

## How It Works

### Create a Room

The first user creates a room and becomes the Host.

The server stores the room information and current video state.

### Join a Room

Another user can enter the Room ID or open the shared room link.

The new user joins the room as a Participant.

### Share Room Link

The host can copy the room link and share it with other users.

Example:

http://localhost:5173/room/ABC123

### Video Synchronization

The host controls the shared YouTube video.

When the host plays, pauses, seeks, or changes the video, the server sends the corresponding event to all participants.

Participants automatically update their video player.

### Room Chat

Users in the same room can send messages through the chat.

Messages are sent using Socket.IO and received by all users in the room.

### Host Leaves

When the host leaves the room, the server closes the room and notifies all participants.

## Socket.IO Events

| Event | Purpose |
|---|---|
| join_room | Create or join a room |
| room_joined | Confirm successful room entry |
| participants_updated | Update the participant list |
| send_message | Send a chat message |
| receive_message | Receive a chat message |
| play | Synchronize video playback |
| pause | Synchronize video pause |
| seek | Synchronize video position |
| change_video | Change the YouTube video |
| video_changed | Notify participants of a video change |
| sync_state | Synchronize the current video state |
| leave_room | Leave the room |
| user_left | Notify users when a participant leaves |
| room_closed | Notify users when the host leaves |
| disconnect | Handle socket disconnection |

## Host Authorization

Only the host is allowed to control the shared video.

The backend verifies the socket ID before allowing the following actions:

- Play
- Pause
- Seek
- Change Video

If a participant attempts to perform these actions, the server rejects the request.

## Installation

### Prerequisites

Install the following:

- Node.js
- npm
- Git

### Clone the Repository

git clone YOUR_GITHUB_REPOSITORY_URL

cd watch-party

### Install Dependencies

Install the frontend dependencies:

npm install

If the backend has a separate package.json, install its dependencies as well:

npm install

Required backend packages include:

npm install express socket.io cors

## Running the Project

### Start the Backend

node server.js

The backend runs on:

http://localhost:5000

### Start the Frontend

npm run dev

The frontend normally runs on:

http://localhost:5173

## Testing

To test the complete application:

1. Open the application.
2. Create a room.
3. Copy the room link.
4. Open the link in another browser or Incognito window.
5. Join the room.
6. Verify the participant list.
7. Test the room chat.
8. Test Play and Pause from the host.
9. Test video seeking from the host.
10. Change the video from the host.
11. Verify that the participant remains synchronized.
12. Test participant leaving.
13. Test host leaving.
14. Verify that the room closes when the host leaves.

## Current Limitations

The current version is an MVP.

Room information is stored in memory on the backend. Restarting the backend server will remove active rooms.

The application currently uses YouTube video IDs for video playback.

## Future Improvements

Possible future improvements include:

- User authentication
- Custom usernames
- Database storage
- Room passwords
- Public and private rooms
- Host transfer
- Multiple hosts
- Video playlists
- Chat timestamps
- Typing indicators
- User profile pictures
- Better error handling
- Production deployment
- Automated testing
- Redis-based room management

## Project Purpose

This project was created to demonstrate practical knowledge of:

- React
- TypeScript
- Node.js
- Express.js
- Socket.IO
- WebSockets
- Real-time communication
- Client-server architecture
- Role-based authorization
- Responsive UI development

## Author

Soniya Kanaujiya

BCA Student

Ambalika Institute of Higher Education

## License

This project is created for educational and portfolio purposes.