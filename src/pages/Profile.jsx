import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Mail, Phone, MapPin, Shield, Camera, Edit2, Check, X, ShieldCheck, GraduationCap, Loader2, Key, Eye, EyeOff, Search, Map, RefreshCcw, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateProfile, saveFaceDescriptor, logout, updateUserLocally } from '../store/slices/authSlice';
import axios from 'axios';
import getImageUrl from '../utils/imageUtils';
import FaceScanModal from '../components/FaceScanModal';

const Profile = () => {
    const { user, isLoading: isUpdating } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);



    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        username: user?.username || '',
        password: '',
        confirmPassword: '',
        designation: user?.designation || (user?.role === 'admin' ? 'Administrator' : 'Senior Faculty'),
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Background sync of profile data to ensure local state is up-to-date
        const syncProfile = async () => {
            try {
                const token = user?.token;
                if (!token) return;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/auth/profile', config);
                if (res.data) {
                    dispatch(updateUserLocally({ ...res.data, token: user?.token || res.data.token }));
                    console.log('Profile synced from server:', res.data);
                }
            } catch (err) {
                console.error('Profile sync failed:', err);
            }
        };
        syncProfile();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                username: user.username || '',
                designation: user.designation || (user.role === 'admin' ? 'Administrator' : 'Senior Faculty'),
            }));
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logout());
        toast.success('Logged out successfully');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        try {
            const updateData = { ...formData };
            if (!updateData.password) delete updateData.password;
            delete updateData.confirmPassword;

            await dispatch(updateProfile(updateData)).unwrap();
            setIsEditing(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error || 'Failed to update profile');
        }
    };



    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);

            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            console.log('Uploading direct image...');
            const response = await axios.post('/api/upload', uploadData, config);
            const avatarUrl = response.data.url;

            console.log('Updating profile with avatar:', avatarUrl);
            await dispatch(updateProfile({ avatar: avatarUrl })).unwrap();

            toast.success('Profile picture updated!');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error(error?.response?.data?.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetFaceLock = async (descriptor) => {
        try {
            await dispatch(saveFaceDescriptor({ faceDescriptor: descriptor })).unwrap();
            toast.success('Face lock set successfully!');
        } catch (error) {
            toast.error(error || 'Failed to set face lock');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />



            {/* Header section with cover and profile info */}
            <div className="card-premium p-0 overflow-hidden border-none shadow-premium">
                <div className="h-48 bg-gradient-to-r from-primary-600 to-primary-800 relative">
                    <div className="absolute top-0 right-0 w-64 h-full bg-white/10 -skew-x-[30deg] translate-x-32"></div>
                </div>

                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 relative z-10">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-3xl bg-white p-1.5 shadow-2xl transition-all">
                                <div className="w-full h-full rounded-2xl bg-secondary-50 border border-secondary-100 flex items-center justify-center text-5xl font-bold text-secondary-300 overflow-hidden">
                                    {isUploading ? (
                                        <Loader2 className="animate-spin text-primary-500" size={40} />
                                    ) : user?.avatar && !user.avatar.includes('default.png') ? (
                                        <img
                                            src={getImageUrl(user.avatar)}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.name?.charAt(0)
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={triggerFileInput}
                                disabled={isUploading}
                                className="absolute bottom-3 right-3 p-3 bg-primary-600 text-white rounded-2xl shadow-lg hover:bg-primary-700 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 flex items-center justify-center active:scale-95"
                                title="Update Image"
                            >
                                <Camera size={20} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-1 mb-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-bold text-secondary-900 tracking-tight transition-colors">{user?.name}</h1>
                                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-bold rounded-lg border border-primary-100 uppercase tracking-widest leading-none">
                                    {user?.role} Portal
                                </span>
                            </div>
                            <p className="text-secondary-500 font-bold flex items-center gap-2">
                                <Shield size={18} className="text-primary-500" />
                                 {user?.role === 'admin' ? 'Admin of RVS CAS' : 
                                  user?.role === 'student' ? `Student • Course: ${user?.department?.name || 'Department of Computer Engineering'}` :
                                  `${user?.designation || 'Senior Faculty'} • ${user?.department?.name || 'Department of Computer Engineering'}`}
                            </p>
                        </div>

                        <div className="md:mb-2 flex gap-3">
                            {user?.role === 'teacher' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const token = user.token;
                                            const config = { headers: { Authorization: `Bearer ${token}` } };
                                            toast.loading('Syncing free periods...', { id: 'sync' });
                                            const res = await axios.post('/api/appointments/sync-slots', {}, config);
                                            toast.success(res.data.message, { id: 'sync' });
                                        } catch (err) {
                                            toast.error(err.response?.data?.message || 'Sync failed', { id: 'sync' });
                                        }
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-secondary-900 text-white rounded-xl font-bold hover:bg-primary-600 transition-all active:scale-95 shadow-lg group"
                                >
                                    <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                    SYNC SLOTS
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Information Desk Card */}
                <div className="card-premium h-full flex flex-col justify-start">
                        <h3 className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-8 border-b border-secondary-50 pb-2">Information Desk</h3>
                        <div className="space-y-6">
                            {user?.role === 'student' && (
                                <div className="flex items-center gap-4 text-secondary-600">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
                                        <Shield size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Register Number</p>
                                        <p className="text-sm font-bold text-secondary-800">{user?.registerNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4 text-secondary-600">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
                                    <Mail size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Email Address</p>
                                    <p className="text-sm font-bold text-secondary-800 truncate">{user?.email}</p>
                                </div>
                            </div>
                            {user?.role === 'student' && (
                                <div className="flex items-center gap-4 text-secondary-600">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 border border-primary-100">
                                        <GraduationCap size={18} />
                                    </div>
                                     <div>
                                         <p className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Course Name</p>
                                         <p className="text-sm font-bold text-secondary-800">{user?.department?.name || 'N/A'}</p>
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Reset Card */}
                    <div className="card-premium h-full flex flex-col justify-start">
                        <h2 className="text-lg font-bold text-secondary-900 mb-6 flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-6 bg-accent-blue rounded-full"></span>
                            Security: Password Reset Access
                        </h2>
                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">New Secure Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input-field pr-10"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-primary-500"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-field"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-start mt-2">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-5 py-3 bg-secondary-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 transition-all shadow-lg flex items-center justify-center gap-2 w-full"
                                >
                                    <Key size={14} />
                                    Verify & Reset Password
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Biometric Security Card */}
                    <div className="card-premium h-full">
                        <h2 className="text-lg font-bold text-secondary-900 mb-6 flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
                            Biometric Security
                        </h2>
                        
                        <div className="flex flex-col items-center justify-center text-center py-2 px-4 space-y-5 h-full min-h-[220px]">
                            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center border border-primary-100 shadow-sm relative group">
                                <div className="absolute inset-0 bg-primary-400 opacity-20 rounded-full group-hover:animate-none"></div>
                                <Camera size={32} className="relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-md font-bold text-secondary-900 mb-1">Face Recognition Setup</h3>
                                <p className="text-xs text-secondary-500 px-2 leading-relaxed">Configure biometric access for a faster, more secure login experience without passwords.</p>
                            </div>
                            
                            <button 
                                onClick={() => setIsFaceModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-primary-200 rounded-xl font-bold text-primary-600 shadow-sm hover:border-primary-400 hover:text-primary-700 transition-all active:scale-95"
                            >
                                <Camera size={16} />
                                Initialize Face Scan
                            </button>
                        </div>
                    </div>
            </div>
            
            <FaceScanModal 
                isOpen={isFaceModalOpen} 
                onClose={() => setIsFaceModalOpen(false)} 
                onScanSuccess={handleSetFaceLock} 
            />
        </div>
    );
};

export default Profile;
