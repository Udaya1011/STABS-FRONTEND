import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import WebRTCCall from '../common/WebRTCCall';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="flex min-h-screen relative overflow-x-hidden">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <motion.div
                animate={{
                    marginLeft: isCollapsed ? '0px' : '280px'
                }}
                transition={{
                    type: 'spring',
                    stiffness: 70,
                    damping: 26,
                    mass: 1.2
                }}
                className="flex-1 flex flex-col min-w-0 w-full"
            >
                <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                <main className="flex-1 p-6 md:px-8 md:py-8 w-full flex flex-col min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={window.location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex-1 flex flex-col h-full min-h-0"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </motion.div>
            <WebRTCCall />
        </div>
    );
};

export default Layout;
