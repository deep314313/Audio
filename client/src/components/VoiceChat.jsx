import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const VoiceChat = () => {
    const [roomId, setRoomId] = useState('');
    const [peers, setPeers] = useState({});
    const [connected, setConnected] = useState(false);
    const [muted, setMuted] = useState(false);
    const [userId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
    const socketRef = useRef();
    const userStreamRef = useRef();
    const peersRef = useRef({});

    const createPeerConnection = async (remoteUserId) => {
        try {
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });

            pc.onicecandidate = event => {
                if (event.candidate) {
                    console.log('Sending ICE candidate to:', remoteUserId);
                    socketRef.current.emit('signal', {
                        targetId: remoteUserId,
                        signal: {
                            type: 'candidate',
                            candidate: event.candidate.toJSON()
                        }
                    });
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log(`ICE Connection State with ${remoteUserId}:`, pc.iceConnectionState);
            };

            pc.ontrack = event => {
                console.log('Received remote stream from:', remoteUserId);
                setPeers(prevPeers => ({
                    ...prevPeers,
                    [remoteUserId]: event.streams[0]
                }));
            };

            if (userStreamRef.current) {
                userStreamRef.current.getTracks().forEach(track => {
                    console.log('Adding local track to peer connection:', track.kind);
                    pc.addTrack(track, userStreamRef.current);
                });
            }

            peersRef.current[remoteUserId] = pc;
            return pc;
        } catch (error) {
            console.error('Error creating peer connection:', error);
            return null;
        }
    };

    useEffect(() => {
        socketRef.current = io('http://localhost:5000');
        
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                console.log('Got local stream:', stream.getTracks().map(t => t.kind));
                userStreamRef.current = stream;

                socketRef.current.on('user-joined', async ({ userId: remoteUserId, socketId }) => {
                    console.log('New user joined:', remoteUserId);
                    const pc = await createPeerConnection(socketId);
                    if (pc) {
                        try {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            socketRef.current.emit('signal', {
                                targetId: socketId,
                                signal: {
                                    type: 'offer',
                                    sdp: pc.localDescription.sdp
                                }
                            });
                        } catch (error) {
                            console.error('Error creating offer:', error);
                        }
                    }
                });

                socketRef.current.on('existing-users', async (users) => {
                    console.log('Existing users in room:', users);
                    for (const user of users) {
                        await createPeerConnection(user.socketId);
                    }
                });

                socketRef.current.on('user-disconnected', (socketId) => {
                    console.log('User disconnected:', socketId);
                    if (peersRef.current[socketId]) {
                        peersRef.current[socketId].close();
                        setPeers(prevPeers => {
                            const newPeers = { ...prevPeers };
                            delete newPeers[socketId];
                            return newPeers;
                        });
                        delete peersRef.current[socketId];
                    }
                });

                socketRef.current.on('signal', async ({ userId: remoteUserId, signal }) => {
                    console.log('Received signal:', signal.type, 'from:', remoteUserId);
                    try {
                        let pc = peersRef.current[remoteUserId];
                        
                        if (!pc) {
                            console.log('Creating new peer connection for:', remoteUserId);
                            pc = await createPeerConnection(remoteUserId);
                        }

                        if (!pc) {
                            console.error('Failed to create peer connection for:', remoteUserId);
                            return;
                        }

                        if (signal.type === 'offer') {
                            console.log('Processing offer from:', remoteUserId);
                            await pc.setRemoteDescription(new RTCSessionDescription({
                                type: 'offer',
                                sdp: signal.sdp
                            }));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            socketRef.current.emit('signal', {
                                targetId: remoteUserId,
                                signal: {
                                    type: 'answer',
                                    sdp: answer.sdp
                                }
                            });
                        } else if (signal.type === 'answer') {
                            console.log('Processing answer from:', remoteUserId);
                            await pc.setRemoteDescription(new RTCSessionDescription({
                                type: 'answer',
                                sdp: signal.sdp
                            }));
                        } else if (signal.type === 'candidate') {
                            console.log('Processing ICE candidate from:', remoteUserId);
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        }
                    } catch (error) {
                        console.error('Error handling signal:', error);
                    }
                });
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('Error accessing microphone. Please ensure you have a working microphone and you have granted permission to use it.');
            });

        return () => {
            userStreamRef.current?.getTracks().forEach(track => {
                track.stop();
            });
            Object.values(peersRef.current).forEach(pc => {
                pc.close();
            });
            socketRef.current?.disconnect();
        };
    }, []);

    const joinRoom = () => {
        if (roomId.trim()) {
            console.log('Joining room:', roomId, 'as user:', userId);
            socketRef.current.emit('join-room', roomId, userId);
            setConnected(true);
        }
    };

    const toggleMute = () => {
        if (userStreamRef.current) {
            const audioTrack = userStreamRef.current.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setMuted(!muted);
        }
    };

    return (
        <div className="voice-chat-container">
            <h2>Voice Chat Room</h2>
            {!connected ? (
                <div className="join-room">
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                    />
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            ) : (
                <div className="room-controls">
                    <h3>Room ID: {roomId}</h3>
                    <p>Your ID: {userId}</p>
                    <button className={muted ? 'muted' : ''} onClick={toggleMute}>
                        {muted ? 'Unmute' : 'Mute'}
                    </button>
                    <div className="participants">
                        <h4>Participants: {Object.keys(peers).length + 1}</h4>
                        <ul>
                            <li>You (Host)</li>
                            {Object.entries(peers).map(([peerId]) => (
                                <li key={peerId}>Participant {peerId}</li>
                            ))}
                        </ul>
                    </div>
                    {Object.entries(peers).map(([peerId, stream]) => (
                        <audio
                            key={peerId}
                            autoPlay
                            ref={element => {
                                if (element) element.srcObject = stream;
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoiceChat;
