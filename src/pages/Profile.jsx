import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Mail, Phone, MapPin, Shield, Camera, Edit2, Check, X, ShieldCheck, GraduationCap, Loader2, Key, Eye, EyeOff, Search, Map } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateProfile, saveFaceDescriptor } from '../store/slices/authSlice';
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
        bio: user?.bio || (user?.role === 'admin' ? 'Strategic leader dedicated to academic excellence at RVS CAS.' : 'Dedicated academic professional committed to excellence in education and innovative research.')
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                username: user.username || '',
            }));
        }
    }, [user]);

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
                    'Content-Type': 'multipart/form-data',
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
                                className="absolute bottom-3 right-3 p-2.5 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                            >
                                <Camera size={18} />
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
                                {user?.role === 'admin' ? 'Admin of RVS CAS' : 'Senior Faculty • Department of Computer Engineering'}
                            </p>
                        </div>

                        <div className="md:mb-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-secondary-200 rounded-xl font-bold text-secondary-700 shadow-sm hover:border-primary-300 hover:text-primary-600 transition-all active:scale-95"
                            >
                                {isEditing ? <><X size={18} /> Cancel</> : <><Edit2 size={18} /> Update Profile</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="card-premium">
                        <h3 className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-8 border-b border-secondary-50 pb-2">Information Desk</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-secondary-600">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
                                    <Mail size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Email Address</p>
                                    <p className="text-sm font-bold text-secondary-800 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-secondary-600">
                                <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center flex-shrink-0 border border-success-100">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Phone number</p>
                                    <p className="text-sm font-bold text-secondary-800">{user?.phone || '+1 (555) 000-0000'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-secondary-600">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 border border-primary-100">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Office Location</p>
                                    <p className="text-sm font-bold text-secondary-800">{user?.address || 'Block A, Level 3, R-302'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium">
                        <h3 className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-8 border-b border-secondary-50 pb-2">Live Location Hub</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                <input
                                    type="text"
                                    className="input-field pl-10 text-xs"
                                    placeholder="Search location..."
                                />
                            </div>
                            <div className="aspect-square rounded-2xl bg-secondary-100 flex items-center justify-center border border-secondary-200 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <button className="px-4 py-2 bg-white rounded-lg text-[10px] font-bold text-primary-600 border border-primary-100 shadow-sm">Enable Live Tracking</button>
                                </div>
                                <Map className="text-secondary-300" size={48} />
                            </div>
                            <p className="text-[10px] text-secondary-400 font-medium text-center">Powered by GPS Core Tracking Systems</p>
                        </div>
                    </div>

                    <div className="card-premium">
                        <h3 className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-8 border-b border-secondary-50 pb-2">Security Hub</h3>
                        <div className="flex items-center gap-4 p-4 bg-secondary-50 rounded-2xl border border-secondary-100 group hover:bg-white hover:border-success-200 transition-all cursor-default mb-4">
                            <ShieldCheck className="text-success-500 group-hover:scale-110 transition-transform" size={28} />
                            <div>
                                <p className="text-sm font-bold text-secondary-800">Identity Verified</p>
                                <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-wider">Educational Access Approved</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsFaceModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-primary-200 rounded-xl font-bold text-primary-600 shadow-sm hover:border-primary-400 hover:text-primary-700 transition-all active:scale-95"
                        >
                            <Camera size={18} />
                            Set Up Face Lock
                        </button>
                    </div>
                </div>

                {/* Main Profile Info */}
                <div className="md:col-span-2 space-y-8">
                    {isEditing ? (
                        <>
                            {/* Professional Summary Edit Box */}
                            <div className="card-premium">
                                <h2 className="text-xl font-bold text-secondary-900 mb-8 flex items-center gap-2 transition-colors">
                                    <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
                                    Professional Summary
                                </h2>
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Username</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                placeholder="Unique username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Preferred Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Designation</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.designation}
                                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                placeholder="e.g. Professor"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Phone</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="Phone number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Address</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Office/Home address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                className="input-field"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Official email address"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Personal Bio</label>
                                        <textarea
                                            rows="4"
                                            className="input-field"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="btn-primary flex items-center gap-2 px-10 py-3.5 shadow-xl shadow-primary-500/20"
                                        >
                                            {isUpdating ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                                            Update Profile
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Separate Password Reset Option Box */}
                            <div className="card-premium">
                                <h2 className="text-xl font-bold text-secondary-900 mb-8 flex items-center gap-2 transition-colors">
                                    <span className="w-1.5 h-6 bg-accent-blue rounded-full"></span>
                                    Security: Password Reset Option
                                </h2>
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="px-6 py-2.5 bg-secondary-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 transition-all shadow-lg"
                                        >
                                            Verify & Reset Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="card-premium">
                            <h2 className="text-xl font-bold text-secondary-900 mb-8 flex items-center gap-2 transition-colors">
                                <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
                                Professional Summary
                            </h2>
                            <div className="space-y-8">
                                <p className="text-secondary-600 leading-relaxed font-medium text-lg italic transition-colors">
                                    "{formData.bio}"
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                    <div className="p-5 bg-secondary-50 border border-secondary-100 rounded-2xl group hover:bg-white hover:border-primary-200 transition-all">
                                        <p className="text-[10px] uppercase font-bold text-secondary-400 mb-3 tracking-widest">Primary Division</p>
                                        <div className="font-bold text-secondary-900 flex items-center gap-3 transition-colors">
                                            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <GraduationCap size={20} />
                                            </div>
                                            Computer Science Engineering
                                        </div>
                                    </div>
                                    <div className="p-5 bg-secondary-50 border border-secondary-100 rounded-2xl group hover:bg-white hover:border-primary-200 transition-all">
                                        <p className="text-[10px] uppercase font-bold text-secondary-400 mb-3 tracking-widest">Professional Standing</p>
                                        <div className="font-bold text-secondary-900 flex items-center gap-3 transition-colors">
                                            <div className="p-2 bg-secondary-200 text-secondary-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <Shield size={20} />
                                            </div>
                                            Member Since January 2024
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card-premium">
                        <h2 className="text-xl font-bold text-secondary-900 mb-8 flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-6 bg-accent-purple rounded-full"></span>
                            Faculty Achievements
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {['Top Mentor 2023', 'Tech Evangelist', 'Research Lead', 'Dean\'s Honor List', 'Publication Award'].map(badge => (
                                <span key={badge} className="px-5 py-2.5 bg-secondary-50 text-secondary-700 text-xs font-bold rounded-xl border border-secondary-100 hover:bg-white hover:border-primary-300 hover:text-primary-600 transition-all cursor-default uppercase tracking-wider">
                                    {badge}
                                </span>
                            ))}
                        </div>
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
