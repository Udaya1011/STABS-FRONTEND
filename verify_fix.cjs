const fs = require('fs');

const targetFile = 'e:/SEM-4/STABS-FRONTEND/src/pages/Departments.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

const startTag = '{/* Modal */}';
const endTag = '{/* View Details Modal */}';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if(startIndex === -1 || endIndex === -1) {
    console.log("Could not find tags.");
    process.exit(1);
}

const newModal = `{/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl overflow-hidden relative z-10 flex h-[620px]"
                        >
                            {/* Left Sidebar - Exact Maroon Layout from Image */}
                            <div 
                                className="w-[30%] shrink-0 flex flex-col justify-between p-8 text-white relative overflow-hidden" 
                                style={{ backgroundColor: '#800000' }}
                            >
                                <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-16 px-2">
                                        <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                            <Building2 size={24} className="text-white" />
                                        </div>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-white leading-[1.1]">
                                            RVS<br/>CAS
                                        </h2>
                                    </div>
                                    
                                    <div className="flex flex-col gap-10 relative px-2">
                                        <div className="absolute left-[20px] top-6 bottom-6 w-px bg-white/10"></div>
                                        
                                        <div className={\`flex items-center gap-4 transition-all duration-300 \${step === 1 ? 'opacity-100' : 'opacity-40'}\`}>
                                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors \${step >= 1 ? 'bg-white text-[#800000] border-white' : 'bg-transparent text-white border-white/40'}\`}>
                                                <Edit2 size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none mb-1">Step 01</p>
                                                <p className="font-bold text-sm tracking-wide">Details</p>
                                            </div>
                                        </div>
                                        
                                        <div className={\`flex items-center gap-4 transition-all duration-300 \${step === 2 ? 'opacity-100' : 'opacity-40'}\`}>
                                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors \${step >= 2 ? 'bg-white text-[#800000] border-white' : 'bg-transparent text-white border-white/40'}\`}>
                                                <Layout size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none mb-1">Step 02</p>
                                                <p className="font-bold text-sm tracking-wide">Blocks</p>
                                            </div>
                                        </div>
                                        
                                        <div className={\`flex items-center gap-4 transition-all duration-300 \${step === 3 ? 'opacity-100' : 'opacity-40'}\`}>
                                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors \${step >= 3 ? 'bg-white text-[#800000] border-white' : 'bg-transparent text-white border-white/40'}\`}>
                                                <Hash size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none mb-1">Step 03</p>
                                                <p className="font-bold text-sm tracking-wide">Rooms</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 opacity-40">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/40 text-white">
                                                <Save size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none mb-1">Step 04</p>
                                                <p className="font-bold text-sm tracking-wide">Finish</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="relative z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors py-3 px-5 border border-white/10 rounded-xl hover:bg-white/5 self-start"
                                >
                                    <X size={14} />
                                    Discard Entry
                                </button>
                            </div>
                            
                            {/* Right Content Area */}
                            <div className="flex-1 bg-white flex flex-col h-full rounded-r-[24px]">
                                <div className="px-12 py-8 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-secondary-900 flex items-center gap-2">
                                            {step === 1 ? 'Details' : step === 2 ? 'Blocks' : 'Rooms'} <span style={{ color: '#800000' }}>Module</span>
                                        </h3>
                                        <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest mt-1">
                                            NEW ACADEMIC DIVISION IDENTIFICATION PHASE— PHASE {step} OF 3
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-secondary-300 hover:text-secondary-600 transition-colors p-2"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="px-12 mb-4">
                                    <div className="h-px w-full bg-secondary-100"></div>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSave(); else handleNext(); }} className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-1 overflow-y-auto px-12 py-6">
                                        <AnimatePresence mode="wait">
                                            {step === 1 ? (
                                                <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-extrabold text-secondary-500 uppercase tracking-widest flex items-center gap-1">Department Name <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <Edit2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-300" />
                                                                <input className="w-full border border-secondary-200 rounded-xl pl-12 pr-5 py-3.5 text-sm font-medium text-secondary-900 outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/20 transition-all placeholder:text-secondary-300" placeholder="e.g. John" value={currentDep.name} onChange={(e) => setCurrentDep({ ...currentDep, name: e.target.value })} autoFocus />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-extrabold text-secondary-500 uppercase tracking-widest flex items-center gap-1">Department Code <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-300" />
                                                                <input className="w-full border border-secondary-200 rounded-xl pl-12 pr-5 py-3.5 text-sm font-medium text-secondary-900 outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/20 transition-all placeholder:text-secondary-300" placeholder="e.g. Doe" value={currentDep.code} onChange={(e) => setCurrentDep({ ...currentDep, code: e.target.value.toUpperCase() })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-extrabold text-secondary-500 uppercase tracking-widest">Description</label>
                                                        <textarea rows="4" className="w-full border border-secondary-200 rounded-xl px-5 py-3.5 text-sm font-medium text-secondary-900 outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/20 transition-all resize-none placeholder:text-secondary-300" placeholder="Briefly describe the department's focus..." value={currentDep.description} onChange={(e) => setCurrentDep({ ...currentDep, description: e.target.value })}></textarea>
                                                    </div>
                                                </motion.div>
                                            ) : step === 2 ? (
                                                <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-extrabold text-secondary-500 uppercase tracking-widest">Blocks (comma separated) <span className="text-red-500">*</span></label>
                                                        <div className="relative">
                                                            <Layout size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-300" />
                                                            <input className="w-full border border-secondary-200 rounded-xl pl-12 pr-5 py-3.5 text-sm font-medium text-secondary-900 outline-none focus:border-[#800000] transition-all" placeholder="e.g. A-Block, B-Block" value={currentDep.blocks} onChange={(e) => setCurrentDep({ ...currentDep, blocks: e.target.value })} autoFocus />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-extrabold text-secondary-500 uppercase tracking-widest">Rooms (comma separated) <span className="text-red-500">*</span></label>
                                                        <div className="relative">
                                                            <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-300" />
                                                            <input className="w-full border border-secondary-200 rounded-xl pl-12 pr-5 py-3.5 text-sm font-medium text-secondary-900 outline-none focus:border-[#800000] transition-all" placeholder="e.g. 101, 102" value={currentDep.classrooms} onChange={(e) => setCurrentDep({ ...currentDep, classrooms: e.target.value })} autoFocus />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="px-12 py-8 flex justify-end items-center gap-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest hover:text-secondary-600 transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                        
                                        <div className="flex gap-4">
                                            {step > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(step - 1)}
                                                    className="px-6 py-2.5 rounded-full border border-secondary-200 text-secondary-700 font-bold hover:bg-secondary-50 transition-all text-xs uppercase tracking-widest"
                                                >
                                                    Back
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => { if (step === 3) handleSave(e); else handleNext(); }}
                                                className="px-8 py-2.5 rounded-full text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95"
                                                style={{ backgroundColor: '#1e77b5' }}
                                            >
                                                {step === 3 ? (isEditing ? 'Sync Changes' : 'Finish') : 'Next Phase'}
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
`;

content = content.substring(0, startIndex) + newModal + content.substring(endIndex);
fs.writeFileSync(targetFile, content);
console.log('Update successful');
