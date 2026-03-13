import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../store/slices/departmentSlice';
import { Building2, Plus, X, Save, Edit2, Trash2, Eye, Map, Hash, Info, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Departments = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [showModal, setShowModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [selectedDep, setSelectedDep] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDep, setCurrentDep] = useState({ name: '', code: '', programme: '', blocks: '', className: '', classrooms: '', description: '' });

    const dispatch = useDispatch();
    const { departments, isLoading } = useSelector((state) => state.departments);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getDepartments());

        const handleSearch = (e) => setSearchQuery(e.detail);
        const handleAdd = () => handleOpenModal();

        window.addEventListener('global-search', handleSearch);
        window.addEventListener('open-add-modal', handleAdd);

        return () => {
            window.removeEventListener('global-search', handleSearch);
            window.removeEventListener('open-add-modal', handleAdd);
        };
    }, [dispatch]);

    const handleOpenModal = (dep = null) => {
        if (dep) {
            setIsEditing(true);
            setCurrentDep({
                ...dep,
                blocks: Array.isArray(dep.blocks) ? dep.blocks.join(', ') : dep.blocks || '',
                classrooms: Array.isArray(dep.classrooms) ? dep.classrooms.join(', ') : dep.classrooms || '',
                className: Array.isArray(dep.className) ? dep.className.join(', ') : dep.className || ''
            });
        } else {
            setIsEditing(false);
            setCurrentDep({ name: '', code: '', programme: '', blocks: '', className: '', classrooms: '', description: '' });
        }
        setShowModal(true);
    };

    const handleView = (dep) => {
        setSelectedDep(dep);
        setShowSidePanel(true);
    };

    const filteredDeps = departments.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredDeps.length / itemsPerPage);
    const currentItems = filteredDeps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        
        const data = {
            ...currentDep,
            programme: currentDep.programme || '',
            blocks: typeof currentDep.blocks === 'string' ? currentDep.blocks.split(',').map(s => s.trim()).filter(s => s) : (currentDep.blocks || []),
            classrooms: typeof currentDep.classrooms === 'string' ? currentDep.classrooms.split(',').map(s => s.trim()).filter(s => s) : (currentDep.classrooms || []),
            className: typeof currentDep.className === 'string' ? currentDep.className.split(',').map(s => s.trim()).filter(s => s) : (currentDep.className || []),
        };

        if (isEditing) {
            dispatch(updateDepartment({ id: currentDep._id, departmentData: data }))
                .unwrap()
                .then(() => {
                    toast.success('Department updated!');
                    setShowModal(false);
                    dispatch(getDepartments()); // re-fetch fresh data
                })
                .catch(err => toast.error(err));
        } else {
            dispatch(createDepartment(data))
                .unwrap()
                .then(() => {
                    toast.success('Department created!');
                    setShowModal(false);
                    dispatch(getDepartments()); // re-fetch fresh data
                })
                .catch(err => toast.error(err));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this department?')) {
            dispatch(deleteDepartment(id))
                .unwrap()
                .then(() => toast.success('Department removed'))
                .catch(err => toast.error(err));
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 -mt-2">
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl shadow-primary-500/10 border border-primary-100 overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-primary-600 sticky top-0 z-10 border-b border-primary-700 shadow-sm">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest w-20 text-center">#</th>
                                <th className="py-4 px-8 text-xs font-bold text-white uppercase tracking-widest text-center">Course</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-28">Year</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-24">Block</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-24">Class</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-24">Room No</th>
                                <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-widest text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-300">
                            {isLoading && departments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Synchronizing directory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDeps.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-4 border border-secondary-100"><Building2 size={32} /></div>
                                            <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Access Controlled Hub</h3>
                                            <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium">No scholarship profiles or matriculation records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((dep, index) => (
                                    <tr key={dep._id} className="even:bg-primary-50/30 hover:bg-primary-50/40 transition-all group">
                                        <td className="py-4 px-6 text-center text-xs font-bold text-secondary-400 uppercase">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="py-4 px-8 text-center">
                                            <p className="text-sm font-bold text-primary-900 transition-colors group-hover:text-primary-600 uppercase tracking-tight">{dep.name}</p>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-[10px] font-black text-primary-600 tracking-wider uppercase bg-primary-50 px-3 py-1 rounded border border-primary-100 font-mono">
                                                {dep.programme || dep.code || '---'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-xs font-bold text-secondary-700 uppercase">
                                            {Array.isArray(dep.blocks) ? dep.blocks.join(', ') : dep.blocks || '---'}
                                        </td>
                                        <td className="py-4 px-6 text-center text-xs font-bold text-primary-700 uppercase">
                                            {Array.isArray(dep.className) ? (dep.className.length > 0 ? dep.className.join(', ') : '---') : (dep.className || '---')}
                                        </td>
                                        <td className="py-4 px-6 text-center text-xs font-bold text-secondary-700 uppercase">
                                            {Array.isArray(dep.classrooms) ? dep.classrooms.join(', ') : dep.classrooms || '---'}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleView(dep)} 
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm border border-emerald-100/50" 
                                                    title="View Details"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenModal(dep)} 
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm border border-blue-100/50" 
                                                            title="Edit Department"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(dep._id)} 
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm border border-red-100/50" 
                                                            title="Delete Department"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-8 py-4 border-t border-secondary-100 flex items-center justify-start gap-4 bg-white sticky bottom-0">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="text-secondary-300 hover:text-secondary-900 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs font-black text-secondary-900 uppercase tracking-widest leading-none">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <button 
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="text-secondary-300 hover:text-secondary-900 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Modal & Side Panel omitted for brevity but they are intact */}
            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-secondary-100"
                        >
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><Plus size={20} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Sync Division Info</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold text-xs uppercase">✕</button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                {/* Row 1: Department Name + Code */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Course Name (e.g. MCA, BCA)<span className="text-red-500">*</span></label>
                                        <input required className="input-field" placeholder="e.g. Computer Science" value={currentDep.name || ''} onChange={(e) => setCurrentDep({ ...currentDep, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Code<span className="text-red-500">*</span></label>
                                        <input required className="input-field uppercase" placeholder="e.g. CSE" value={currentDep.code || ''} onChange={(e) => setCurrentDep({ ...currentDep, code: e.target.value.toUpperCase() })} />
                                    </div>
                                </div>

                                {/* Row 2: Programme + Block */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Year (e.g. I, II, III)</label>
                                        <input className="input-field" placeholder="e.g. I, II, III" value={currentDep.programme || ''} onChange={(e) => setCurrentDep({ ...currentDep, programme: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Block</label>
                                        <input className="input-field" placeholder="e.g. A, B, C" value={currentDep.blocks || ''} onChange={(e) => setCurrentDep({ ...currentDep, blocks: e.target.value })} />
                                    </div>
                                </div>

                                {/* Row 3: Class + Room No */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Section (e.g. A, B)</label>
                                        <input className="input-field" placeholder="e.g. A, B, C" value={currentDep.className || ''} onChange={(e) => setCurrentDep({ ...currentDep, className: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Room No</label>
                                        <input className="input-field" placeholder="e.g. 101, 102" value={currentDep.classrooms || ''} onChange={(e) => setCurrentDep({ ...currentDep, classrooms: e.target.value })} />
                                    </div>
                                </div>

                                {/* Row 4: Description */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Description</label>
                                    <input className="input-field" placeholder="Brief details about this department..." value={currentDep.description || ''} onChange={(e) => setCurrentDep({ ...currentDep, description: e.target.value })} />
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={18} />
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Side Panel */}
            <AnimatePresence>
                {showSidePanel && selectedDep && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSidePanel(false)}
                            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white h-screen shadow-2xl overflow-y-auto"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tight">{selectedDep.name}</h3>
                                            <p className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">{selectedDep.code}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowSidePanel(false)} className="p-2 text-secondary-400 hover:text-secondary-900 rounded-xl transition-all">
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-secondary-50/50 rounded-[2rem] p-8 border border-secondary-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                                            <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Infrastructure Specs</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Blocks / Sectors</p>
                                                <p className="text-sm font-bold text-secondary-900">{selectedDep.blocks?.join(', ') || '---'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Learning Studios</p>
                                                <p className="text-sm font-bold text-secondary-900">{selectedDep.classrooms?.join(', ') || '---'}</p>
                                            </div>
                                            <div className="col-span-2 pt-2 space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Academic Year</p>
                                                <p className="text-sm font-bold text-secondary-900">{selectedDep.programme || '---'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {user?.role === 'admin' && (
                                    <div className="pt-8 border-t border-secondary-100">
                                        <button 
                                            onClick={() => { handleOpenModal(selectedDep); setShowSidePanel(false); }}
                                            className="w-full py-4 bg-secondary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <Edit2 size={16} /> Sync Division Data
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Departments;
