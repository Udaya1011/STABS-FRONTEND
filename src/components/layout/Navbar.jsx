import { useState, useEffect } from 'react';
import { Bell, HelpCircle, Sun, Moon, Menu, CheckCheck, Clock, MessageSquare, Calendar, Search, Download, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resetNotifications, markNotificationRead } from '../../store/slices/notificationSlice';
import getImageUrl from '../../utils/imageUtils';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { unreadCounts } = useSelector((state) => state.messages);
    const { notifications } = useSelector((state) => state.notifications);
    const { teachers } = useSelector((state) => state.teachers);
    const { students } = useSelector((state) => state.students);
    const { departments } = useSelector((state) => state.departments);

    const [showNotifications, setShowNotifications] = useState(false);
    const [showDeptStats, setShowDeptStats] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null); // 'sem', 'year', 'dept'
    const [selectedFilters, setSelectedFilters] = useState({
        sem: 'all',
        year: 'all',
        dept: 'all'
    });

    const getPageInfo = () => {
        const path = location.pathname;
        if (path === '/' || path === '/dashboard') return { title: 'Dashboard', subtitle: 'System overview and metrics' };
        if (path.startsWith('/departments')) return { title: 'Departments', subtitle: 'Manage academic departments' };
        if (path.startsWith('/subjects')) return { title: 'Subjects', subtitle: 'Academic curriculum control' };
        if (path.startsWith('/teachers')) return { title: 'Faculty & Staff', subtitle: 'Manage teaching personnel' };
        if (path.startsWith('/students')) return { title: 'Students', subtitle: 'Manage student directory' };
        if (path.startsWith('/appointments')) return { title: 'Appointments', subtitle: 'Academic schedule management' };
        if (path.startsWith('/chat')) return { title: 'Messages', subtitle: 'Direct communications network' };
        if (path.startsWith('/videos')) return { title: 'Resources', subtitle: 'Academic video archive' };
        if (path.startsWith('/profile')) return { title: 'My Profile', subtitle: 'Manage your account settings' };

        const parts = path.split('/').filter(Boolean);
        if (parts.length > 0) {
            return {
                title: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).replace(/-/g, ' '),
                subtitle: 'System Module'
            };
        }
        return { title: 'Overview', subtitle: 'System control panel' };
    };

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
        <nav className="h-24 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-secondary-100 transition-colors duration-300">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="md:hidden p-2 -ml-2 mr-2 text-secondary-500 hover:bg-secondary-50 rounded-xl transition-colors"
            >
                <Menu size={24} />
            </button>

            <div className="hidden md:flex flex-1 items-center">
                <div className="flex items-center gap-4 py-1">
                    <div className="w-1 h-8 bg-primary-600 rounded-full" />
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-black text-primary-600 tracking-tight leading-none mb-1">
                            {getPageInfo().title}
                        </h1>
                        <p className="text-[9px] font-black text-secondary-900 uppercase tracking-[0.2em]">
                            {getPageInfo().subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
                <div className="hidden lg:flex items-center gap-3">
                    {location.pathname.startsWith('/departments') && (
                        <div className="relative">
                            <button
                                onClick={() => setShowDeptStats(!showDeptStats)}
                                className={`p-2 rounded-xl transition-all ${showDeptStats ? 'bg-primary-50 text-primary-600 ring-4 ring-primary-500/5' : 'text-secondary-500 hover:bg-secondary-50 border border-transparent'}`}
                                title="Department Statistics"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                            </button>

                            <AnimatePresence>
                                {showDeptStats && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDeptStats(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute top-full mt-3 left-0 w-[280px] bg-white rounded-3xl shadow-2xl border border-secondary-100 overflow-hidden z-50 origin-top-left p-5"
                                        >
                                            <h5 className="font-bold text-secondary-900 text-sm uppercase tracking-tight mb-4 border-b border-secondary-50 pb-2">Department Overview</h5>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-secondary-50/50 p-3 rounded-xl border border-secondary-50">
                                                    <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest">Total Depts</span>
                                                    <span className="text-sm font-black text-primary-600">{departments?.length || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary-50/50 p-3 rounded-xl border border-secondary-50">
                                                    <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest">Total Blocks</span>
                                                    <span className="text-sm font-black text-primary-600">{departments?.reduce((sum, d) => sum + (d.blocks?.length || 0), 0) || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary-50/50 p-3 rounded-xl border border-secondary-50">
                                                    <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest">Total Rooms</span>
                                                    <span className="text-sm font-black text-primary-600">{departments?.reduce((sum, d) => sum + (d.classrooms?.length || 0), 0) || 0}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}


                    {location.pathname.startsWith('/students') && (
                        <div className="flex items-center gap-2">
                             {/* Semester Dropdown */}
                             <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'sem' ? null : 'sem')}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDropdown === 'sem' ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-sm' : 'border-primary-100 bg-secondary-50 text-secondary-600 hover:bg-primary-50 hover:border-primary-300'}`}
                                >
                                    <span>Sems: {selectedFilters.sem === 'all' ? 'All' : selectedFilters.sem}</span>
                                    <motion.div animate={{ rotate: activeDropdown === 'sem' ? 180 : 0 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'sem' && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full mt-2 left-0 w-32 bg-white rounded-2xl shadow-2xl border border-secondary-100 overflow-hidden z-50 p-1.5"
                                            >
                                                <button onClick={() => { setSelectedFilters({...selectedFilters, sem: 'all'}); window.dispatchEvent(new CustomEvent('semester-filter', { detail: 'all' })); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-50 hover:text-primary-600 transition-colors">All Semesters</button>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                    <button key={s} onClick={() => { setSelectedFilters({...selectedFilters, sem: s}); window.dispatchEvent(new CustomEvent('semester-filter', { detail: s })); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-50 hover:text-primary-600 transition-colors">Semester {s}</button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Year Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDropdown === 'year' ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-sm' : 'border-primary-100 bg-secondary-50 text-secondary-600 hover:bg-primary-50 hover:border-primary-300'}`}
                                >
                                    <span>Year: {selectedFilters.year === 'all' ? 'All' : selectedFilters.year}</span>
                                    <motion.div animate={{ rotate: activeDropdown === 'year' ? 180 : 0 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'year' && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full mt-2 left-0 w-36 bg-white rounded-2xl shadow-2xl border border-secondary-100 overflow-hidden z-50 p-1.5"
                                            >
                                                <button onClick={() => { setSelectedFilters({...selectedFilters, year: 'all'}); window.dispatchEvent(new CustomEvent('year-filter', { detail: 'all' })); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-50 hover:text-primary-600 transition-colors">All Years</button>
                                                {[...new Set(students.map(s => s.academicYear))].filter(Boolean).sort().map(y => (
                                                    <button key={y} onClick={() => { setSelectedFilters({...selectedFilters, year: y}); window.dispatchEvent(new CustomEvent('year-filter', { detail: y })); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-50 hover:text-primary-600 transition-colors">{y}</button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {['/subjects', '/teachers', '/students'].some(path => location.pathname.startsWith(path)) && (
                        <div className="relative">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'dept' ? null : 'dept')}
                                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 min-w-[140px] justify-between ${activeDropdown === 'dept' ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-sm' : 'border-primary-100 bg-secondary-50 text-secondary-600 hover:bg-primary-50 hover:border-primary-300'}`}
                            >
                                <span>{selectedFilters.dept === 'all' ? 'Programme: All' : (departments.find(d => d._id === selectedFilters.dept)?.programme || departments.find(d => d._id === selectedFilters.dept)?.name || 'Programme')}</span>
                                <motion.div animate={{ rotate: activeDropdown === 'dept' ? 180 : 0 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {activeDropdown === 'dept' && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-2xl border border-secondary-100 overflow-hidden z-50 p-1.5"
                                        >
                                            <button onClick={() => { setSelectedFilters({...selectedFilters, dept: 'all'}); window.dispatchEvent(new CustomEvent('department-filter', { detail: 'all' })); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-50 hover:text-primary-600 transition-colors">All Programmes</button>
                                            {departments?.map(dep => (
                                                <button key={dep._id} onClick={() => { setSelectedFilters({...selectedFilters, dept: dep._id}); window.dispatchEvent(new CustomEvent('department-filter', { detail: dep._id })); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-50 hover:text-primary-600 transition-colors">{dep.programme || dep.name}</button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${getPageInfo().title}...`}
                            onChange={(e) => window.dispatchEvent(new CustomEvent('global-search', { detail: e.target.value }))}
                            className="w-48 lg:w-64 bg-secondary-50 border border-secondary-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm outline-none"
                        />
                    </div>

                    {user?.role === 'admin' && !['Dashboard', 'My Profile', 'Messages'].includes(getPageInfo().title) && (
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-add-modal'))}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 font-bold text-sm tracking-wide rounded-xl transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Add {getPageInfo().title.replace(/s$/, '').replace(/ies$/, 'y')}
                        </button>
                    )}
                </div>


                <div className="h-8 w-[1px] bg-secondary-200 mx-1 hidden sm:block"></div>

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
                                                <div className="space-y-3">
                                                    {Object.entries(unreadCounts).map(([senderId, data]) => data.count > 0 && (
                                                        <div
                                                            key={`msg-${senderId}`}
                                                            onClick={() => { navigate(`/chat/${senderId}`); setShowNotifications(false); }}
                                                            className="p-4 hover:bg-primary-50/40 rounded-2xl flex items-center gap-4 cursor-pointer transition-all group border border-transparent hover:border-primary-100/50"
                                                        >
                                                            <div className="w-11 h-11 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                                <MessageSquare size={18} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-sm font-black text-secondary-900 truncate uppercase tracking-tight">{getSenderName(senderId)}</p>
                                                                    {data.count > 0 && (
                                                                        <div className="relative flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ml-2">
                                                                            <div
                                                                                className="w-6 h-6 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-[1.5px] border-white relative z-10 leading-none bg-primary-600"
                                                                            >
                                                                                {data.count}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">Dispatched communication</p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {notifications.map((n) => (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all group ${n.isRead ? 'opacity-60 hover:bg-secondary-50' : 'bg-secondary-50/50 hover:bg-primary-50/40 outline outline-1 outline-primary-500/10'}`}
                                                        >
                                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform ${n.isRead ? 'bg-secondary-100 text-secondary-400' : 'bg-primary-100 text-primary-600'}`}>
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


                <div className="flex items-center gap-3 pl-2 border-l border-secondary-100 ml-1">
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-black text-primary-600 leading-tight uppercase tracking-tight">Hello, {user?.name?.split(' ')[0]}</p>
                        <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">{user?.role}</p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-10 h-10 rounded-xl bg-primary-100 border border-primary-200 shadow-sm overflow-hidden cursor-pointer flex items-center justify-center font-bold text-primary-700 uppercase"
                    >
                        {user?.avatar && !user.avatar.includes('default.png') ? (
                            <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
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
