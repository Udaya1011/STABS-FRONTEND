import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMessages, sendMessage, addMessage, getUnreadCounts, setUnreadCount, reset } from '../store/slices/messageSlice';
import { getTeachers } from '../store/slices/teacherSlice';
import { getStudents } from '../store/slices/studentSlice';
import { Send, Image, Paperclip, MoreVertical, Search, Check, CheckCheck, Smile, MessageSquare, ArrowLeft, X, FileText, Download, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Chat = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [socket, setSocket] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedMessageDetails, setSelectedMessageDetails] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

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
        const callLink = `https://meet.jit.si/Academic-Consultation-${Math.random().toString(36).substring(7)}`;
        const messagePayload = {
            receiver: userId,
            content: `Incoming ${type === 'voice' ? 'Audio' : 'Video'} Call Request`,
            messageType: 'call',
            fileUrl: callLink
        };
        dispatch(sendMessage(messagePayload));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} call invitation sent`);
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

            const response = await axios.post('/api/upload', formData, config);
            const { url, mimetype } = response.data;

            let messageType = 'file';
            if (mimetype.startsWith('image/')) messageType = 'image';
            else if (mimetype.startsWith('video/')) messageType = 'video';

            handleSendMessage(null, { messageType, fileUrl: url });
            toast.success('File uploaded successfully');
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
                                    <img src={currentChatUser.avatar} alt={currentChatUser.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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

            {/* Sidebar */}
            <div className="w-80 border-r border-secondary-100 bg-secondary-50/30 flex flex-col transition-colors">
                <div className="p-6 border-b border-secondary-100">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search directory..."
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
                                        <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
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
                                        <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-primary-500/20">
                                            {unreadCounts[contact.id].count}
                                        </span>
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
                                    <img src={currentChatUser.avatar} alt={currentChatUser.name} className="w-full h-full object-cover" />
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
                                    <div className={`max-w-[80%] ${isMe ? 'bg-primary-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-primary-500/20' : 'bg-white text-secondary-800 rounded-2xl rounded-tl-none border border-secondary-100 shadow-sm'} p-4 relative group transition-colors`}>
                                        {msg.messageType === 'image' && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-secondary-100">
                                                <img src={msg.fileUrl} alt="chat" className="max-w-full h-auto max-h-64 object-cover" />
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
                                        {msg.messageType === 'call' && (
                                            <div className={`flex flex-col gap-4 p-5 rounded-2xl mb-2 ${isMe ? 'bg-white/10 border border-white/20' : 'bg-primary-50 border border-primary-100'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-pulse ${isMe ? 'bg-white/20' : 'bg-primary-600 text-white'}`}>
                                                        <Video size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-tight">{msg.content}</p>
                                                        <p className={`text-[10px] font-bold uppercase opacity-60`}>Encrypted Virtual Session</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isMe ? 'bg-white text-primary-600 hover:bg-primary-50 shadow-lg' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-500/20'}`}
                                                >
                                                    Join Virtual Room
                                                </a>
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
                                    className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-primary-50 text-primary-600' : 'text-secondary-400 hover:text-primary-600 hover:bg-white'}`}
                                >
                                    <Smile size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 text-secondary-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all"
                                    disabled={uploading}
                                >
                                    <Paperclip size={20} className={uploading ? 'animate-pulse' : ''} />
                                </button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder={uploading ? "Uploading file..." : "Write a professional message..."}
                                className="flex-1 border-none focus:ring-0 text-sm font-medium bg-transparent placeholder:text-secondary-400 text-secondary-900"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={uploading}
                            />
                            <button
                                type="submit"
                                disabled={(!content.trim() && !uploading) || uploading}
                                className="p-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-secondary-50/20 backdrop-blur-sm relative overflow-hidden transition-colors">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600 rounded-full blur-[100px]"></div>
                    </div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white border border-secondary-100 rounded-3xl flex items-center justify-center text-primary-500 mb-8 shadow-premium mx-auto transition-colors">
                            <MessageSquare size={44} />
                        </div>
                        <h2 className="text-3xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">Academic Connectivity</h2>
                        <p className="text-secondary-500 max-w-sm mt-3 mx-auto font-medium leading-relaxed transition-colors">Select a facilitator from the directory to initiate a secure, high-priority communication channel.</p>
                        <button className="mt-10 btn-primary px-10 py-4 shadow-xl shadow-primary-600/20 uppercase tracking-widest text-xs font-black transition-all">Open Staff Directory</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
