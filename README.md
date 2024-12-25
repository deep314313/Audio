# Real-Time Group Voice Chat Application

This is a MERN stack application that enables real-time group voice chat using WebRTC and Socket.IO.

## Features

- Real-time voice communication
- Multiple participants support
- Room-based chat system
- Mute/Unmute functionality
- Simple and intuitive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support

## Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. Start the client in a new terminal:
```bash
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a room ID to create or join a room
2. Allow microphone access when prompted
3. Use the mute/unmute button to control your audio
4. Share the room ID with others to join the same voice chat

## Technologies Used

- React.js
- Node.js
- Express.js
- Socket.IO
- PeerJS (WebRTC)
- CSS3
