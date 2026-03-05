import { useState, useEffect } from 'react';
import { Bell, Search, Settings, HelpCircle, Sun, Moon, Menu, CheckCheck, Clock, MessageSquare, Calendar } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyNotifications, markAsRead } from '../../store/slices/notificationSlice';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { unreadCounts } = useSelector((state) => state.messages);
    const { notifications } = useSelector((state) => state.notifications);
    const { teachers } = useSelector((state) => state.teachers);
    const { students } = useSelector((state) => state.students);

    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user) {
            dispatch(getMyNotifications());
        }
    }, [dispatch, user]);



    const getSenderName = (senderId) => {
        const contact = [...teachers, ...students].find(c => (c.user?._id || c._id) === senderId);
        return contact?.user?.name || contact?.name || 'Academic Contact';
    };

    const unreadMessagesCount = Object.values(unreadCounts).reduce((a, b) => a + (b.count || 0), 0);
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
    const totalUnread = unreadMessagesCount + unreadNotificationsCount;

    const handleNotificationClick = (notification) => {
        dispatch(markAsRead(notification._id));

        // Navigation logic based on notification type
        switch (notification.type) {
            case 'appointment_request':
            case 'appointment_update':
                navigate('/appointments');
                break;
            case 'new_message':
                navigate(`/chat/${notification.sender?._id || notification.sender}`);
                break;
            default:
                // Fallback or generic page
                break;
        }
        setShowNotifications(false);
    };

    return (
        <nav className="h-20 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-secondary-100 shadow-sm transition-colors duration-300">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="lg:hidden p-2 -ml-2 mr-2 text-secondary-500 hover:bg-secondary-50 rounded-xl transition-colors"
            >
                <Menu size={24} />
            </button>

            <div className="hidden md:flex flex-1 max-w-xl">
                <div className="relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search for something..."
                        className="w-full bg-secondary-50 border border-secondary-100 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-5 flex-shrink-0">


                <div className="h-8 w-[1px] bg-secondary-100 mx-1 hidden sm:block"></div>

                {user?.role !== 'admin' && (
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-xl transition-all ${showNotifications ? 'bg-primary-50 text-primary-600 ring-4 ring-primary-500/5' : 'text-secondary-500 hover:bg-secondary-50 border border-transparent'}`}
                        >
                            <Bell size={20} />
                            {totalUnread > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-600 text-white text-[9px] font-black border-2 border-white rounded-full flex items-center justify-center animate-bounce">
                                    {totalUnread}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute top-full mt-3 right-0 w-[340px] bg-white rounded-3xl shadow-2xl border border-secondary-100 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-5 border-b border-secondary-50 flex justify-between items-center bg-secondary-50/50">
                                            <div>
                                                <h5 className="font-bold text-secondary-900 text-sm uppercase tracking-tight">System Node Alerts</h5>
                                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">{unreadNotificationsCount} unread notifications</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-white border border-secondary-100 flex items-center justify-center text-primary-600 shadow-sm">
                                                <CheckCheck size={16} />
                                            </div>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-2 px-2">
                                            {notifications.length === 0 && unreadMessagesCount === 0 ? (
                                                <div className="p-12 text-center">
                                                    <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center text-secondary-300 mx-auto mb-4">
                                                        <Bell size={32} />
                                                    </div>
                                                    <p className="text-xs font-bold text-secondary-400 uppercase tracking-[0.2em]">Silence across grid</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {Object.entries(unreadCounts).map(([senderId, data]) => data.count > 0 && (
                                                        <div
                                                            key={`msg-${senderId}`}
                                                            onClick={() => { navigate(`/chat/${senderId}`); setShowNotifications(false); }}
                                                            className="p-3 hover:bg-primary-50/40 rounded-2xl flex items-center gap-4 cursor-pointer transition-all group"
                                                        >
                                                            <div className="w-11 h-11 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                                <MessageSquare size={18} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <p className="text-xs font-bold text-secondary-900 truncate uppercase tracking-tight">{getSenderName(senderId)}</p>
                                                                    <span className="text-[10px] font-black text-primary-600 ml-1">{data.count} New</span>
                                                                </div>
                                                                <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">Dispatched communication</p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {notifications.map((n) => (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-3 rounded-2xl flex items-center gap-4 cursor-pointer transition-all group ${n.isRead ? 'opacity-60 hover:bg-secondary-50' : 'bg-secondary-50/50 hover:bg-primary-50/40 outline outline-1 outline-primary-500/10'}`}
                                                        >
                                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform ${n.isRead ? 'bg-secondary-100 text-secondary-400' : 'bg-amber-100 text-amber-600'}`}>
                                                                {n.type?.includes('appointment') ? <Calendar size={18} /> : <Clock size={18} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className="text-[11px] font-bold text-secondary-800 leading-tight line-clamp-2">{n.message}</p>
                                                                    {!n.isRead && <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 animate-pulse mt-1"></div>}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <Clock size={10} className="text-secondary-300" />
                                                                    <p className="text-[9px] text-secondary-400 font-bold uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 bg-secondary-50/50 border-t border-secondary-50">
                                            <button
                                                onClick={() => { navigate('/appointments'); setShowNotifications(false); }}
                                                className="w-full py-2.5 bg-white border border-secondary-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-secondary-500 hover:text-primary-600 hover:border-primary-200 transition-all"
                                            >
                                                Access Global Archive
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <button className="hidden sm:flex p-2 text-secondary-500 rounded-xl border border-transparent hover:bg-secondary-50 transition-colors">
                    <Settings size={20} />
                </button>

                <div className="flex items-center gap-3 pl-2 border-l border-secondary-100 ml-1">
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-bold text-secondary-900 leading-tight">Hello, {user?.name?.split(' ')[0]}</p>
                        <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">{user?.role}</p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-10 h-10 rounded-xl bg-primary-100 border border-primary-200 shadow-sm overflow-hidden cursor-pointer flex items-center justify-center font-bold text-primary-700 uppercase"
                    >
                        {user?.avatar && !user.avatar.includes('default.png') ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)
                        )}
                    </motion.div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
