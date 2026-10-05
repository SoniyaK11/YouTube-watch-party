import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import { socket } from "./lib/socket";
import "./App.css";

type User = {
  socketId: string;
  username: string;
  role: string;
};

type ChatMessage = {
  username: string;
  role: string;
  message: string;
  socketId: string;
};

function App() {

  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [role, setRole] = useState("");

  const [videoId, setVideoId] =
    useState("dQw4w9WgXcQ");

  const [newVideoId, setNewVideoId] =
    useState("");

  const [users, setUsers] =
    useState<User[]>([]);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [messageInput, setMessageInput] =
    useState("");

  const playerRef =
    useRef<YouTubeEvent["target"] | null>(null);

  const pendingSyncRef = useRef<{
    currentTime: number;
    isPlaying: boolean;
    videoId?: string;
  } | null>(null);

  const lastTimeRef = useRef(0);

  const isSyncingRef = useRef(false);

  const participantStateRef = useRef<{
    currentTime: number;
    isPlaying: boolean;
  }>({
    currentTime: 0,
    isPlaying: false,
  });


  // ========================================
  // ROOM LINK
  // ========================================

  useEffect(() => {

    const path =
      window.location.pathname;

    if (path.startsWith("/room/")) {

      const roomFromUrl =
        path
          .replace("/room/", "")
          .trim()
          .toUpperCase();

      if (roomFromUrl) {

        setJoinRoomId(
          roomFromUrl
        );

      }

    }

  }, []);


  // ========================================
  // CREATE ROOM
  // ========================================

  const createRoom = () => {

    const newRoomId =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    setRoomId(newRoomId);

    socket.emit("join_room", {
      roomId: newRoomId,
      username: "Host",
    });

  };


  // ========================================
  // JOIN ROOM
  // ========================================

  const joinRoom = () => {

    if (!joinRoomId.trim()) {

      alert(
        "Please enter a Room ID"
      );

      return;
    }

    const room =
      joinRoomId
        .trim()
        .toUpperCase();

    socket.emit(
      "join_room",
      {
        roomId: room,
        username: "Participant",
      }
    );

  };


  // ========================================
  // COPY ROOM LINK
  // ========================================

  const copyRoomLink = async () => {

    const link =
      `${window.location.origin}/room/${roomId}`;

    try {

      await navigator.clipboard.writeText(
        link
      );

      alert(
        "Room link copied!"
      );

    } catch (error) {

      console.error(
        "Failed to copy link:",
        error
      );

      alert(
        "Could not copy the link. Please copy it manually."
      );

    }

  };


  // ========================================
  // ROOM JOINED
  // ========================================

  useEffect(() => {

    const handleRoomJoined =
      (data: {
        roomId: string;
        username: string;
        role: string;
      }) => {

        console.log(
          "Room joined:",
          data
        );

        setRoomId(
          data.roomId
        );

        setRole(
          data.role
        );

        console.log(
          "My role is:",
          data.role
        );

      };

    socket.on(
      "room_joined",
      handleRoomJoined
    );

    return () => {

      socket.off(
        "room_joined",
        handleRoomJoined
      );

    };

  }, []);


  // ========================================
  // PARTICIPANT LIST
  // ========================================

  useEffect(() => {

    const handleParticipantsUpdated =
      (data: {
        users: User[];
      }) => {

        console.log(
          "Participants updated:",
          data.users
        );

        setUsers(
          data.users
        );

      };

    socket.on(
      "participants_updated",
      handleParticipantsUpdated
    );

    return () => {

      socket.off(
        "participants_updated",
        handleParticipantsUpdated
      );

    };

  }, []);


  // ========================================
  // CHAT RECEIVE
  // ========================================

  useEffect(() => {

    const handleReceiveMessage =
      (data: ChatMessage) => {

        setMessages(
          previousMessages => [
            ...previousMessages,
            data,
          ]
        );

      };

    socket.on(
      "receive_message",
      handleReceiveMessage
    );

    return () => {

      socket.off(
        "receive_message",
        handleReceiveMessage
      );

    };

  }, []);


  // ========================================
  // HOST LEFT / ROOM CLOSED
  // ========================================

  useEffect(() => {

    const handleRoomClosed = () => {

      alert(
        "The host has left. This room has been closed."
      );

      setRoomId("");

      setRole("");

      setUsers([]);

      setMessages([]);

      setMessageInput("");

      setVideoId(
        "dQw4w9WgXcQ"
      );

      setNewVideoId("");

      setJoinRoomId("");

      playerRef.current = null;

      pendingSyncRef.current = null;

      participantStateRef.current = {
        currentTime: 0,
        isPlaying: false,
      };

      window.history.replaceState(
        {},
        "",
        "/"
      );

    };


    socket.on(
      "room_closed",
      handleRoomClosed
    );


    return () => {

      socket.off(
        "room_closed",
        handleRoomClosed
      );

    };

  }, []);


  // ========================================
  // LEAVE ROOM
  // ========================================

  const leaveRoom = () => {

    if (!roomId) {
      return;
    }


    const shouldLeave =
      window.confirm(
        role === "Host"
          ? "Leaving will close the room for everyone. Continue?"
          : "Do you want to leave this room?"
      );


    if (!shouldLeave) {
      return;
    }


    socket.emit(
      "leave_room",
      {
        roomId,
      }
    );


    // Reset frontend

    setRoomId("");

    setRole("");

    setUsers([]);

    setMessages([]);

    setMessageInput("");

    setVideoId(
      "dQw4w9WgXcQ"
    );

    setNewVideoId("");

    setJoinRoomId("");

    playerRef.current = null;

    pendingSyncRef.current = null;

    participantStateRef.current = {
      currentTime: 0,
      isPlaying: false,
    };


    // Return URL to homepage

    window.history.replaceState(
      {},
      "",
      "/"
    );

  };


  // ========================================
  // SEND CHAT MESSAGE
  // ========================================

  const sendMessage = () => {

    const message =
      messageInput.trim();


    if (!message) {
      return;
    }


    socket.emit(
      "send_message",
      {

        roomId,

        message,

      }
    );


    setMessageInput("");

  };


  // ========================================
  // SEND MESSAGE WITH ENTER
  // ========================================

  const handleChatKeyDown = (
    event:
      React.KeyboardEvent<HTMLInputElement>
  ) => {

    if (
      event.key === "Enter"
    ) {

      sendMessage();

    }

  };


  // ========================================
  // YOUTUBE READY
  // ========================================

  const handleReady = (
    event: YouTubeEvent
  ) => {

    playerRef.current =
      event.target;

    console.log(
      "YouTube player ready"
    );


    if (pendingSyncRef.current) {

      const sync =
        pendingSyncRef.current;


      if (sync.videoId) {

        setVideoId(
          sync.videoId
        );

      }


      event.target.seekTo(
        sync.currentTime,
        true
      );


      if (sync.isPlaying) {

        event.target.playVideo();

      } else {

        event.target.pauseVideo();

      }


      pendingSyncRef.current =
        null;

    }


    lastTimeRef.current =
      event.target.getCurrentTime();

  };


  // ========================================
  // HOST PLAY
  // ========================================

  const handlePlay = () => {

    if (role !== "Host") {

      console.log(
        "Participant play ignored"
      );

      return;
    }


    if (isSyncingRef.current)
      return;


    const currentTime =
      playerRef.current
        ?.getCurrentTime() ?? 0;


    participantStateRef.current = {

      currentTime,

      isPlaying: true,

    };


    socket.emit(
      "play",
      {
        roomId,
        currentTime,
      }
    );


    console.log(
      "HOST PLAY:",
      currentTime
    );

  };


  // ========================================
  // HOST PAUSE
  // ========================================

  const handlePause = () => {

    if (role !== "Host") {

      console.log(
        "Participant pause ignored"
      );

      return;
    }


    if (isSyncingRef.current)
      return;


    const currentTime =
      playerRef.current
        ?.getCurrentTime() ?? 0;


    participantStateRef.current = {

      currentTime,

      isPlaying: false,

    };


    socket.emit(
      "pause",
      {
        roomId,
        currentTime,
      }
    );


    console.log(
      "HOST PAUSE:",
      currentTime
    );

  };


  // ========================================
  // PLAYBACK SYNCHRONIZATION
  // ========================================

  useEffect(() => {

    const handlePlayEvent =
      (data: {
        currentTime: number;
      }) => {

        if (role === "Host")
          return;


        participantStateRef.current = {

          currentTime:
            data.currentTime,

          isPlaying: true,

        };


        if (!playerRef.current)
          return;


        isSyncingRef.current =
          true;


        playerRef.current.seekTo(
          data.currentTime,
          true
        );


        playerRef.current.playVideo();


        setTimeout(() => {

          isSyncingRef.current =
            false;

        }, 1000);

      };


    const handlePauseEvent =
      (data: {
        currentTime: number;
      }) => {

        if (role === "Host")
          return;


        participantStateRef.current = {

          currentTime:
            data.currentTime,

          isPlaying: false,

        };


        if (!playerRef.current)
          return;


        isSyncingRef.current =
          true;


        playerRef.current.seekTo(
          data.currentTime,
          true
        );


        playerRef.current.pauseVideo();


        setTimeout(() => {

          isSyncingRef.current =
            false;

        }, 1000);

      };


    const handleSeekEvent =
      (data: {
        currentTime: number;
      }) => {

        if (role === "Host")
          return;


        if (!playerRef.current)
          return;


        isSyncingRef.current =
          true;


        playerRef.current.seekTo(
          data.currentTime,
          true
        );


        participantStateRef.current.currentTime =
          data.currentTime;


        setTimeout(() => {

          isSyncingRef.current =
            false;

        }, 500);

      };


    const handleSyncState =
      (data: {
        currentTime: number;
        isPlaying: boolean;
        videoId: string;
      }) => {

        if (role === "Host")
          return;


        setVideoId(
          data.videoId
        );


        participantStateRef.current = {

          currentTime:
            data.currentTime,

          isPlaying:
            data.isPlaying,

        };


        if (!playerRef.current) {

          pendingSyncRef.current =
            data;

          return;

        }


        isSyncingRef.current =
          true;


        playerRef.current.seekTo(
          data.currentTime,
          true
        );


        if (data.isPlaying) {

          playerRef.current.playVideo();

        } else {

          playerRef.current.pauseVideo();

        }


        setTimeout(() => {

          isSyncingRef.current =
            false;

        }, 1000);

      };


    const handleVideoChanged =
      (data: {
        videoId: string;
      }) => {

        if (role === "Host")
          return;


        participantStateRef.current = {

          currentTime: 0,

          isPlaying: false,

        };


        setVideoId(
          data.videoId
        );

      };


    socket.on(
      "play",
      handlePlayEvent
    );

    socket.on(
      "pause",
      handlePauseEvent
    );

    socket.on(
      "seek",
      handleSeekEvent
    );

    socket.on(
      "sync_state",
      handleSyncState
    );

    socket.on(
      "video_changed",
      handleVideoChanged
    );


    return () => {

      socket.off(
        "play",
        handlePlayEvent
      );

      socket.off(
        "pause",
        handlePauseEvent
      );

      socket.off(
        "seek",
        handleSeekEvent
      );

      socket.off(
        "sync_state",
        handleSyncState
      );

      socket.off(
        "video_changed",
        handleVideoChanged
      );

    };

  }, [role]);


  // ========================================
  // HOST SEEK DETECTION
  // ========================================

  useEffect(() => {

    if (role !== "Host")
      return;


    const interval =
      setInterval(() => {

        if (!playerRef.current)
          return;


        const currentTime =
          playerRef.current
            .getCurrentTime();


        const playerState =
          playerRef.current
            .getPlayerState();


        if (
          playerState === 1 &&
          Math.abs(
            currentTime -
            lastTimeRef.current
          ) > 1.5
        ) {

          socket.emit(
            "seek",
            {
              roomId,
              currentTime,
            }
          );

        }


        lastTimeRef.current =
          currentTime;


      }, 500);


    return () => {

      clearInterval(
        interval
      );

    };

  }, [role, roomId]);


  // ========================================
  // CHANGE VIDEO
  // ========================================

  const changeVideo = () => {

    const id =
      newVideoId.trim();


    if (!id) {

      alert(
        "Please enter a YouTube Video ID"
      );

      return;

    }


    if (role !== "Host")
      return;


    socket.emit(
      "change_video",
      {
        roomId,
        videoId: id,
      }
    );


    setVideoId(id);

    setNewVideoId("");

  };


  // ========================================
  // UI
  // ========================================

  return (
    <div className="app">

      {!roomId ? (

        /* ================================
           HOME PAGE
           ================================ */

        <div className="home-page">

          <div className="home-card">

            <h1 className="home-title">
              Watch Party
            </h1>

            <p className="home-subtitle">
              Watch YouTube videos together in real time.
            </p>


            {/* CREATE ROOM */}

            <div className="home-section">

              <button
                className="primary-button"
                onClick={createRoom}
              >
                Create Room
              </button>

            </div>


            {/* JOIN ROOM */}

            <div className="home-section">

              <div className="home-section-title">
                Join an existing room
              </div>

              <div className="join-row">

                <input
                  className="input"
                  type="text"
                  placeholder="Enter Room ID"
                  value={joinRoomId}
                  onChange={(e) =>
                    setJoinRoomId(
                      e.target.value.toUpperCase()
                    )
                  }
                />

                <button
                  className="secondary-button"
                  onClick={joinRoom}
                >
                  Join Room
                </button>

              </div>


              {/* LINK NOTICE */}

              {joinRoomId &&
                window.location.pathname.startsWith(
                  "/room/"
                ) && (

                  <div className="link-notice">
                    Room ID detected from your link.
                    Click <strong>Join Room</strong> to enter.
                  </div>

                )}

            </div>

          </div>

        </div>

      ) : (

        /* ================================
           ROOM PAGE
           ================================ */

        <div className="room-page">

          <div className="room-container">


            {/* ================================
               ROOM HEADER
               ================================ */}

            <div className="room-header">

              <div className="room-info">

                <h1>
                   Watch Party
                </h1>

                <p>
                  Room ID:{" "}
                  <strong>
                    {roomId}
                  </strong>
                </p>

                <p>
                  Role:{" "}
                  <strong>
                    {role}
                  </strong>
                </p>

              </div>


              <div className="room-actions">

                <button
                  className="secondary-button"
                  onClick={copyRoomLink}
                >
                  Copy Room Link
                </button>

                <button
                  className="danger-button"
                  onClick={leaveRoom}
                >
                  Leave Room
                </button>

              </div>

            </div>


            {/* ================================
               PARTICIPANTS
               ================================ */}

            <div className="participants-card">

              <h2 className="participants-title">
                People in Room ({users.length})
              </h2>


              {users.length === 0 ? (

                <p style={{ color: "#94a3b8" }}>
                  No users found
                </p>

              ) : (

                <div className="participants-list">

                  {users.map((user) => (

                    <div
                      className="participant"
                      key={user.socketId}
                    >

                      <span className="participant-icon">
                        {user.role === "Host"
                          ? " "
                          : " "}
                      </span>

                      <div>

                        <div className="participant-name">
                          {user.username}
                        </div>

                        <div className="participant-role">
                          {user.role}
                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>


            {/* ================================
               MAIN CONTENT
               ================================ */}

            <div className="main-content">


              {/* ================================
                 VIDEO
                 ================================ */}

              <div className="video-card">

                <div className="video-header">

                  <h2>
                    Now Playing
                  </h2>

                </div>


                {/* HOST VIDEO CHANGE */}

                {role === "Host" && (

                  <div className="video-change">

                    <input
                      className="input"
                      type="text"
                      placeholder="Enter YouTube Video ID"
                      value={newVideoId}
                      onChange={(e) =>
                        setNewVideoId(e.target.value)
                      }
                    />

                    <button
                      className="secondary-button"
                      onClick={changeVideo}
                    >
                      Change Video
                    </button>

                  </div>

                )}


                {/* YOUTUBE PLAYER */}

                <div className="youtube-container">

                  <YouTube
                    key={videoId}
                    videoId={videoId}
                    onReady={handleReady}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    opts={{
                      width: "100%",
                      height: "100%",
                      playerVars: {
                        autoplay: 0,
                        controls: role === "Host" ? 1 : 0,
                        modestbranding: 1,
                      },
                    }}
                  />


                  {/* PARTICIPANT OVERLAY */}

                  {role === "participant" && (

                    <div
                      className="participant-overlay"
                      title="Only the host can control playback"
                    />

                  )}

                </div>


                {/* ROLE INFORMATION */}

                <p className="role-message">

                  {role === "Host" ? (

                    <>
                      <strong>Host:</strong>{" "}
                      You control playback and can change
                      the video.
                    </>

                  ) : (

                    <>
                      <strong>Participant:</strong>{" "}
                      Playback is controlled by the host.
                    </>

                  )}

                </p>

              </div>


              {/* ================================
                 CHAT
                 ================================ */}

              <div className="chat-card">

                <h2 className="chat-title">
                   Room Chat
                </h2>


                <div className="chat-messages">

                  {messages.length === 0 ? (

                    <div className="empty-chat">

                      <div>
                        No messages yet.
                        <br />
                        Start the conversation!
                      </div>

                    </div>

                  ) : (

                    messages.map(
                      (chatMessage, index) => (

                        <div
                          className="message"
                          key={`${chatMessage.socketId}-${index}`}
                        >

                          <div
                            className={`message-user ${
                              chatMessage.role === "Host"
                                ? "host"
                                : "participant"
                            }`}
                          >

                            {chatMessage.role === "Host"
                              ? "   "
                              : "   "}

                            {chatMessage.username}

                          </div>


                          <div className="message-text">
                            {chatMessage.message}
                          </div>

                        </div>

                      )
                    )

                  )}

                </div>


                {/* CHAT INPUT */}

                <div className="chat-input-row">

                  <input
                    className="input"
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) =>
                      setMessageInput(e.target.value)
                    }
                    onKeyDown={handleChatKeyDown}
                  />

                  <button
                    className="chat-send"
                    onClick={sendMessage}
                  >
                    Send
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;
