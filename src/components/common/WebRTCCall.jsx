import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User, Loader2, Video, VideoOff } from 'lucide-react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { sendMessage } from '../../store/slices/messageSlice';

const WebRTCCall = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);
    const [callState, setCallState] = useState('idle'); // idle, ringing, calling, connected
    const [isCaller, setIsCaller] = useState(false);
    const [partner, setPartner] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
    const [callType, setCallType] = useState('voice'); // 'voice' or 'video'
    const [duration, setDuration] = useState(0);
    
    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const remoteAudio = useRef(new Audio());
    const remoteStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const receiverRingtone = useRef(null);
    const callerRingtone = useRef(null);
    const timerRef = useRef(null);
    const ringTimeoutRef = useRef(null);
    const isCallerRef = useRef(false);
    const partnerRef = useRef(null);
    const callTypeRef = useRef('voice');
    const callStateRef = useRef('idle'); // mirrors callState for use inside socket closures

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    useEffect(() => {
        isCallerRef.current = isCaller;
    }, [isCaller]);

    useEffect(() => {
        partnerRef.current = partner;
    }, [partner]);

    useEffect(() => {
        callTypeRef.current = callType;
    }, [callType]);

    useEffect(() => {
        receiverRingtone.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        callerRingtone.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3');
        
        receiverRingtone.current.loop = true;
        callerRingtone.current.loop = true;

        const primeAudio = () => {
            if (receiverRingtone.current) {
                receiverRingtone.current.play().then(() => {
                    receiverRingtone.current.pause();
                    receiverRingtone.current.currentTime = 0;
                }).catch(() => {});
            }
            if (callerRingtone.current) {
                callerRingtone.current.play().then(() => {
                    callerRingtone.current.pause();
                    callerRingtone.current.currentTime = 0;
                }).catch(() => {});
            }
            window.removeEventListener('mousedown', primeAudio);
        };
        window.addEventListener('mousedown', primeAudio);

        return () => {
            stopAllRingtones();
            window.removeEventListener('mousedown', primeAudio);
        };
    }, []);

    const stopAllRingtones = () => {
        try {
            if (receiverRingtone.current) {
                receiverRingtone.current.pause();
                receiverRingtone.current.currentTime = 0;
                receiverRingtone.current.volume = 0;
            }
            
            if (callerRingtone.current) {
                callerRingtone.current.pause();
                callerRingtone.current.currentTime = 0;
                callerRingtone.current.volume = 0;
            }
        } catch (e) {
            console.log('Error stopping ringtones:', e);
        }
    };

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (!user) return;
        const isProd = import.meta.env.PROD || window.location.hostname.includes('onrender.com');
        const prodURL = 'https://rvscas-backend.onrender.com';
        const envURL = import.meta.env.VITE_API_URL;
        
        const backendUrl = (isProd && (envURL?.includes('localhost'))) ? prodURL : (envURL || (isProd ? prodURL : ''));
        const s = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        setSocket(s);
        socketRef.current = s;

        s.on('connect', () => {
            console.log('RTC Socket Connected:', s.id);
            s.emit('join', user._id);
        });
        s.emit('join', user._id);

        s.on('rtc-offer', async ({ from, offer, senderName, callType: incomingType }) => {
            console.log('Incoming RTC Offer from:', from, senderName, 'Type:', incomingType);
            // GUARD: ignore if we're already in a call
            if (callStateRef.current !== 'idle') {
                console.log('Currently busy, rejecting offer from:', from);
                s.emit('rtc-end', { to: from });
                return;
            }

            setPartner({ id: from, name: senderName });
            setCallType(incomingType || 'voice');
            setCallState('ringing');
            setIsCaller(false);

            stopAllRingtones();
            receiverRingtone.current.volume = 1;
            receiverRingtone.current.play().catch(e => console.log('Ringtone failed:', e));

            // Auto-end after 60 seconds if not answered
            ringTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.emit('rtc-end', { to: from });
                }
                endCallLocally();
            }, 60000);

            peerConnection.current = createPeerConnection(from, incomingType || 'voice');
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        });

        s.on('rtc-answer', async ({ answer }) => {
            // GUARD: only the caller (in 'calling' state) should process the answer
            if (callStateRef.current !== 'calling') return;

            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                stopAllRingtones();
                clearTimeout(ringTimeoutRef.current);
                setCallState('connected');
                startTimer();
            }
        });

        s.on('rtc-candidate', async ({ candidate }) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        s.on('rtc-end', () => {
            endCallLocally();
        });

        s.on('rtc-answered-elsewhere', () => {
            // Stop sound and hide UI without sending another 'Call ended' message
            stopAllRingtones();
            if (timerRef.current) clearInterval(timerRef.current);
            if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
            setCallState('idle');
            setPartner(null);
            setIsCaller(false);
        });

        return () => {
            s.close();
            endCallLocally();
        };
    }, [user?._id]);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setDuration(0);
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const createPeerConnection = (targetId, currentCallType) => {
        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('rtc-candidate', { 
                    to: targetId, 
                    from: user?._id,
                    candidate: event.candidate 
                });
            }
        };

        pc.ontrack = (event) => {
            if (currentCallType === 'video') {
                remoteStreamRef.current = event.streams[0];
                if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            } else {
                remoteAudio.current.srcObject = event.streams[0];
                remoteAudio.current.play().catch(e => console.log('Audio play failed:', e));
            }
        };

        return pc;
    };

    const startCall = async (targetUser, type = 'voice') => {
        if (callStateRef.current !== 'idle') {
            console.log('Call ignored: already in a state of', callStateRef.current);
            return;
        }
        
        try {
            setPartner(targetUser);
            setCallType(type);
            setCallState('calling');
            setIsCaller(true);
            
            stopAllRingtones();
            callerRingtone.current.volume = 1;
            callerRingtone.current.play().catch(e => console.log('Caller ringtone failed:', e));

            // Auto-end after 60 seconds if not answered
            ringTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.emit('rtc-end', { to: targetUser.id });
                }
                endCallLocally();
            }, 60000);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
            localStream.current = stream;
            
            peerConnection.current = createPeerConnection(targetUser.id, type);
            stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

            // Wait for next tick so that localVideoRef resolves if switching to connected state
            if (type === 'video') {
                setTimeout(() => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                }, 100);
            }

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            if (socketRef.current) {
                socketRef.current.emit('rtc-offer', { 
                    to: targetUser.id, 
                    from: user._id,
                    offer, 
                    senderName: user.name,
                    callType: type
                });
            }
        } catch (err) {
            toast.error(`Could not access microphone${type === 'video' ? ' or camera' : ''}`);
            endCallLocally();
        }
    };

    const answerCall = async () => {
        stopAllRingtones();
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
            localStream.current = stream;
            
            stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

            if (callType === 'video') {
                setTimeout(() => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                }, 100);
            }

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            if (socketRef.current) {
                socketRef.current.emit('rtc-answer', { 
                    to: partner.id, 
                    from: user?._id,
                    answer 
                });
            }
            stopAllRingtones();
            clearTimeout(ringTimeoutRef.current);
            setCallState('connected');
            startTimer();
        } catch (err) {
            toast.error(`Microphone${callType === 'video' ? '/Camera' : ''} access failed`);
            rejectCall();
        }
    };

    const rejectCall = () => {
        if (partner && socketRef.current) {
            socketRef.current.emit('rtc-end', { to: partner.id });
        }
        endCallLocally();
    };

    const endCallLocally = () => {
        stopAllRingtones();
        if (timerRef.current) clearInterval(timerRef.current);
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);

        const isCallerVal = isCallerRef.current;
        const partnerVal = partnerRef.current;
        const callTypeVal = callTypeRef.current;

        if (isCallerVal && partnerVal) {
            const isConnected = duration > 0 || callStateRef.current === 'connected';
            const logContent = isConnected 
                ? `Call ended • ${formatTime(duration)}`
                : `Missed call`;

            dispatch(sendMessage({
                receiver: partnerVal.id,
                content: logContent,
                messageType: 'call',
                fileUrl: null
            }));
        }

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        if (peerConnection.current) {
            try { peerConnection.current.close(); } catch(e) {}
            peerConnection.current = null;
        }
        
        try {
            remoteAudio.current.pause();
            remoteAudio.current.srcObject = null;
        } catch(e) {}
        
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        remoteStreamRef.current = null;
        
        setCallState('idle');
        setPartner(null);
        setDuration(0);
        setIsCaller(false);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsSpeakerMuted(false);
    };

    const toggleMute = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted; // If currently muted, enable it. If not, disable it.
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream.current && callType === 'video') {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    const toggleSpeaker = () => {
        const audio = remoteAudio.current;
        if (audio) {
            audio.muted = !isSpeakerMuted;
            setIsSpeakerMuted(!isSpeakerMuted);
        }
    };

    useEffect(() => {
        if (callType === 'video' && callState === 'connected') {
            if (remoteVideoRef.current && remoteStreamRef.current && !remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
            }
            if (localVideoRef.current && localStream.current && !localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject = localStream.current;
            }
        }
    }, [callState, callType]);

    // Expose startCall to window for Chat.jsx to trigger
    useEffect(() => {
        const handler = (targetUser, type = 'voice') => {
            console.log('Global Initiate Call Triggered:', targetUser.id, type);
            startCall(targetUser, type);
        };
        window.initiateCall = handler;
        return () => {
            if (window.initiateCall === handler) {
                delete window.initiateCall;
            }
        };
    }, [user, socket]);

    if (callState === 'idle') return null;
    
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm flex flex-col items-center p-12 text-center border overflow-hidden"
            >
                {/* Avatar / Video Section */}
                {callType === 'video' && callState === 'connected' ? (
                     <div className="relative w-full h-64 bg-secondary-900 rounded-3xl overflow-hidden shadow-xl mb-8 border-4 border-white">
                        {/* Remote Video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {/* Local Video - PiP */}
                        <div className="absolute top-2 right-2 w-20 h-28 bg-black rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {isVideoOff && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                                    <VideoOff size={20} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative mb-8 mt-2">
                        <motion.div 
                            animate={callState === 'ringing' || callState === 'calling' ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`w-32 h-32 ${callType === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-primary-50 text-primary-600'} rounded-[40px] flex items-center justify-center shadow-xl relative z-20 border-4 border-white`}
                        >
                            {callType === 'video' ? <Video size={64} strokeWidth={1.5} /> : <User size={64} strokeWidth={1.5} />}
                        </motion.div>
                        
                        {(callState === 'ringing' || callState === 'calling') && (
                            <div className="absolute inset-0 z-0">
                                <div className={`absolute inset-0 ${callType === 'video' ? 'bg-purple-400' : 'bg-primary-400'} rounded-[40px] opacity-20 scale-150`}></div>
                                <div className={`absolute inset-0 ${callType === 'video' ? 'bg-purple-400' : 'bg-primary-400'} rounded-[40px] opacity-10 scale-[2]`}></div>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                <div className="relative z-10 mb-10 w-full">
                    <h2 className="text-2xl font-black text-secondary-900 uppercase tracking-tight mb-3 truncate px-2">
                        {partner?.name || 'Academic Contact'}
                    </h2>
                    <div className="flex flex-col items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full border ${callState === 'connected' ? 'bg-green-50 text-green-600 border-green-100' : callType === 'video' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-primary-50 text-primary-600 border-primary-100'}`}>
                            {callState === 'ringing' ? `Incoming ${callType}` : 
                             callState === 'calling' ? 'Requesting Connection' : 
                             callState === 'connected' ? `Live Channel • ${formatTime(duration)}` : 'Connecting...'}
                        </span>
                        {callState === 'calling' && (
                            <div className="flex items-center gap-1.5 mt-2 text-secondary-400 italic text-[10px] font-bold uppercase tracking-widest">
                                <Loader2 size={12} className="animate-spin" /> Node Handshake
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex justify-center gap-6 w-full relative z-10 transition-all">
                    {callState === 'ringing' || callState === 'calling' ? (
                        isCaller ? (
                            <>
                                <button onClick={toggleMute} className="flex flex-col items-center gap-2 group">
                                    <div className={`w-14 h-14 ${isMuted ? 'bg-amber-100 text-amber-600' : 'bg-secondary-50 text-secondary-400'} rounded-2xl flex items-center justify-center transition-all shadow-sm`}>
                                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                    </div>
                                </button>
                                <button onClick={toggleSpeaker} className="flex flex-col items-center gap-2 group">
                                    <div className={`w-14 h-14 ${isSpeakerMuted ? 'bg-amber-100 text-amber-600' : 'bg-secondary-50 text-secondary-400'} rounded-2xl flex items-center justify-center transition-all shadow-sm`}>
                                        {isSpeakerMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </div>
                                </button>
                                {callType === 'video' && (
                                    <button onClick={toggleVideo} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-14 h-14 ${isVideoOff ? 'bg-amber-100 text-amber-600' : 'bg-secondary-50 text-secondary-400'} rounded-2xl flex items-center justify-center transition-all shadow-sm`}>
                                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                                        </div>
                                    </button>
                                )}
                                <button onClick={rejectCall} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:bg-red-500 group-hover:text-white">
                                        <PhoneOff size={24} />
                                    </div>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={rejectCall} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:bg-red-500 group-hover:text-white">
                                        <PhoneOff size={24} />
                                    </div>
                                </button>
                                <button onClick={answerCall} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-md animate-bounce hover:bg-green-600">
                                        {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
                                    </div>
                                </button>
                            </>
                        )
                    ) : (
                        <>
                            <button onClick={toggleMute} className="flex flex-col items-center gap-2 group">
                                <div className={`w-14 h-14 ${isMuted ? 'bg-amber-100 text-amber-600' : 'bg-secondary-50 text-secondary-400'} rounded-2xl flex items-center justify-center transition-all shadow-sm hover:brightness-95`}>
                                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                </div>
                            </button>
                            <button onClick={toggleSpeaker} className="flex flex-col items-center gap-2 group">
                                <div className={`w-14 h-14 ${isSpeakerMuted ? 'bg-amber-100 text-amber-600' : 'bg-secondary-50 text-secondary-400'} rounded-2xl flex items-center justify-center transition-all shadow-sm hover:brightness-95`}>
                                    {isSpeakerMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </div>
                            </button>
                            {callType === 'video' && (
                                <button onClick={toggleVideo} className="flex flex-col items-center gap-2 group">
                                    <div className={`w-14 h-14 ${isVideoOff ? 'bg-amber-100 text-amber-600' : 'bg-secondary-50 text-secondary-400'} rounded-2xl flex items-center justify-center transition-all shadow-sm hover:brightness-95`}>
                                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                                    </div>
                                </button>
                            )}
                            <button onClick={rejectCall} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-md hover:bg-red-600">
                                    <PhoneOff size={24} />
                                </div>
                            </button>
                        </>
                    )}
                </div>

                {/* Footer Micro-detail */}
                <div className="mt-8 opacity-30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-secondary-900 rounded-full"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Secure RTC Encryption</span>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default WebRTCCall;
