import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Main, Header } from '../components/ui';
import { Camera, ArrowLeft } from 'lucide-react';
import { parseReceiptImage } from '../services/gemini';
import { useSplit } from '../context/SplitContext';

export default function ScanPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { bulkAddItems } = useSplit(); // To save OCR results

    const [scanState, setScanState] = useState('camera'); // 'camera' | 'processing' | 'error'
    const [cameraError, setCameraError] = useState(null);
    const [ocrError, setOcrError] = useState(null);

    // Camera Refs
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // 1. Initialize Camera
    useEffect(() => {
        // If file passed from previous screen (e.g. Upload button), handle it immediately
        if (location.state?.file) {
            handleProcessImage(location.state.file);
            return;
        }

        let mounted = true;

        const startCamera = async () => {
            if (scanState !== 'camera') return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (mounted) {
                    streamRef.current = stream;
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    setCameraError(null);
                } else {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                console.error(err);
                if (mounted) setCameraError("Camera permission denied or not available.");
            }
        };

        if (scanState === 'camera') startCamera();

        return () => {
            mounted = false;
            // Always clean up stream on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [scanState, location.state]);

    // 2. Capture and Process Image
    const handleCapture = () => {
        if (!videoRef.current) return;

        // Capture frame from video stream to Canvas
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        // Convert to Blob to mimic a file selection
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "receipt-capture.jpg", { type: "image/jpeg" });
                handleProcessImage(file);
            }
        }, 'image/jpeg', 0.8);
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            handleProcessImage(e.target.files[0]);
        }
    };

    // Stop camera stream helper
    const stopCameraStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleProcessImage = async (file) => {
        // Stop camera stream when processing to free resources
        stopCameraStream();

        setScanState('processing');
        setOcrError(null);

        try {
            // Call Gemini OCR Service
            const parsedItems = await parseReceiptImage(file);

            if (parsedItems && parsedItems.length > 0) {
                // Bulk save to DB
                const success = await bulkAddItems(parsedItems);

                if (success) {
                    navigate('/assign');
                } else {
                    throw new Error("Failed to save items to database.");
                }
            } else {
                throw new Error("No items found on the receipt. Please try a clearer photo.");
            }

        } catch (error) {
            console.error(error);
            setOcrError(error.message || "Failed to scan receipt.");
            setScanState('error');
        }
    };

    // UI Handlers
    const handleBack = () => {
        if (scanState === 'processing') return; // Disable back during processing
        if (scanState === 'error') {
            setScanState('camera'); // Retry
        } else {
            navigate('/setup');
        }
    };

    const triggerNativeInput = () => document.getElementById('native-camera-input')?.click();

    return (
        <Layout>
            <Header
                title={scanState === 'processing' ? "Scanning..." : "Scan Receipt"}
                leftAction={
                    <button onClick={handleBack} className="p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                }
            />

            <Main className="flex flex-col items-center justify-center p-0 bg-black h-screen relative overflow-hidden">

                {/* State: Camera Preview */}
                {scanState === 'camera' && (
                    <>
                        <input
                            id="native-camera-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {cameraError ? (
                            <div className="text-white text-center p-6">
                                <p className="mb-4">{cameraError}</p>
                                <button
                                    onClick={triggerNativeInput}
                                    className="bg-brand-green px-6 py-2 rounded-full font-bold"
                                >
                                    Use Native Camera
                                </button>
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Overlay / Guidelines */}
                                <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none">
                                    <div className="w-full h-full border-2 border-white/50 rounded-lg relative">
                                        <div className="absolute top-0 right-0 p-2 bg-black/60 text-white text-xs rounded-bl-lg">
                                            Align receipt here
                                        </div>
                                    </div>
                                </div>
                                {/* Capture Button */}
                                <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                                    <button
                                        onClick={handleCapture}
                                        className="w-20 h-20 rounded-full border-4 border-white bg-white/20 active:bg-white/50"
                                    />
                                </div>
                                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                                    <button onClick={triggerNativeInput} className="text-white text-sm opacity-80 decoration-slice underline">
                                        Upload from Gallery
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* State: Processing */}
                {scanState === 'processing' && (
                    <div className="text-center text-white px-6">
                        <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Analyzing Receipt...</h2>
                        <p className="text-gray-400">Our AI is reading the items and prices.</p>
                    </div>
                )}

                {/* State: Error */}
                {scanState === 'error' && (
                    <div className="text-center text-white px-6">
                        <div className="text-5xl mb-4">😕</div>
                        <h2 className="text-xl font-bold mb-2">Oops!</h2>
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
                            <p className="text-sm text-red-200 leading-relaxed font-mono">{ocrError}</p>
                        </div>
                        <button
                            onClick={() => {
                                setOcrError(null);
                                setScanState('camera');
                            }}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </Main>
        </Layout>
    );
}
