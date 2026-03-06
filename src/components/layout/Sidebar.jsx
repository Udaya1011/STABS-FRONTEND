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
    Building2
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
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'teacher', 'student'] },
        { name: 'Departments', icon: Building2, path: '/departments', roles: ['admin', 'student'] },
        { name: 'Subjects', icon: BookOpen, path: '/subjects', roles: ['admin', 'student'] },
        { name: 'Teachers', icon: Users, path: '/teachers', roles: ['admin', 'teacher', 'student'] },
        { name: 'Students', icon: GraduationCap, path: '/students', roles: ['admin', 'teacher'] },
        { name: 'Appointments', icon: Calendar, path: '/appointments', roles: ['admin', 'teacher', 'student'] },
        { name: 'Messages', icon: MessageSquare, path: '/chat', roles: ['admin', 'teacher', 'student'] },
        { name: 'Resources', icon: Video, path: '/videos', roles: ['admin', 'teacher', 'student'] },
        { name: 'My Profile', icon: User, path: '/profile', roles: ['admin', 'teacher', 'student'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${!isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsCollapsed(true)}
            />

            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '80px' : '280px' }}
                className={`fixed left-0 top-0 h-screen bg-white text-secondary-600 flex flex-col z-40 transition-transform lg:translate-x-0 duration-300 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} border-r border-secondary-100 shadow-sm`}
            >
                {/* Sidebar Header */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                            <GraduationCap className="text-white" size={24} />
                        </div>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-secondary-900 font-display font-bold text-xl tracking-tight"
                            >
                                RVS CAS
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white text-secondary-400 hover:text-primary-600 rounded-full hidden lg:flex items-center justify-center shadow-md border border-secondary-100 group z-50 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {filteredItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
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

                {/* User Footer */}
                <div className="p-4 border-t border-secondary-100 bg-secondary-50/50">
                    {!isCollapsed && (
                        <div className="mb-4 px-3 py-3 bg-white rounded-2xl flex items-center gap-3 border border-secondary-100 hover:border-primary-200 transition-colors cursor-pointer shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border border-primary-200 overflow-hidden">
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
                        className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 text-secondary-500 transition-all font-semibold group"
                    >
                        <LogOut size={22} className="group-hover:text-red-600" />
                        {!isCollapsed && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
