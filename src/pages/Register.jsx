import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { register, reset } from '../store/slices/authSlice';
import { Mail, Lock, User, Loader2, ChevronRight, GraduationCap, Sparkles, UserPlus } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        registerNumber: '',
    });

    const { name, email, password, confirmPassword, role, registerNumber } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }

        if (isSuccess || user) {
            navigate('/');
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name || e.target.id]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        dispatch(register({ name, email, password, role, registerNumber }));
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-secondary-50 flex items-center justify-center p-4 md:p-8">
            {/* Animated Mesh Background */}
            <div className="absolute inset-0 bg-mesh-gradient -z-10 opacity-70"></div>

            {/* Decorative Blobs */}
            <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-primary-200/20 rounded-full blur-3xl animate-pulse-soft"></div>
            <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-primary-300/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }}></div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* Branding Section */}
                <div className="hidden lg:flex lg:col-span-6 flex-col justify-center p-12 pr-16">
                    <div className="flex items-center gap-3 mb-8 animate-enter">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-premium border border-primary-50">
                            <GraduationCap className="text-primary-600" size={32} />
                        </div>
                        <span className="text-4xl font-extrabold tracking-tight font-display text-secondary-900">
                            Edu<span className="text-primary-600">Connect</span>
                        </span>
                    </div>

                    <h1 className="text-6xl font-black mb-6 leading-tight tracking-tighter text-secondary-950 font-display">
                        Join Our <br />
                        <span className="text-primary-600 relative inline-block">
                            Digital Campus
                            <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 100 12" preserveAspectRatio="none">
                                <path d="M0 10 C 20 2, 80 2, 100 10" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" className="opacity-20" />
                            </svg>
                        </span> <br />
                        Today.
                    </h1>

                    <p className="text-secondary-600 text-xl max-w-lg leading-relaxed font-medium mb-10 opacity-80">
                        Create your account to unlock personalized learning paths, collaborative tools, and expert-led resources.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                                <UserPlus size={20} />
                            </div>
                            <span className="text-sm font-bold text-secondary-600 uppercase tracking-widest">Easy Setup</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                                <Sparkles size={20} />
                            </div>
                            <span className="text-sm font-bold text-secondary-600 uppercase tracking-widest">Premium Tools</span>
                        </div>
                    </div>
                </div>

                {/* Register Card Section */}
                <div className="lg:col-span-6 flex justify-center">
                    <div className="w-full max-w-lg glass-premium rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden animate-enter">
                        <div className="relative z-10">
                            <div className="mb-8 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-wider mb-4 border border-primary-100">
                                    <Sparkles size={12} />
                                    <span>Sign Up</span>
                                </div>
                                <h2 className="text-4xl font-black text-secondary-900 mb-2 tracking-tight font-display">Create Account</h2>
                                <p className="text-secondary-500 font-medium">Be part of the future of education.</p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                                <User size={18} />
                                            </span>
                                            <input
                                                name="name"
                                                type="text"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 focus:bg-white text-secondary-900 transition-all placeholder:text-secondary-400 font-medium text-sm"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={onChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                                <Mail size={18} />
                                            </span>
                                            <input
                                                name="email"
                                                type="email"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 focus:bg-white text-secondary-900 transition-all placeholder:text-secondary-400 font-medium text-sm"
                                                placeholder="john@example.com"
                                                value={email}
                                                onChange={onChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Your Role</label>
                                        <select
                                            name="role"
                                            className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 focus:bg-white text-secondary-900 transition-all font-medium text-sm appearance-none cursor-pointer"
                                            value={role}
                                            onChange={onChange}
                                        >
                                            <option value="student">Student Scholar</option>
                                            <option value="teacher">Expert Faculty</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">{role === 'student' ? 'Registration No.' : 'Employee ID'}</label>
                                        <input
                                            name="registerNumber"
                                            type="text"
                                            className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 focus:bg-white text-secondary-900 transition-all placeholder:text-secondary-400 font-medium text-sm"
                                            placeholder={role === 'student' ? '2023CS101' : 'TEA-001'}
                                            value={registerNumber}
                                            onChange={onChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Password</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                                <Lock size={18} />
                                            </span>
                                            <input
                                                name="password"
                                                type="password"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 focus:bg-white text-secondary-900 transition-all placeholder:text-secondary-400 font-medium text-sm"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={onChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Confirm Info</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                                <Lock size={18} />
                                            </span>
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 focus:bg-white text-secondary-900 transition-all placeholder:text-secondary-400 font-medium text-sm"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={onChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full group bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(158,0,0,0.3)] transition-all active:scale-[0.98] mt-4"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            <span className="text-base uppercase tracking-widest">Create Profile</span>
                                            <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-sm font-semibold text-secondary-500">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-primary-600 font-black hover:text-primary-700 transition-colors relative inline-block">
                                        Sign In
                                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-100 rounded-full"></span>
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Credits */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex gap-8 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] opacity-60">
                <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Security</a>
                <span>© 2026 EduConnect</span>
            </div>
        </div>
    );
};

export default Register;

