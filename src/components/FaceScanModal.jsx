import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, X, CheckCircle, Loader2 } from 'lucide-react';

const FaceScanModal = ({ isOpen, onClose, onScanSuccess }) => {
    const videoRef = useRef();
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanSuccess, setScanSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setIsModelsLoaded(true);
            } catch (err) {
                setError('Failed to load AI models.');
                console.error(err);
            }
        };
        if (isOpen) {
            loadModels();
        }
    }, [isOpen]);

    useEffect(() => {
        let stream = null;
        const startVideo = async () => {
            if (isModelsLoaded && isOpen) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    setError('Camera access denied or unavailabe.');
                }
            }
        };
        startVideo();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isModelsLoaded, isOpen]);

    const handleScan = async () => {
        if (!videoRef.current || !isModelsLoaded) return;
        setScanning(true);
        setError(null);
        
        // Mobile Safari / Chrome require secure context for camera
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setError('Face scanning requires a secure connection (HTTPS). Please check your URL.');
            setScanning(false);
            return;
        }

        try {
            // Using more robust options for mobile
            const options = new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.5
            });

            const detection = await faceapi.detectSingleFace(
                videoRef.current,
                options
            ).withFaceLandmarks().withFaceDescriptor();

            if (detection) {
                setScanSuccess(true);
                setTimeout(() => {
                    onScanSuccess(Array.from(detection.descriptor));
                    handleClose();
                }, 1000);
            } else {
                setError('No face detected. Please ensure your face is clearly visible and well-lit.');
            }
        } catch (err) {
            console.error('Face scan error:', err);
            setError('Error during face scan. Please ensure camera permissions are granted.');
        } finally {
            setScanning(false);
        }
    };

    const handleClose = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setScanning(false);
        setScanSuccess(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                    <X size={18} />
                </button>
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2 text-secondary-900">Face Recognition</h3>
                    <p className="text-sm text-secondary-500 mb-6">Position your face in the center of the camera.</p>
                    
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-6 shadow-inner ring-4 ring-secondary-100 ring-offset-2">
                        {!isModelsLoaded ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary-900 text-white">
                                <Loader2 className="animate-spin mb-2" size={32} />
                                <span className="text-xs font-medium tracking-wide uppercase">Initializing AI...</span>
                            </div>
                        ) : (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                muted 
                                playsInline
                                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${scanSuccess ? 'opacity-50' : 'opacity-100'}`}
                            />
                        )}
                        
                        {scanSuccess && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-success-500 bg-success-500/10">
                                <CheckCircle size={64} className="mb-2 bg-white rounded-full p-1 shadow-lg" />
                                <span className="font-bold text-lg text-white drop-shadow-md">Scan Complete!</span>
                            </div>
                        )}
                    </div>
                    
                    {error && (
                        <p className="text-sm font-bold text-red-500 mb-4">{error}</p>
                    )}
                    
                    <button
                        onClick={handleScan}
                        disabled={!isModelsLoaded || scanning || scanSuccess}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                        {scanning ? (
                            <><Loader2 className="animate-spin" size={20} /> Scanning...</>
                        ) : (
                            <><Camera size={20} /> Capture Face</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceScanModal;
