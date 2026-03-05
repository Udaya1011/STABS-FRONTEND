import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m your EduConnect AI assistant. How can I help you today? I can help you book appointments, find teachers, or explain subject materials.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useSelector((state) => state.auth);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { data } = await axios.post('/api/ai/chat',
                {
                    message: input,
                    context: `User: ${user?.name}, Role: ${user?.role}`
                },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-700 transition-all hover:rotate-12 group"
                    >
                        <Bot size={32} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        className={`glass w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/40 ${isMinimized ? 'h-16' : 'h-[500px]'}`}
                    >
                        {/* Header */}
                        <div className="bg-primary-600 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">EduConnect AI</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-primary-100 font-medium">Assistant Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded">
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                    ? 'bg-primary-600 text-white rounded-br-none'
                                                    : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 italic text-slate-400 flex items-center gap-2 text-sm">
                                                <Loader2 size={14} className="animate-spin text-primary-500" />
                                                AI is thinking...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <form onSubmit={handleSubmit} className="relative">
                                        <input
                                            type="text"
                                            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-medium placeholder:text-slate-400"
                                            placeholder="Ask me anything..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="absolute right-1 top-1 w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-primary-700 disabled:opacity-50 transition-all"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                    <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                                        <Sparkles size={10} className="text-primary-400" />
                                        Powered by GPT-4 Turbo
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIChatbot;
