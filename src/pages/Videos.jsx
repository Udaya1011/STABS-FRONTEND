import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Video,
    Play,
    Search,
    Filter,
    Upload,
    MoreVertical,
    Eye,
    Calendar,
    Bookmark,
    Trash2,
    Edit3,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getSubjects } from '../store/slices/subjectSlice';

const Videos = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { subjects } = useSelector((state) => state.subjects);

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [editData, setEditData] = useState({ id: '', title: '', description: '', subject: '', category: '' });

    const [newVideo, setNewVideo] = useState({
        title: '',
        description: '',
        subject: '',
        category: 'Lecture',
        videoFile: null
    });

    useEffect(() => {
        if (user?.token) {
            dispatch(getSubjects());
            fetchVideos();
        }

        // Global Navbar Events
        const handleSearch = (e) => setSearchQuery(e.detail);
        const handleAdd = () => setShowUploadModal(true);

        window.addEventListener('global-search', handleSearch);
        window.addEventListener('open-add-modal', handleAdd);

        return () => {
            window.removeEventListener('global-search', handleSearch);
            window.removeEventListener('open-add-modal', handleAdd);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, user?.token]);

    const fetchVideos = async () => {
        if (!user?.token) return;
        try {
            const { data } = await axios.get('/api/videos');
            setVideos(data);
        } catch (error) {
            toast.error('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!newVideo.videoFile) return toast.error('Please select a video file');
        if (!newVideo.subject) return toast.error('Please select a subject');

        const formData = new FormData();
        formData.append('title', newVideo.title);
        formData.append('description', newVideo.description);
        formData.append('subject', newVideo.subject);
        formData.append('category', newVideo.category);
        formData.append('video', newVideo.videoFile);

        setUploading(true);
        try {
            await axios.post('/api/videos', formData);
            toast.success('Resource published successfully');
            setShowUploadModal(false);
            setNewVideo({ title: '', description: '', subject: '', category: 'Lecture', videoFile: null });
            fetchVideos();
        } catch (error) {
            console.error('Publishing error:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Publishing failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this resource?')) return;
        try {
            await axios.delete(`/api/videos/${id}`);
            toast.success('Resource removed');
            fetchVideos();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleEdit = (video) => {
        setEditData({
            id: video._id,
            title: video.title,
            description: video.description || '',
            subject: video.subject?._id || video.subject,
            category: video.category || 'Lecture'
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/videos/${editData.id}`, editData);
            toast.success('Resource updated successfully');
            setShowEditModal(false);
            fetchVideos();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const filteredVideos = videos.filter(v =>
        (v.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-10">

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-white border border-secondary-100 h-72 rounded-3xl shadow-sm"></div>
                    ))
                ) : (
                    filteredVideos.map((video) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={video._id}
                            className="card-premium p-0 group overflow-hidden border-none shadow-premium hover:shadow-premium-hover relative"
                        >
                            {(user?.role === 'admin' || user?._id === (video.teacher?._id || video.teacher)) && (
                                <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(video)}
                                        className="p-2 bg-white/80 backdrop-blur-sm text-primary-600 rounded-lg hover:bg-white shadow-sm"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(video._id)}
                                        className="p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-lg hover:bg-white shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                            <div className="relative aspect-video bg-secondary-900 overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 bg-secondary-900/40 backdrop-blur-sm">
                                    <button
                                        onClick={() => setSelectedVideo(video)}
                                        className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-all duration-300"
                                    >
                                        <Play size={28} fill="currentColor" />
                                    </button>
                                </div>
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-secondary-900 text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-sm">
                                        {video.category || 'Lecture'}
                                    </span>
                                </div>
                                <div className="w-full h-full bg-gradient-to-br from-secondary-800 to-secondary-950 flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform duration-700">
                                    <Video size={48} className="text-secondary-700" />
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="font-bold text-secondary-900 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight text-sm mb-2">{video.title}</h3>
                                <p className="text-[10px] font-bold text-secondary-400 mb-6 uppercase tracking-widest bg-secondary-50 px-2 py-1 rounded w-fit transition-colors">{video.subject?.name || 'General Course'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-secondary-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-[10px] font-extrabold text-primary-600 border border-primary-100 shadow-sm transition-colors">
                                            {(video.teacher?.name || 'F').charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-secondary-700 truncate max-w-[100px] transition-colors">{video.teacher?.name || 'Faculty'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-secondary-400 text-[10px] font-bold uppercase tracking-tighter transition-colors">
                                        <span className="flex items-center gap-1"><Calendar size={12} className="text-accent-blue" /> {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Recent'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Empty State */}
            {!loading && filteredVideos.length === 0 && (
                <div className="py-24 text-center bg-white border border-secondary-100 rounded-3xl shadow-sm transition-colors">
                    <Video size={40} className="mx-auto text-secondary-200 mb-4 transition-colors" />
                    <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">No Resources Found</h3>
                    <p className="text-secondary-500 mt-2 font-medium transition-colors">Try searching for a different title or subject.</p>
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowUploadModal(false)}
                            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10 border border-secondary-100 transition-colors"
                        >
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between transition-colors">
                                <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">Publish Resource</h2>
                                <button onClick={() => setShowUploadModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 font-bold uppercase text-xs">✕</button>
                            </div>

                            <form onSubmit={handlePublish} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Title</label>
                                    <input
                                        required
                                        className="input-field"
                                        placeholder="Lecture Title"
                                        value={newVideo.title}
                                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Subject</label>
                                        <select
                                            required
                                            className="input-field"
                                            value={newVideo.subject}
                                            onChange={(e) => setNewVideo({ ...newVideo, subject: e.target.value })}
                                        >
                                            <option value="">Select Subject</option>
                                            {(subjects || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Category</label>
                                        <select
                                            className="input-field"
                                            value={newVideo.category}
                                            onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                                        >
                                            <option value="Lecture">Lecture</option>
                                            <option value="Tutorial">Tutorial</option>
                                            <option value="Lab">Lab Session</option>
                                            <option value="Seminar">Seminar</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        className="input-field min-h-[100px] py-3 text-sm"
                                        placeholder="Description..."
                                        value={newVideo.description}
                                        onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Video File</label>
                                    <div className="relative border-2 border-dashed border-secondary-200 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => setNewVideo({ ...newVideo, videoFile: e.target.files[0] })}
                                        />
                                        <Upload className="mx-auto text-secondary-300 mb-2" size={32} />
                                        <p className="text-xs font-bold text-secondary-500 truncate lowercase">
                                            {newVideo.videoFile ? newVideo.videoFile.name : 'Choose Video File'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    disabled={uploading}
                                    type="submit"
                                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 uppercase tracking-widest text-[10px] font-black"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : 'Publish Now'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-secondary-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-secondary-900 tracking-tight uppercase italic">Edit Resource</h2>
                                        <p className="text-secondary-500 text-xs font-bold uppercase tracking-widest mt-1">Update lecture metadata</p>
                                    </div>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="p-3 hover:bg-secondary-50 text-secondary-400 hover:text-secondary-900 rounded-2xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Lecture Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            placeholder="Atomic Structure & Periodic Table..."
                                            value={editData.title}
                                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Subject</label>
                                            <select
                                                required
                                                className="input-field appearance-none"
                                                value={editData.subject}
                                                onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects.map(sub => (
                                                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Category</label>
                                            <select
                                                className="input-field appearance-none"
                                                value={editData.category}
                                                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                            >
                                                <option value="Lecture">Lecture</option>
                                                <option value="Tutorial">Tutorial</option>
                                                <option value="Lab">Laboratory</option>
                                                <option value="Seminar">Seminar</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Rich Description</label>
                                        <textarea
                                            rows="3"
                                            className="input-field py-4 resize-none"
                                            placeholder="Overview of the core concepts covered in this lecture..."
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-primary w-full py-4 mt-4"
                                    >
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-950/90 backdrop-blur-xl p-4 md:p-10"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md border border-white/10 group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>

                            <div className="absolute top-6 left-6 z-50 pointer-events-none">
                                <h3 className="text-white font-bold text-xl drop-shadow-lg">{selectedVideo.title}</h3>
                                <p className="text-white/60 text-sm">{selectedVideo.subject?.name}</p>
                            </div>

                            <video
                                key={selectedVideo._id}
                                className="w-full h-full object-contain"
                                controls
                                autoPlay
                                playsInline
                            >
                                <source src={selectedVideo.url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Videos;
