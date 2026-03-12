import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { login, loginWithFace, reset } from '../store/slices/authSlice';
import { Mail, Lock, Loader2, ChevronRight, GraduationCap, Eye, EyeOff, Camera } from 'lucide-react';
import FaceScanModal from '../components/FaceScanModal';

const Login = () => {
    const [formData, setFormData] = useState({
        email: 'admin@educonnect.com',
        password: 'adminpassword123',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

    const { email, password } = formData;

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
            toast.success('Logged in successfully! Welcome back.');
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
        dispatch(login({ email, password }));
    };

    const handleFaceLogin = (descriptor) => {
        dispatch(loginWithFace({ faceDescriptor: descriptor }));
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-secondary-50 font-sans transition-colors duration-300">
            {/* Left Side: Branding */}
            <div className="hidden md:flex md:w-5/12 bg-primary-600 p-16 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-40 -mb-40 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-900/20">
                            <GraduationCap className="text-primary-600" size={30} />
                        </div>
                        <span className="text-3xl font-bold tracking-tight font-display text-white">RVS CAS</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-8 leading-[1.1] tracking-tight font-display">
                        Empowering the <br /> <span className="text-primary-100">Next Generation</span> <br /> of Scholars.
                    </h1>
                    <p className="text-primary-50 text-lg max-w-sm leading-relaxed font-medium opacity-90">
                        A unified platform designed for seamless academic management and collaboration.
                    </p>
                </div>

                <div className="relative z-10 flex gap-12">
                    <div>
                        <h4 className="font-bold text-3xl mb-1">5.2k</h4>
                        <p className="text-primary-100 text-sm font-medium opacity-80 uppercase tracking-widest">Students</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-3xl mb-1">240+</h4>
                        <p className="text-primary-100 text-sm font-medium opacity-80 uppercase tracking-widest">Faculty</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 md:p-16">
                <div
                    className="max-w-md w-full"
                >
                    <div className="mb-12">
                        <h2 className="text-4xl font-bold text-secondary-900 mb-3 tracking-tight">Welcome Back</h2>
                        <p className="text-secondary-500 font-medium tracking-wide">Enter your credentials to access your dashboard.</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider ml-1">Email or Username</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    name="email"
                                    type="text"
                                    className="input-field pl-12"
                                    placeholder="email or username"
                                    value={email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider ml-1">Password</label>
                                <a href="#" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">Forgot Password?</a>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    className="input-field pl-12 pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={onChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-primary-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 py-1">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-secondary-300 bg-white text-primary-600 focus:ring-primary-500 cursor-pointer" />
                            <label htmlFor="remember" className="text-sm font-bold text-secondary-500 cursor-pointer">Remember me</label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-xl shadow-primary-500/10 text-base"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    Log In to Portal <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center space-x-4">
                        <hr className="w-1/3 border-secondary-200" />
                        <span className="text-secondary-400 font-medium text-sm">OR</span>
                        <hr className="w-1/3 border-secondary-200" />
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => setIsFaceModalOpen(true)}
                            className="w-full py-4 flex items-center justify-center gap-3 bg-white border border-secondary-200 rounded-xl font-bold text-secondary-700 shadow-sm hover:border-primary-300 hover:text-primary-600 transition-all active:scale-95"
                        >
                            <Camera size={20} />
                            Login with Face Scannerrrr   
                        </button>
                    </div>
                </div>
            </div>
            
            <FaceScanModal 
                isOpen={isFaceModalOpen} 
                onClose={() => setIsFaceModalOpen(false)} 
                onScanSuccess={handleFaceLogin} 
            />
        </div>
    );
};

export default Login;
