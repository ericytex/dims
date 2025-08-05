import React, { useState, useCallback, useRef, useEffect } from 'react';
// @ts-ignore
import Quagga from 'quagga';
import { Camera, X, Search, QrCode, Volume2, VolumeX, AlertCircle, Zap, Bug } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const BarcodeScannerComponent: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  isOpen
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'barcode' | 'qr'>('all');
  const [lastScannedResult, setLastScannedResult] = useState<{code: string, format: string} | null>(null);
  const [focusTime, setFocusTime] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectedCode, setLastDetectedCode] = useState('');
  const [detectionHistory, setDetectionHistory] = useState<Array<{code: string, confidence: number, timestamp: number}>>([]);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [isTorchEnabled, setIsTorchEnabled] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [sharpnessScore, setSharpnessScore] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [testMode, setTestMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanLineRef = useRef<NodeJS.Timeout | null>(null);
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const frameThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to validate barcode format
  const isValidBarcode = (code: string): boolean => {
    if (!code || code.length < 3) return false;
    
    // Remove any non-alphanumeric characters except hyphens
    const cleanCode = code.replace(/[^a-zA-Z0-9-]/g, '');
    
    // More flexible patterns - accept most alphanumeric combinations
    const validPatterns = [
      /^IDRC\d+$/,           // IDRC followed by numbers
      /^IM-\d+-\d+-[A-Z]+$/, // IM-23-034-KSJ pattern
      /^[A-Z]{2,}\d+$/,      // Letters followed by numbers
      /^[A-Z]+\d+[A-Z]+$/,   // Letters-numbers-letters
      /^\d+[A-Z]+\d+$/,      // Numbers-letters-numbers
      /^[A-Z0-9-]{3,}$/,     // General alphanumeric with hyphens
      /^[A-Z0-9]{3,}$/,      // Pure alphanumeric
      /^[0-9]{3,}$/,         // Pure numbers (3+ digits)
      /^[A-Z]{3,}$/          // Pure letters (3+ characters)
    ];
    
    // If no specific pattern matches, accept if it's at least 3 characters
    if (cleanCode.length >= 3) {
      return true;
    }
    
    return validPatterns.some(pattern => pattern.test(cleanCode));
  };

  // Helper function to check if barcode format is valid
  const isValidFormat = (code: string, format: string): boolean => {
    if (selectedFormat === 'all') return true;
    
    // Barcode formats
    if (selectedFormat === 'barcode') {
      const barcodeFormats = ['EAN_13', 'EAN_8', 'CODE_128', 'CODE_39', 'UPC_A', 'UPC_E'];
      return barcodeFormats.includes(format);
    }
    
    // QR format
    if (selectedFormat === 'qr') {
      const qrFormats = ['QR_CODE', 'DATAMATRIX'];
      return qrFormats.includes(format);
    }
    
    return true;
  };

  // Helper function to get barcode format
  const getBarcodeFormat = (code: string): string => {
    // Basic format detection based on length and patterns
    if (code.length === 13 && /^\d{13}$/.test(code)) return 'EAN_13';
    if (code.length === 8 && /^\d{8}$/.test(code)) return 'EAN_8';
    if (code.length === 12 && /^\d{12}$/.test(code)) return 'UPC_A';
    if (code.length === 8 && /^\d{8}$/.test(code)) return 'UPC_E';
    if (/^[A-Z0-9-]{3,}$/.test(code)) return 'CODE_128';
    if (/^[A-Z0-9]{3,}$/.test(code)) return 'CODE_39';
    if (code.length > 20) return 'QR_CODE';
    
    return 'CODE_128'; // Default
  };

  // Helper function to check for recent duplicates
  const isRecentDuplicate = (code: string): boolean => {
    const now = Date.now();
    const fiveSecondsAgo = now - 5000; // 5 seconds
    
    // Clean up old entries (older than 5 seconds)
    setRecentScans(prev => prev.filter(scan => {
      const [timestamp] = scan.split('|');
      return parseInt(timestamp) > fiveSecondsAgo;
    }));
    
    // Check if this code was recently scanned
    return recentScans.some(scan => {
      const [, scannedCode] = scan.split('|');
      return scannedCode === code;
    });
  };

  // Start focus timer when scanning begins
  const startFocusTimer = () => {
    setFocusTime(0);
    setIsFocused(false);
    
    focusTimerRef.current = setInterval(() => {
      setFocusTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 2) { // Reduced to 2 seconds for faster response
          setIsFocused(true);
          if (focusTimerRef.current) {
            clearInterval(focusTimerRef.current);
          }
        }
        return newTime;
      });
    }, 1000);
  };

  // Zoom in/out functionality using CSS transform
  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel * 1.2, 3)
      : Math.max(zoomLevel / 1.2, 0.5);
    
    setZoomLevel(newZoom);
    
    // Apply zoom using CSS transform on video element
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${newZoom})`;
      videoRef.current.style.transformOrigin = 'center center';
    }
    
    console.log('Zoom applied:', newZoom);
  };

  // Start scanning line animation
  const startScanLineAnimation = () => {
    setScanLinePosition(0);
    
    scanLineRef.current = setInterval(() => {
      setScanLinePosition(prev => {
        const newPosition = prev + 2;
        if (newPosition >= 100) {
          setScanLinePosition(0);
        }
        return newPosition;
      });
    }, 50); // Move line every 50ms for smooth animation
  };

  // Stop scanning line animation
  const stopScanLineAnimation = () => {
    if (scanLineRef.current) {
      clearInterval(scanLineRef.current);
      scanLineRef.current = null;
    }
  };

  // Pre-validation: Check for multiple detections
  const validateMultipleDetections = (code: string): boolean => {
    const now = Date.now();
    const recentDetections = detectionHistory.filter(
      detection => detection.code === code && now - detection.timestamp < 3000
    );
    
    const count = recentDetections.length;
    setDetectionCount(count);
    
    console.log(`Multiple detections check: ${count}/${debugMode ? '1' : '2'} for code: ${code}`);
    
    // In debug mode, require only 1 detection; otherwise require 2
    return debugMode ? count >= 1 : count >= 2;
  };

  // Post-processing: Validate barcode quality
  const validateBarcodeQuality = (result: any): boolean => {
    const code = result.codeResult.code;
    const confidence = result.codeResult.confidence || 0;
    
    console.log(`Quality check for: ${code}, Confidence: ${confidence}, Sharpness: ${sharpnessScore}, Debug: ${debugMode}`);
    
    // In debug mode, skip confidence check; otherwise use reduced threshold
    if (!debugMode && confidence < 0.3) {
      console.log('Confidence too low:', confidence);
      return false;
    }
    
    if (!isValidBarcode(code)) {
      console.log('Invalid barcode format:', code);
      return false;
    }
    
    if (isRecentDuplicate(code)) {
      console.log('Recent duplicate detected:', code);
      return false;
    }
    
    // More lenient length check
    if (code.length < 2 || code.length > 100) {
      console.log('Invalid barcode length:', code.length);
      return false;
    }
    
    // In debug mode, skip sharpness check; otherwise use reduced threshold
    if (!debugMode && sharpnessScore < 5) {
      console.log('Frame too blurry, sharpness:', sharpnessScore);
      return false;
    }
    
    console.log('Quality validation passed for:', code);
    return true;
  };

  // Enhanced detection handler with validation
  const handleDetection = (result: any) => {
    if (isPaused) return;
    
    const code = result.codeResult.code;
    const confidence = result.codeResult.confidence || 0;
    const timestamp = Date.now();
    
    console.log('Raw detection:', code, 'Confidence:', confidence);
    
    // Add to detection history
    setDetectionHistory(prev => [
      ...prev.filter(detection => timestamp - detection.timestamp < 5000), // Keep last 5 seconds
      { code, confidence, timestamp }
    ]);
    
    // Pre-validation: Check for multiple detections
    if (!validateMultipleDetections(code)) {
      console.log('Insufficient detections for validation:', code);
      return;
    }
    
    // Post-processing: Validate barcode quality
    if (!validateBarcodeQuality(result)) {
      console.log('Barcode quality validation failed:', code);
      return;
    }
    
    // If we reach here, the barcode is validated
    console.log('Barcode validated successfully:', code);
    handleScan(code, result.codeResult.format);
  };

  // Frame throttling: Process only 1 frame per 100ms (reduced from 300ms)
  const throttleFrameProcessing = (callback: () => void) => {
    const now = Date.now();
    if (now - lastFrameTime < 100) {
      return false; // Skip this frame
    }
    setLastFrameTime(now);
    return true; // Process this frame
  };

  // Sharpness check using canvas
  const checkSharpness = (): number => {
    if (!videoRef.current || !canvasRef.current) return 0;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 0;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data from center area
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const areaSize = Math.min(canvas.width, canvas.height) / 4;
    
    const imageData = ctx.getImageData(
      centerX - areaSize / 2,
      centerY - areaSize / 2,
      areaSize,
      areaSize
    );
    
    // Calculate sharpness using Laplacian variance
    let sharpness = 0;
    const data = imageData.data;
    
    for (let y = 1; y < areaSize - 1; y++) {
      for (let x = 1; x < areaSize - 1; x++) {
        const idx = (y * areaSize + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Simple edge detection
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const top = (data[(y - 1) * areaSize * 4 + x * 4] + data[(y - 1) * areaSize * 4 + x * 4 + 1] + data[(y - 1) * areaSize * 4 + x * 4 + 2]) / 3;
        const bottom = (data[(y + 1) * areaSize * 4 + x * 4] + data[(y + 1) * areaSize * 4 + x * 4 + 1] + data[(y + 1) * areaSize * 4 + x * 4 + 2]) / 3;
        
        const edge = Math.abs(gray - left) + Math.abs(gray - right) + Math.abs(gray - top) + Math.abs(gray - bottom);
        sharpness += edge;
      }
    }
    
    return sharpness / (areaSize * areaSize);
  };

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    
    try {
      const newTorchState = !isTorchEnabled;
      // Try to enable torch using a simpler approach
      await track.applyConstraints({
        advanced: [{ 
          // @ts-ignore - torch is experimental but supported in modern browsers
          torch: newTorchState 
        }]
      });
      setIsTorchEnabled(newTorchState);
      console.log('Torch toggled:', newTorchState);
    } catch (error) {
      console.log('Torch not supported on this device or failed to toggle');
    }
  };

  // Restart Quagga for autofocus
  const restartQuaggaForAutofocus = async () => {
    console.log('Restarting Quagga for autofocus...');
    
    try {
      await Quagga.stop();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      await Quagga.start();
      console.log('Quagga restarted successfully');
    } catch (error) {
      console.error('Failed to restart Quagga:', error);
    }
  };

  // Play success sound
  const playSuccessSound = () => {
    if (!isSoundEnabled || !audioRef.current) return;
    
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Failed to play sound:', error);
      });
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  };

  // Handle successful scan
  const handleScan = (code: string, format?: string) => {
    if (isPaused) return;
    
    console.log('Processing scan:', code, 'Format:', format);
    
    // Validate barcode format
    if (!isValidBarcode(code)) {
      console.log('Invalid barcode format:', code);
      return;
    }
    
    // Check for recent duplicates
    if (isRecentDuplicate(code)) {
      console.log('Recent duplicate detected:', code);
      return;
    }
    
    // Validate format if format filtering is enabled
    if (selectedFormat !== 'all' && format && !isValidFormat(code, format)) {
      console.log('Format validation failed:', code, format);
      return;
    }
    
    console.log('Barcode validated successfully:', code);
    
    // Play success sound
    playSuccessSound();
    
    // Set pause state immediately to prevent rapid re-scans
    setIsPaused(true);
    setLastScannedCode(code);
    setLastScannedResult({ code, format: format || 'unknown' });
    
    // Stop scanning immediately
    stopScanning();
    
    // Call the onScan callback
    onScan(code);
    
    // Optionally restart Quagga for autofocus after successful scan
    setTimeout(() => {
      restartQuaggaForAutofocus();
    }, 1000);
    
    // Reset pause after delay
    setTimeout(() => {
      setIsPaused(false);
    }, scanMode === 'auto' ? 5000 : 300000); // 5s for auto, 5min for manual
  };

  // Initialize scanner
  const startScanning = async () => {
    if (!videoRef.current) {
      console.log('Video element not ready. Please try again.');
      return;
    }

    setIsInitializing(true);
    setErrorMessage('');

    try {
      // Get camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Wait for video to be ready
      let attempts = 0;
      while (!videoRef.current?.videoWidth && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }

      if (!videoRef.current?.videoWidth) {
        throw new Error('Video element not ready after multiple attempts');
      }

      console.log('Video ready, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

      // If in test mode, just start the camera without Quagga
      if (testMode) {
        console.log('Test mode: Camera started without Quagga');
        setIsInitializing(false);
        setIsScanning(true);
        setScanStatus('scanning');
        
        // Set up a simple frame counter for test mode
        testIntervalRef.current = setInterval(() => {
          setFrameCount(prev => prev + 1);
          if (videoRef.current) {
            const sharpness = checkSharpness();
            setSharpnessScore(sharpness);
            console.log('Test mode frame:', frameCount + 1, 'Sharpness:', sharpness);
          }
        }, 100);
        
        return;
      }

      // Ensure video element is visible before initializing Quagga
      if (videoRef.current) {
        videoRef.current.style.display = 'block';
        console.log('Video element display set to block');
      }

      // Small delay to ensure video is properly displayed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configure Quagga with enhanced accuracy settings
      console.log('Starting Quagga initialization...');
      console.log('Video element for Quagga:', videoRef.current);
      console.log('Video dimensions for Quagga:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
      
      const initQuagga = (useWorkers: boolean = false) => { // Start with workers disabled
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment",
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 }
            },
            area: {
              top: "25%",    // Scan only center 50% of the frame
              right: "25%",
              left: "25%",
              bottom: "25%"
            }
          },
          locator: {
            patchSize: "small",
            halfSample: false
          },
          numOfWorkers: 0, // Disable workers completely to avoid browser compatibility issues
          frequency: 10,   // Reduced from 20 to 10 for better performance
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader"
            ]
          },
          locate: true
        }, (err: any) => {
          if (err) {
            console.error('Quagga initialization failed:', err);
            console.error('Quagga error details:', {
              name: err.name,
              message: err.message,
              stack: err.stack
            });
            
            setErrorMessage('Failed to initialize scanner. Please refresh and try again.');
            setIsInitializing(false);
            return;
          }

          console.log('Quagga initialized successfully without workers');
          setIsInitializing(false);
          setIsScanning(true);

          // Start focus timer
          startFocusTimer();

          // Set up detection with frame throttling
          Quagga.onDetected((result: any) => {
            console.log('Raw Quagga detection:', result);
            
            // Apply frame throttling
            if (!throttleFrameProcessing(() => {})) {
              console.log('Frame throttled, skipping detection');
              return; // Skip this frame
            }

            // Check sharpness before processing
            const sharpness = checkSharpness();
            setSharpnessScore(sharpness);
            setFrameCount(prev => prev + 1);
            
            console.log('Processing frame - Sharpness:', sharpness, 'Frame count:', frameCount + 1);
            
            // Only process if sharpness is above threshold (or in debug mode)
            if (!debugMode && sharpness < 5) {
              console.log('Frame too blurry, skipping detection');
              return;
            }

            // Process detection with enhanced validation
            handleDetection(result);
          });

          // Set up error handling
          Quagga.onError((error: any) => {
            console.error('Quagga error:', error);
            console.error('Quagga error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
            if (error.name === 'NotAllowedError') {
              setErrorMessage('Camera access denied. Please allow camera permissions.');
            } else if (error.name === 'NotFoundError') {
              setErrorMessage('No camera found on this device.');
            } else {
              setErrorMessage('Scanner error: ' + error.message);
            }
          });

          // Start Quagga
          console.log('Attempting to start Quagga...');
          try {
            Quagga.start();
            console.log('Quagga started successfully');
          } catch (startError) {
            console.error('Error starting Quagga:', startError);
            setErrorMessage('Failed to start Quagga scanner.');
          }
        });
      };
      
      // Start without workers
      initQuagga(false);

    } catch (error: any) {
      console.error('Failed to start scanner:', error);
      setErrorMessage('Failed to start scanner. Please try again.');
      setIsInitializing(false);
    }
  };

  const stopScanning = () => {
    console.log('Stopping barcode scanner...');
    
    // Clear test interval if in test mode
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    
    // Stop focus timer
    if (focusTimerRef.current) {
      clearInterval(focusTimerRef.current);
      focusTimerRef.current = null;
    }
    
    // Stop scanning line animation
    stopScanLineAnimation();
    
    // Reset focus states
    setFocusTime(0);
    setIsFocused(false);
    setScanLinePosition(0);
    
    // Stop Quagga (only if not in test mode)
    if (!testMode) {
      try {
        Quagga.stop();
        console.log('Quagga stopped successfully');
      } catch (error) {
        console.error('Error stopping Quagga:', error);
      }
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setScanStatus('idle');
    setErrorMessage('');
    console.log('Scanner stopped successfully');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  // Toggle test mode
  const toggleTestMode = () => {
    const newTestMode = !testMode;
    setTestMode(newTestMode);
    console.log('Test mode toggled:', newTestMode);
    
    // If enabling test mode and scanner is running, restart it
    if (newTestMode && isScanning) {
      stopScanning();
      setTimeout(() => {
        startScanning();
      }, 500);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Quagga.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Hidden audio element for success sound */}
      <audio
        ref={audioRef}
        preload="auto"
        src="/mixkit-correct-answer-tone-2870.wav"
      />
      
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Scan Barcode</h2>
          <div className="flex items-center space-x-2">
            {/* Debug Mode Toggle */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`p-2 rounded-lg transition-colors ${
                debugMode 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={debugMode ? 'Debug Mode On' : 'Debug Mode Off'}
            >
              <Bug className="w-4 h-4" />
            </button>
            {/* Test Mode Toggle */}
            <button
              onClick={toggleTestMode}
              className={`p-2 rounded-lg transition-colors ${
                testMode 
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={testMode ? 'Test Mode On (Camera Only)' : 'Test Mode Off'}
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg transition-colors ${
                isSoundEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isSoundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
            <div className="space-y-4">
              {/* Scan Mode Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Scan Mode:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setScanMode('auto')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'auto'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'manual'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {/* Format Selection */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Format:</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as 'all' | 'barcode' | 'qr')}
                  className="px-3 py-1 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Formats</option>
                  <option value="barcode">Barcodes Only</option>
                  <option value="qr">QR Codes Only</option>
                </select>
              </div>

              {/* Manual Scan Button */}
              {scanMode === 'manual' && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      if (!isScanning) {
                        startScanning();
                      }
                    }}
                    disabled={isScanning}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScanning ? 'Scanning...' : 'Start Scan'}
                  </button>
                </div>
              )}

              {/* Status Display */}
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  scanStatus === 'scanning' ? (isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') :
                  scanStatus === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {scanStatus === 'scanning' && !isPaused && <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>}
                  {scanStatus === 'scanning' && isPaused && <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>}
                  {scanStatus === 'error' && <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>}
                  {scanStatus === 'idle' && <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>}
                  {scanStatus === 'scanning' && (fallbackMode ? 'Camera Active (Manual Mode)' : (isPaused ? `Paused (${scanMode === 'auto' ? '5s' : '5min'})` : `${scanMode === 'auto' ? 'Auto Scanning' : 'Manual Mode'}`))}
                  {scanStatus === 'error' && 'Error'}
                  {scanStatus === 'idle' && 'Ready'}
                  {testMode && isScanning && 'Test Mode (Camera Only)'}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Last Scanned Result */}
              {lastScannedResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-medium">
                    Last Scanned: {lastScannedResult.code}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    Format: {lastScannedResult.format}
                  </p>
                </div>
              )}

              {/* Fallback Mode Notice */}
              {fallbackMode && isScanning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-700 text-sm">
                    <strong>Camera Mode:</strong> Barcode detection is not available. 
                    You can use the camera for visual reference and enter barcodes manually.
                  </p>
                </div>
              )}

              {/* Scanner Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Barcode Scanner</span>
                  <div className="flex items-center space-x-2">
                    {/* Zoom controls */}
                    {isScanning && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleZoom('out')}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          title="Zoom Out"
                        >
                          -
                        </button>
                        <span className="text-xs text-gray-500">Zoom: {zoomLevel.toFixed(1)}x</span>
                        <button
                          onClick={() => handleZoom('in')}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          title="Zoom In"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <button
                      onClick={isScanning ? stopScanning : startScanning}
                      disabled={!isInitialized || isInitializing}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                        isScanning 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : isInitialized && !isInitializing
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-400 text-white cursor-not-allowed'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        {isInitializing ? 'Initializing...' : isScanning ? 'Stop' : 'Start'} Scanner
                      </span>
                    </button>
                  </div>
                </div>

                <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
                      autoPlay
                      playsInline
                      muted
                      style={{ display: isScanning ? 'block' : 'none' }}
                      onLoadedMetadata={() => {
                        console.log('Video metadata loaded');
                        if (videoRef.current) {
                          console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                        }
                      }}
                      onCanPlay={() => {
                        console.log('Video can play');
                      }}
                    />
                    
                    {/* Hidden canvas for sharpness analysis */}
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                      style={{ display: 'none' }}
                    />
                    
                    {/* Scanning overlay */}
                    {isScanning && !fallbackMode && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Scanning line */}
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-red-500 animate-pulse"
                          style={{ 
                            top: `${scanLinePosition}%`,
                            transition: 'top 0.1s ease-out'
                          }}
                        />
                        
                        {/* Focus indicator */}
                        {isFocused && (
                          <div className="absolute inset-0 border-2 border-green-500 rounded-lg m-2 animate-pulse" />
                        )}
                        
                        {/* Center scanning area indicator */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-32 border-2 border-red-500 rounded-lg opacity-50" />
                        </div>
                      </div>
                    )}
                    
                    {/* Camera controls */}
                    {isScanning && (
                      <div className="absolute top-2 right-2 flex items-center space-x-2">
                        {/* Torch button */}
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-full transition-colors ${
                            isTorchEnabled 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75'
                          }`}
                          title={isTorchEnabled ? 'Torch On' : 'Torch Off'}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Status overlay */}
                    {!isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            {isInitializing ? 'Initializing camera...' : 'Click Start to begin scanning'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual Input Section */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-2">
                  <Search className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Manual Entry (Backup)</span>
                </div>
                <form onSubmit={handleManualSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Enter barcode manually..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!manualBarcode.trim()}
                    className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Search
                  </button>
                </form>
                
                {/* Manual Test Button */}
                <div className="mt-2">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        console.log('Manual test - Video element:', videoRef.current);
                        console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                        console.log('Video ready state:', videoRef.current.readyState);
                        console.log('Video paused:', videoRef.current.paused);
                        console.log('Video current time:', videoRef.current.currentTime);
                        
                        const sharpness = checkSharpness();
                        console.log('Manual sharpness check:', sharpness);
                        setSharpnessScore(sharpness);
                      } else {
                        console.log('Video element not found');
                      }
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                  >
                    Test Video Element
                  </button>
                </div>
              </div>

              {/* Accuracy Indicators */}
              {isScanning && !fallbackMode && (
                <div className="space-y-2">
                  {/* Debug Mode Indicator */}
                  {debugMode && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-red-700 text-xs font-medium">
                        🐛 Debug Mode: Lenient validation enabled
                      </p>
                    </div>
                  )}
                  
                  {/* Test Mode Indicator */}
                  {testMode && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="text-purple-700 text-xs font-medium">
                        📷 Test Mode: Camera only (no barcode detection)
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Detection Count:</span>
                    <span className={`font-medium ${detectionCount >= (debugMode ? 1 : 2) ? 'text-green-600' : 'text-yellow-600'}`}>
                      {detectionCount}/{debugMode ? '1' : '2'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Sharpness:</span>
                    <span className={`font-medium ${sharpnessScore > (debugMode ? 0 : 5) ? 'text-green-600' : 'text-red-600'}`}>
                      {sharpnessScore.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Frame Rate:</span>
                    <span className="font-medium text-blue-600">
                      {frameCount} fps
                    </span>
                  </div>
                  
                  {lastDetectedCode && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-blue-700 text-xs">
                        <strong>Last Detection:</strong> {lastDetectedCode}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-1">How to use:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Click "Start Scanner" to activate barcode detection</li>
                  <li>• Allow camera permissions when prompted</li>
                  <li>• Point camera at barcode (10-15cm distance)</li>
                  <li>• Hold steady for 1-2 seconds</li>
                  <li>• You'll hear a sound when barcode is detected</li>
                  <li>• Or use manual entry as backup</li>
                  <li>• Supports: Code128, EAN, Code39, UPC, Codabar</li>
                </ul>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}; 