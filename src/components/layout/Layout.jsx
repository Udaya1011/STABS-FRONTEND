import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatbot from '../ai/AIChatbot';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen overflow-hidden relative">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 w-full ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
                <Navbar setIsCollapsed={setIsCollapsed} isCollapsed={isCollapsed} />
                <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={window.location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            <AIChatbot />
        </div>
    );
};

export default Layout;
