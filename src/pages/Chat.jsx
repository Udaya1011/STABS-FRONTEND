import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMessages, sendMessage, addMessage, getUnreadCounts, setUnreadCount, reset } from '../store/slices/messageSlice';
import { getTeachers } from '../store/slices/teacherSlice';
import { getStudents } from '../store/slices/studentSlice';
import { Send, Image, Paperclip, MoreVertical, Search, Check, CheckCheck, Smile, MessageSquare, ArrowLeft, X, FileText, Download, Phone, Video, Mic, Camera, StopCircle, Circle, VideoOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import getImageUrl from '../utils/imageUtils';

const Chat = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [socket, setSocket] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedMessageDetails, setSelectedMessageDetails] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const videoRef = useRef(null);
    const recordingTimerRef = useRef(null);

    const dispatch = useDispatch();
    const { messages, unreadCounts, isLoading: messagesLoading } = useSelector((state) => state.messages);
    const { teachers, isLoading: teachersLoading } = useSelector((state) => state.teachers);
    const { students, isLoading: studentsLoading } = useSelector((state) => state.students);
    const { user } = useSelector((state) => state.auth);

    const emojis = ['😊', '😂', '👍', '❤️', '🔥', '✨', '🙏', '🙌', '😎', '🤔', '😢', '😍', '👏', '🎉', '🚀', '💡', '📚', '✅', '❌', '💯'];

    useEffect(() => {
        if (userId) {
            dispatch(reset()); // Clear messages from previous contact
            dispatch(getMessages(userId));
        }
        dispatch(getTeachers());
        dispatch(getStudents());
        dispatch(getUnreadCounts());
    }, [userId, dispatch]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e, fileData = null) => {
        if (e) e.preventDefault();
        if (!userId || (!content.trim() && !fileData)) return;

        const messagePayload = {
            receiver: userId,
            content: content.trim() || (fileData ? `Sent a ${fileData.messageType}` : ''),
            ...(fileData && {
                messageType: fileData.messageType,
                fileUrl: fileData.fileUrl
            })
        };

        dispatch(sendMessage(messagePayload));
        setContent('');
        setShowEmojiPicker(false);
    };

    const handleCall = (type = 'voice') => {
        if (!userId) return;
        
        if (window.initiateCall) {
            window.initiateCall({ 
                id: userId, 
                name: currentChatUser?.name || 'Contact' 
            }, type);
        } else {
            toast.error('The WebRTC engine is not initialized yet.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const token = user?.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const { url, mimetype, originalName } = response.data;
            
            let messageType = 'file';
            if (mimetype.startsWith('image/')) messageType = 'image';
            else if (mimetype.startsWith('video/')) messageType = 'video';
            else if (mimetype.startsWith('audio/')) messageType = 'audio';
            else if (mimetype.includes('pdf')) messageType = 'file';
            else if (mimetype.includes('word') || mimetype.includes('officedocument.wordprocessingml')) messageType = 'file';
            else if (mimetype.includes('excel') || mimetype.includes('officedocument.spreadsheetml')) messageType = 'file';
            else if (mimetype.includes('presentation') || mimetype.includes('officedocument.presentationml')) messageType = 'file';

            handleSendMessage(null, { 
                messageType, 
                fileUrl: url,
                content: content.trim() || `Attachment: ${originalName || 'File'}`
            });
            toast.success(`${messageType.charAt(0).toUpperCase() + messageType.slice(1)} uploaded`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addEmoji = (emoji) => {
        setContent(prev => prev + emoji);
    };

    // Audio Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    setUploading(true);
                    const token = user?.token;
                    const config = {
                        headers: { Authorization: `Bearer ${token}` }
                    };

                    const response = await axios.post('/api/upload', formData, config);
                    handleSendMessage(null, { messageType: 'audio', fileUrl: response.data.url });
                    toast.success('Voice note sent');
                } catch (error) {
                    toast.error('Failed to send voice note');
                } finally {
                    setUploading(false);
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            toast.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Camera Logic
    const openCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setCameraStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            toast.error('Camera access denied');
            setIsCameraOpen(false);
        }
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                setUploading(true);
                const token = user?.token;
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                const response = await axios.post('/api/upload', formData, config);
                handleSendMessage(null, { messageType: 'image', fileUrl: response.data.url });
                toast.success('Photo sent');
                closeCamera();
            } catch (error) {
                toast.error('Failed to upload photo');
            } finally {
                setUploading(false);
            }
        }, 'image/jpeg');
    };

    // Filter out self and format contacts
    const staffContacts = teachers
        .filter(t => t.user?._id)
        .map(t => ({
            id: t.user._id,
            name: t.user.name || 'Academic Faculty',
            role: t.designation || 'Faculty Member',
            active: true,
            avatar: t.user.avatar || '',
            isTeacher: true,
            unread: unreadCounts[t.user._id]?.count || 0
        })).filter(c => c.id !== user?._id);

    const studentContacts = students
        .filter(s => s.user?._id)
        .map(s => ({
            id: s.user._id,
            name: s.user.name || 'Student Portfolio',
            role: `Sem ${s.semester} Student`,
            active: false,
            avatar: s.user.avatar || '',
            isTeacher: false,
            unread: unreadCounts[s.user._id]?.count || 0
        })).filter(c => c.id !== user?._id);

    const activeContacts = (user?.role === 'student' ? staffContacts : [...staffContacts, ...studentContacts])
        .filter(contact => contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.role.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const timeA = new Date(unreadCounts[a.id]?.lastMessageTime || 0).getTime();
            const timeB = new Date(unreadCounts[b.id]?.lastMessageTime || 0).getTime();
            return timeB - timeA;
        });

    const currentChatUser = activeContacts.find(c => c.id === userId);

    return (
        <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl overflow-hidden shadow-premium border border-secondary-100 relative transition-colors duration-300">
            {/* Contact Profile Modal */}
            <AnimatePresence>
                {showProfileModal && currentChatUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-secondary-900/80 backdrop-blur-md cursor-pointer"
                            onClick={() => setShowProfileModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-secondary-100 flex flex-col items-center p-8 text-center"
                        >
                            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 p-2 bg-secondary-50 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                            <div className="w-40 h-40 rounded-3xl overflow-hidden shadow-xl bg-primary-50 text-primary-600 flex items-center justify-center text-5xl font-bold mb-6 border-4 border-white ring-4 ring-primary-50 relative group">
                                {currentChatUser?.avatar && !currentChatUser.avatar.includes('default.png') ? (
                                    <img src={getImageUrl(currentChatUser.avatar)} alt={currentChatUser.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    currentChatUser?.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-secondary-900 uppercase tracking-tight mb-2">{currentChatUser?.name || 'Academic Contact'}</h2>
                            <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest px-4 py-1.5 bg-secondary-50 rounded-lg border border-secondary-100 mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></div>
                                {currentChatUser?.role || 'User'}
                            </p>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Camera Modal */}
            <AnimatePresence>
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-secondary-900/90 backdrop-blur-md"
                            onClick={closeCamera}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-black rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col items-center border border-white/10"
                        >
                            <button onClick={closeCamera} className="absolute top-4 right-4 z-50 p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                            
                            <div className="relative w-full aspect-video bg-secondary-900 flex items-center justify-center">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                />
                                {!cameraStream && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-400 gap-4">
                                        <VideoOff size={48} className="animate-pulse" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Initializing Camera...</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full p-8 bg-black flex items-center justify-center gap-6">
                                <button 
                                    onClick={capturePhoto}
                                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl group"
                                >
                                    <div className="w-12 h-12 bg-white rounded-full group-hover:bg-primary-50 transition-all"></div>
                                </button>
                                <p className="absolute bottom-10 text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Smile & Capture</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className="w-80 border-r border-secondary-100 bg-secondary-50/30 flex flex-col transition-colors">
                <div className="p-6 border-b border-secondary-100">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search directory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary-500 transition-all shadow-sm text-secondary-900"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {activeContacts.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => navigate(`/chat/${contact.id}`)}
                            className={`p-4 mx-3 my-1 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${userId === contact.id ? 'bg-primary-50 shadow-sm border border-primary-100' : 'hover:bg-white hover:shadow-sm hover:border-secondary-100'}`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm overflow-hidden ${contact.isTeacher ? 'bg-primary-50 text-primary-600' : 'bg-secondary-100 text-secondary-500'}`}>
                                    {contact.avatar && !contact.avatar.includes('default.png') ? (
                                        <img src={getImageUrl(contact.avatar)} alt={contact.name} className="w-full h-full object-cover" />
                                    ) : (
                                        contact.name.charAt(0)
                                    )}
                                </div>
                                {contact.active && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success-500 border-2 border-white rounded-full shadow-sm"></div>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className={`font-bold text-sm truncate uppercase tracking-tight ${userId === contact.id ? 'text-primary-600' : 'text-secondary-900'}`}>{contact.name}</h4>
                                    {unreadCounts[contact.id]?.count > 0 && (
                                        <div
                                            className="w-6 h-6 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-[1.5px] border-white relative z-10 leading-none bg-primary-600"
                                        >
                                            {unreadCounts[contact.id].count}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest truncate transition-colors">{contact.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            {userId ? (
                <div className="flex-1 flex flex-col bg-white transition-colors">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between bg-white shadow-sm relative z-10 transition-colors">
                        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
                            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center font-bold text-primary-600 transition-all overflow-hidden group-hover:ring-2 group-hover:ring-primary-300 group-hover:ring-offset-2">
                                {currentChatUser?.avatar && !currentChatUser.avatar.includes('default.png') ? (
                                    <img src={getImageUrl(currentChatUser.avatar)} alt={currentChatUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    currentChatUser?.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-secondary-900 uppercase tracking-tight transition-colors">{currentChatUser?.name || 'Academic Contact'}</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-success-600 font-bold uppercase tracking-widest">Active Presence</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleCall('voice')}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm border border-primary-50"
                            >
                                <Phone size={18} />
                            </button>
                            <button
                                onClick={() => handleCall('video')}
                                className="p-2 text-accent-purple hover:bg-purple-50 rounded-xl transition-all shadow-sm border border-purple-50"
                            >
                                <Video size={18} />
                            </button>
                            <div className="w-px h-6 bg-secondary-100 mx-1"></div>
                            <button className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><Search size={18} /></button>
                            <button className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><MoreVertical size={18} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-secondary-50/20 transition-colors">
                        {messages.map((msg, index) => {
                            const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
                            const key = msg._id || `msg-${index}-${msg.createdAt}`;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={key}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] ${isMe ? 'bg-primary-600 text-white rounded-2xl rounded-tr-none shadow-md' : 'bg-white text-secondary-800 rounded-2xl rounded-tl-none border border-secondary-100 shadow-sm'} p-4 relative group transition-colors`}>
                                        {msg.messageType === 'image' && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-secondary-100">
                                                <img src={getImageUrl(msg.fileUrl)} alt="chat" className="max-w-full h-auto max-h-64 object-cover" />
                                            </div>
                                        )}
                                        {msg.messageType === 'file' && (
                                            <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${isMe ? 'bg-white/10' : 'bg-secondary-50'}`}>
                                                <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-primary-50'}`}>
                                                    <FileText size={20} className={isMe ? 'text-white' : 'text-primary-600'} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{msg.fileUrl?.split('/').pop() || 'Resource'}</p>
                                                    <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-secondary-400'} font-bold uppercase`}>Resource File</p>
                                                </div>
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-lg transition-all ${isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-primary-50 text-primary-600'}`}>
                                                    <Download size={18} />
                                                </a>
                                            </div>
                                        )}
                                        {msg.messageType === 'audio' && (
                                            <div className={`flex items-center gap-4 p-4 rounded-2xl mb-2 ${isMe ? 'bg-white/15' : 'bg-primary-50'} min-w-[240px] shadow-inner`}>
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20' : 'bg-primary-600 text-white shadow-md'}`}>
                                                    <Volume2 size={24} className={isMe ? 'text-white' : 'text-white'} />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isMe ? 'text-white/70' : 'text-primary-600'}`}>Voice Note</span>
                                                        <span className={`text-[9px] font-bold ${isMe ? 'text-white/50' : 'text-secondary-400'}`}>0:00 / 0:15</span>
                                                    </div>
                                                    <audio 
                                                        src={msg.fileUrl} 
                                                        controls 
                                                        className={`h-7 w-full scale-95 origin-left ${isMe ? 'filter-white-controls opacity-90' : 'opacity-80'}`}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {msg.messageType === 'call' && (
                                            <div className={`flex flex-col gap-4 p-5 rounded-2xl mb-2 ${isMe ? 'bg-white/10 border border-white/20' : 'bg-primary-50 border border-primary-100'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${msg.fileUrl ? 'animate-pulse' : ''} ${isMe ? 'bg-white/20' : 'bg-primary-600 text-white'}`}>
                                                        {msg.fileUrl ? <Video size={24} /> : <Phone size={24} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-tight">{msg.content}</p>
                                                        <p className={`text-[10px] font-bold uppercase opacity-60`}>{msg.fileUrl ? 'Encrypted Virtual Session' : 'Call History Log'}</p>
                                                    </div>
                                                </div>
                                                {msg.fileUrl && (
                                                    <a
                                                        href={msg.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isMe ? 'bg-white text-primary-600 hover:bg-primary-50 shadow-md' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'}`}
                                                    >
                                                        Join Virtual Room
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                        <div
                                            className={`flex items-center gap-1.5 mt-2 cursor-pointer select-none ${isMe ? 'text-primary-100/70' : 'text-secondary-400'}`}
                                            onClick={() => setSelectedMessageDetails(selectedMessageDetails === msg._id ? null : msg._id)}
                                        >
                                            <span className="text-[9px] uppercase font-bold tracking-widest">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                <div className="flex items-center gap-1">
                                                    <CheckCheck size={14} className={msg.isRead ? 'text-blue-400' : 'opacity-70'} />
                                                    {msg.isRead && <span className="text-[9px] font-black uppercase tracking-tighter text-blue-400">Seen</span>}
                                                </div>
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {selectedMessageDetails === msg._id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={`mt-2 pt-2 border-t ${isMe ? 'border-white/10' : 'border-secondary-50'} overflow-hidden`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-60">
                                                            <span>Dispatched</span>
                                                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        {msg.isRead && (
                                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-success-500">
                                                                <span>Acknowledged</span>
                                                                <span>{new Date(msg.readAt).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-secondary-100 shadow-lg relative transition-colors">
                        {/* Emoji Picker */}
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute bottom-full left-6 mb-4 p-4 bg-white border border-secondary-200 rounded-2xl shadow-premium z-50 grid grid-cols-5 gap-2 transition-colors"
                                >
                                    {emojis.map(e => (
                                        <button
                                            key={e}
                                            onClick={() => addEmoji(e)}
                                            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-secondary-50 rounded-xl transition-all text-secondary-900"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-secondary-50 border border-secondary-200 p-2 rounded-2xl focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/5 transition-all">
                            <div className="flex items-center gap-1 px-2 border-r border-secondary-200">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-primary-50 text-primary-600' : 'text-secondary-400 hover:text-primary-600 hover:bg-white'} ${isRecording ? 'hidden' : ''}`}
                                >
                                    <Smile size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2.5 text-secondary-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all ${isRecording ? 'hidden' : ''}`}
                                    disabled={uploading}
                                >
                                    <Paperclip size={20} className={uploading ? 'animate-pulse' : ''} />
                                </button>
                                <button
                                    type="button"
                                    onClick={openCamera}
                                    className={`p-2.5 text-secondary-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all ${isRecording ? 'hidden' : ''}`}
                                    disabled={uploading}
                                >
                                    <Camera size={20} />
                                </button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                            </div>
                            {isRecording ? (
                                <div className="flex-1 flex items-center justify-between px-6 bg-red-50 border border-red-100 rounded-xl py-3 animate-pulse shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                                        <div className="flex flex-col">
                                            <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.2em] leading-none mb-1">Live Capture</span>
                                            <span className="text-red-900 font-black text-lg tracking-widest font-mono">{formatTime(recordingTime)}</span>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={stopRecording}
                                        className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg"
                                    >
                                        <StopCircle size={14} fill="white" />
                                        End & Send
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder={uploading ? "Processing transmission..." : "Write a professional message..."}
                                        className="flex-1 border-none focus:ring-0 text-sm font-medium bg-transparent placeholder:text-secondary-400 text-secondary-900"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        disabled={uploading}
                                    />
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="p-2.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                        disabled={uploading}
                                    >
                                        <Mic size={22} />
                                    </button>
                                </>
                            )}
                            <button
                                type="submit"
                                disabled={(!content.trim() && !uploading) || uploading}
                                className="p-3 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white relative overflow-hidden transition-colors">
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white border border-secondary-100 rounded-3xl flex items-center justify-center text-primary-500 mb-8 shadow-premium mx-auto transition-colors">
                            <MessageSquare size={44} />
                        </div>
                        <h2 className="text-3xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">Academic Connectivity</h2>
                        <p className="text-secondary-500 max-w-sm mt-3 mx-auto font-medium leading-relaxed transition-colors">Select a contact from the directory to initiate a secure, high-priority communication channel.</p>
                        <button onClick={() => navigate(user?.role === 'student' ? '/teachers' : '/students')} className="mt-10 btn-primary px-10 py-4 shadow-lg uppercase tracking-widest text-xs font-black transition-all">
                            Open {user?.role === 'student' ? 'Staff' : 'Student'} Directory
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
