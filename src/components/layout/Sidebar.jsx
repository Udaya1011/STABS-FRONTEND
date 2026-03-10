import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    MessageSquare,
    Video,
    User,
    Settings,
    LogOut,
    ChevronRight,
    ChevronLeft,
    GraduationCap,
    BookOpen,
    Building2,
    ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        setIsCollapsed(true);
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'teacher', 'student'] },
        { name: 'Departments', icon: Building2, path: '/departments', roles: ['admin', 'student'] },
        { name: 'Subjects', icon: BookOpen, path: '/subjects', roles: ['admin', 'student'] },
        { name: 'Teachers', icon: Users, path: '/teachers', roles: ['admin', 'teacher', 'student'] },
        { name: 'Students', icon: GraduationCap, path: '/students', roles: ['admin', 'teacher'] },
        { name: 'Appointments', icon: Calendar, path: '/appointments', roles: ['admin', 'teacher', 'student', 'staff'] },
        { name: 'Attendance', icon: ClipboardList, path: '/attendance', roles: ['admin', 'teacher', 'staff', 'student'] },
        { name: 'Messages', icon: MessageSquare, path: '/chat', roles: ['admin', 'teacher', 'student', 'staff'] },
        { name: 'Resources', icon: Video, path: '/videos', roles: ['admin', 'teacher', 'student', 'staff'] },
        { name: 'My Profile', icon: User, path: '/profile', roles: ['admin', 'teacher', 'student', 'staff'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${!isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsCollapsed(true)}
            />

            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '80px' : '20vw' }}
                className={`fixed left-0 top-0 h-screen bg-white text-secondary-600 flex flex-col z-40 transition-transform md:translate-x-0 duration-300 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} border-r border-secondary-100`}
            >
                {/* Sidebar Header - Highlighted */}
                <div className="p-6 flex items-center justify-between bg-primary-600 border-b border-primary-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                            <GraduationCap className="text-white" size={24} />
                        </div>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-white font-display font-black text-xl tracking-tight"
                            >
                                RVSCAS
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Toggle Arrow Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white text-secondary-400 hover:text-primary-600 rounded-full hidden md:flex items-center justify-center border border-secondary-100 group z-50 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>



                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {filteredItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsCollapsed(true)}
                            className={({ isActive }) => `
              flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative
              ${isActive
                                    ? 'bg-primary-50 text-primary-600 font-bold'
                                    : 'hover:bg-secondary-50 hover:text-secondary-900'}
            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={22} className={isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600 transition-colors'} />
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="truncate text-sm"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                    {/* Active Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute left-[-1rem] w-1.5 h-6 bg-primary-500 rounded-r-full"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* QUICK ACTION BUTTON */}
                <div className="px-4 mb-2">
                    <button
                        onClick={() => navigate('/attendance')}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] group shadow-sm border border-primary-100 hover:border-primary-700 hover:shadow-lg hover:shadow-primary-600/20`}
                    >
                        <ClipboardList size={22} className="group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span>Open Attendance</span>}
                    </button>
                </div>

                <div className="p-4 border-t border-secondary-100 bg-white">
                    {!isCollapsed && (
                        <div className="mb-4 px-3 py-3 bg-secondary-50/50 rounded-2xl flex items-center gap-3 border border-secondary-100 hover:border-primary-200 hover:bg-white transition-all cursor-pointer shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg border border-primary-700 overflow-hidden shadow-sm">
                                {user?.avatar && !user.avatar.includes('default.png') ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0)
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-secondary-900 font-bold text-sm truncate">{user?.name}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary-600">{user?.role}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all font-bold group shadow-md hover:shadow-lg border border-primary-700"
                    >
                        <LogOut size={20} className="text-white group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="text-sm tracking-wide">Logout Session</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
