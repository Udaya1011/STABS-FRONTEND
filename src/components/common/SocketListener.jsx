import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import axios from 'axios';
import { addMessage, setUnreadCount, getUnreadCounts, markMessagesAsRead } from '../../store/slices/messageSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import { getTeachers } from '../../store/slices/teacherSlice';
import { getStudents } from '../../store/slices/studentSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const SocketListener = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { unreadCounts } = useSelector((state) => state.messages);
    const [initialAlertDone, setInitialAlertDone] = useState(false);
    const [notificationSound] = useState(new Audio('/MESSAGE-RINGTONE.mp3'));
    const [soundBlocked, setSoundBlocked] = useState(false);

    // Audio Priming - Unlock audio on first interaction
    useEffect(() => {
        const primeAudio = () => {
            notificationSound.play()
                .then(() => {
                    notificationSound.pause();
                    notificationSound.currentTime = 0;
                    console.log('Audio Engine Unlocked');
                })
                .catch(() => { });
            window.removeEventListener('mousedown', primeAudio);
        };
        window.addEventListener('mousedown', primeAudio);
        return () => window.removeEventListener('mousedown', primeAudio);
    }, [notificationSound]);

    useEffect(() => {
        if (!user) return;

        const socket = io('/');

        socket.emit('join', user._id);

        socket.on('newMessage', (message) => {
            const currentPath = window.location.pathname;
            const isChattingWithSender = currentPath === `/chat/${message.sender._id}` || currentPath === `/chat/${message.sender}`;

            // Play notification sound
            if (message.messageType === 'call') {
                const callAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/1317/1317-preview.mp3');
                callAudio.play().catch(e => console.log('Call audio play failed:', e));
            } else {
                notificationSound.currentTime = 0;
                notificationSound.volume = 0.5;
                notificationSound.play().catch(e => console.log('Message audio play failed:', e));
            }

            if (isChattingWithSender) {
                dispatch(addMessage(message));
                // If we are currently chatting with this user, mark as read immediately
                const senderId = message.sender._id || message.sender;
                axios.post(`/api/messages/${senderId}/read`, {}, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }).catch(err => console.error('Mark as read failed:', err));
            }

            // Show global notification (Always show if it's a Call, even if in chat, to give "Join" option)
            if (message.messageType === 'call' || !isChattingWithSender) {
                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-md w-full bg-white shadow-premium rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 border border-primary-100 overflow-hidden cursor-pointer`}
                        onClick={() => {
                            if (message.messageType === 'call') {
                                window.open(message.fileUrl, '_blank');
                            } else {
                                navigate(`/chat/${message.sender._id || message.sender}`);
                            }
                            toast.dismiss(t.id);
                        }}
                    >
                        <div className="p-5 flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${message.messageType === 'call' ? 'bg-accent-purple animate-pulse' : 'bg-primary-600'}`}>
                                    {(message.sender?.name || 'U').charAt(0)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-secondary-900 uppercase tracking-tighter">
                                    {message.messageType === 'call' ? '📞 Incoming Call Request' : 'New Portal Message'}
                                </p>
                                <p className="mt-1 text-xs font-bold text-secondary-500 line-clamp-2">
                                    {message.sender?.name || 'Academic Faculty'}: {message.content}
                                </p>
                            </div>
                        </div>

                        {message.messageType === 'call' ? (
                            <div className="flex border-t border-secondary-100 bg-secondary-50/30 p-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(message.fileUrl, '_blank');
                                        toast.dismiss(t.id);
                                    }}
                                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                                >
                                    Join Session
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.dismiss(t.id);
                                    }}
                                    className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-secondary-500 hover:text-secondary-700"
                                >
                                    Ignore
                                </button>
                            </div>
                        ) : (
                            <div className="flex border-t border-secondary-100 divide-x divide-secondary-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/chat/${message.sender._id || message.sender}`);
                                        toast.dismiss(t.id);
                                    }}
                                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:bg-secondary-50 transition-all"
                                >
                                    Open Chat
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.dismiss(t.id);
                                    }}
                                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-secondary-600"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                ), { duration: message.messageType === 'call' ? 15000 : 5000 });

                if (message.messageType !== 'call') {
                    // Fetch unread counts to update badges globally
                    dispatch(setUnreadCount({
                        senderId: message.sender._id || message.sender,
                        count: (unreadCounts[message.sender._id || message.sender]?.count || 0) + 1,
                        lastMessageTime: message.createdAt
                    }));
                }
            }
        });

        socket.on('unreadUpdate', (data) => {
            dispatch(setUnreadCount({
                senderId: data.sender,
                count: data.count,
                lastMessageTime: new Date().toISOString()
            }));
        });

        socket.on('messagesRead', (data) => {
            dispatch(markMessagesAsRead(data));
        });

        socket.on('newNotification', (notification) => {
            dispatch(addNotification(notification));

            // Play notification sound
            notificationSound.currentTime = 0;
            notificationSound.volume = 0.5;
            notificationSound.play().catch(e => console.log('Notification audio play failed:', e));

            // System level toast for important alerts
            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-premium rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-amber-100 overflow-hidden cursor-pointer`}
                    onClick={() => {
                        toast.dismiss(t.id);
                        if (notification.type?.includes('appointment')) {
                            navigate('/appointments');
                        }
                    }}
                >
                    <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-500/20">
                                <Calendar size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-secondary-900 uppercase tracking-tight">System Node Alert</p>
                                <p className="mt-0.5 text-[11px] font-bold text-secondary-500 leading-tight">{notification.message}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 6000 });
        });

        return () => socket.close();
    }, [user, dispatch, navigate, unreadCounts]);

    // Initial fetch for unread counts and contacts when user logs in
    useEffect(() => {
        if (user) {
            dispatch(getUnreadCounts());
            dispatch(getTeachers());
            dispatch(getStudents());
        }
    }, [user, dispatch]);

    // Alert on login if there are pending items
    useEffect(() => {
        if (!user || initialAlertDone) return;

        const totalUnread = Object.values(unreadCounts).reduce((acc, curr) => acc + (curr.count || 0), 0);

        if (totalUnread > 0) {
            notificationSound.currentTime = 0;
            notificationSound.volume = 0.4;
            notificationSound.play().catch(() => {
                console.log('Initial sound blocked by browser policy');
            });

            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-primary-600 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer hover:bg-primary-700 transition-all`}
                    onClick={() => {
                        notificationSound.play().catch(() => { });
                        toast.dismiss(t.id);
                    }}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">Welcome Back Chief</p>
                            <p className="text-[11px] font-bold opacity-90 mt-0.5">
                                You have {totalUnread} new notifications. Click here to listen and view.
                            </p>
                        </div>
                    </div>
                </div>
            ), { duration: 6000 });

            setInitialAlertDone(true);
        }
    }, [unreadCounts, user, initialAlertDone]);

    return null;
};

export default SocketListener;
