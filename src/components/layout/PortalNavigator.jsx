import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    Building2, 
    BookOpen, 
    GraduationCap, 
    Calendar, 
    MessageSquare, 
    Video, 
    User,
    X,
    LayoutGrid,
    Search
} from 'lucide-react';

const PortalNavigator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', color: 'from-slate-700 to-slate-500' },
        { name: 'Teachers', icon: Users, path: '/teachers', color: 'from-slate-600 to-slate-400' },
        { name: 'Departments', icon: Building2, path: '/departments', color: 'from-slate-700 to-slate-500' },
        { name: 'Subjects', icon: BookOpen, path: '/subjects', color: 'from-slate-600 to-slate-400' },
        { name: 'Students', icon: GraduationCap, path: '/students', color: 'from-slate-700 to-slate-500' },
        { name: 'Appointments', icon: Calendar, path: '/appointments', color: 'from-slate-600 to-slate-400' },
        { name: 'Messages', icon: MessageSquare, path: '/chat', color: 'from-slate-700 to-slate-500' },
        { name: 'Resources', icon: Video, path: '/videos', color: 'from-slate-600 to-slate-400' },
        { name: 'Profile', icon: User, path: '/profile', color: 'from-slate-800 to-slate-600' },
    ];

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-10 left-10 z-[70]">
            <AnimatePresence>
                {isOpen && (
                    <div className="relative">
                        {menuItems.map((item, index) => {
                            // Professional semi-circle layout moving UP and RIGHT
                            const totalItems = menuItems.length;
                            const angle = (index / (totalItems - 1)) * (Math.PI / 1.1); // Spread over ~160 degrees
                            const radius = 140; // larger radius for attractiveness
                            const x = Math.sin(angle) * radius;
                            const y = Math.cos(angle) * radius;

                            return (
                                <motion.button
                                    key={item.name}
                                    initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: -45 }}
                                    animate={{ 
                                        scale: 1, 
                                        x: x, 
                                        y: -y,
                                        opacity: 1,
                                        rotate: 0
                                    }}
                                    exit={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: -45 }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 300, 
                                        damping: 25,
                                        delay: index * 0.04 
                                    }}
                                    onClick={() => handleNavigate(item.path)}
                                    className={`absolute bg-gradient-to-tr ${item.color} text-white p-3.5 rounded-2xl shadow-premium hover:scale-110 active:scale-95 transition-all group pointer-events-auto border border-white/20`}
                                >
                                    <item.icon size={22} strokeWidth={2.5} />
                                    
                                    {/* Tooltip */}
                                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-secondary-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                                        {item.name}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-marker-right -mr-1" style={{ borderRightColor: 'rgba(15, 23, 42, 0.9)' }}></div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1, rotate: isOpen ? 90 : 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className={`w-18 h-18 rounded-3xl flex items-center justify-center transition-all relative z-10 overflow-hidden ${isOpen ? 'bg-secondary-900 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                style={{ width: '4.5rem', height: '4.5rem' }}
            >
                {isOpen ? <X size={32} strokeWidth={2.5} /> : <LayoutGrid size={32} strokeWidth={2.5} />}
            </motion.button>
        </div>
    );
};

export default PortalNavigator;
