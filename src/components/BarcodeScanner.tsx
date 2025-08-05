import React, { useState, useCallback, useRef, useEffect } from 'react';
// @ts-ignore
import Quagga from 'quagga';
import { Camera, X, Search, QrCode, Volume2, VolumeX, AlertCircle } from 'lucide-react';

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
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanLineRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initialize scanner
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Ensure video element is ready when scanning starts
  useEffect(() => {
    if (isScanning && videoRef.current) {
      console.log('Video element is ready for scanning');
    }
  }, [isScanning]);

  // Initialize audio for success sound
  useEffect(() => {
    const audio = new Audio('/mixkit-correct-answer-tone-2870.wav');
    audio.volume = 0.5;
    audio.preload = 'auto'; // Preload the audio for immediate playback
    audioRef.current = audio;
  }, []);

  const playSuccessSound = () => {
    if (isSoundEnabled && audioRef.current) {
      console.log('Playing success sound...');
      try {
        // Reset audio to start and play immediately
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error('Failed to play success sound:', error);
        });
        console.log('Success sound played successfully');
      } catch (error) {
        console.error('Failed to play success sound:', error);
      }
    } else {
      console.log('Success sound disabled');
    }
  };

  const handleScan = (barcode: string, format?: string) => {
    // Prevent duplicate scans with better logic
    if (barcode === lastScannedCode || isPaused) {
      console.log('Ignoring duplicate scan or scanner is paused:', barcode);
      return;
    }
    
    console.log('Barcode detected:', barcode);
    
    // Immediately pause scanning to prevent rapid beeping
    setIsPaused(true);
    
    // Play success sound
    playSuccessSound();
    
    // Set the scanned code and format
    const detectedFormat = format || getBarcodeFormat(barcode);
    setLastScannedCode(barcode);
    setLastScannedResult({ code: barcode, format: detectedFormat });
    
    // Stop scanning immediately after successful scan
    console.log('Stopping scanner after successful scan');
    stopScanning();
    
    // Call the onScan callback
    if (onScan) {
      onScan(barcode);
    }
  };

  const handleError = useCallback((error: any) => {
    console.error('Camera error:', error);
    
    if (error.name === 'NotAllowedError') {
      setErrorMessage('Camera access denied. Please allow camera permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      setErrorMessage('No camera found on this device.');
    } else if (error.name === 'NotSupportedError') {
      setErrorMessage('Camera not supported in this browser. Try using Chrome or Safari.');
    } else if (error.name === 'NotReadableError') {
      setErrorMessage('Camera is already in use by another application.');
    } else {
      setErrorMessage(`Camera error: ${error.message || error.name}`);
    }
    
    setScanStatus('error');
    setIsScanning(false);
    setTimeout(() => {
      setScanStatus('idle');
      setErrorMessage('');
    }, 5000);
  }, []);

  const startScanning = async () => {
    if (!isInitialized) {
      setErrorMessage('Scanner not initialized.');
      return;
    }

    try {
      setIsInitializing(true);
      setScanStatus('scanning');
      setIsScanning(true);
      setErrorMessage('');
      
      console.log('Starting barcode scanner...');
      
      // Wait for video element to be properly mounted and ready
      let attempts = 0;
      while (!videoRef.current && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
        console.log(`Waiting for video element... attempt ${attempts}`);
      }
      
      if (!videoRef.current) {
        setErrorMessage('Video element not ready. Please try again.');
        setIsScanning(false);
        setScanStatus('error');
        setIsInitializing(false);
        return;
      }
      
      console.log('Video element ready, getting camera stream...');
      
      // Get camera stream with zoom capabilities
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Set the stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          
          console.log('Camera stream ready, initializing Quagga...');
        }
      } catch (error) {
        console.error('Failed to get camera stream:', error);
        setErrorMessage('Failed to access camera. Please check permissions.');
        setIsScanning(false);
        setScanStatus('error');
        setIsInitializing(false);
        return;
      }
      
      // Initialize Quagga with optimized settings for faster detection
      try {
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "environment"
            },
            area: { // Smaller scanning area for better focus
              top: "25%",
              right: "15%",
              left: "15%",
              bottom: "25%"
            }
          },
          locator: {
            patchSize: "small", // Smaller patches for faster processing
            halfSample: false // Disable half sample for speed
          },
          numOfWorkers: 2, // Reduce workers for faster startup
          frequency: 20, // Increase frequency for more responsive scanning
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
        });
        
        console.log('Quagga initialized successfully');
        
        // Start Quagga
        await Quagga.start();
        console.log('Quagga started successfully');
        
        // Start focus timer and scanning line after successful initialization
        startFocusTimer();
        startScanLineAnimation();
        
        // Set up detection handler with immediate processing
        Quagga.onDetected((result: any) => {
          if (isPaused) return;
          
          const code = result.codeResult.code;
          const format = result.codeResult.format;
          
          console.log('Barcode detected:', code, 'Format:', format);
          
          // Process scan immediately without focus delay for faster response
          handleScan(code, format);
        });
        
        setScanStatus('scanning');
        setIsInitializing(false);
        console.log('Scanner started successfully');
        
      } catch (error) {
        console.error('Failed to initialize Quagga:', error);
        setErrorMessage('Failed to initialize scanner. Please refresh and try again.');
        setIsScanning(false);
        setScanStatus('error');
        setIsInitializing(false);
      }
      
    } catch (error) {
      console.error('Error starting scanner:', error);
      setErrorMessage('Failed to start scanner. Please try again.');
      setIsScanning(false);
      setScanStatus('error');
      setIsInitializing(false);
    }
  };

  const stopScanning = () => {
    console.log('Stopping barcode scanner...');
    
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
    
    // Stop Quagga
    try {
      Quagga.stop();
      console.log('Quagga stopped successfully');
    } catch (error) {
      console.error('Error stopping Quagga:', error);
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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Scan Barcode</h2>
          <div className="flex items-center space-x-2">
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
                    />
                    {!isScanning && (
                      <div className="text-center text-gray-500">
                        <QrCode className="w-12 h-12 mx-auto mb-2" />
                        <p>{isInitialized ? 'Click "Start Scanner" to begin' : 'Initializing...'}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
                      
                      {/* Scanning line */}
                      <div 
                        className="absolute left-0 right-0 h-0.5 bg-red-500 animate-pulse"
                        style={{ 
                          top: `${scanLinePosition}%`,
                          transition: 'top 0.05s linear'
                        }}
                      ></div>
                      
                      {/* Focus indicator */}
                      <div className="absolute top-2 left-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          scanStatus === 'scanning' ? 'bg-blue-100 text-blue-800' :
                          scanStatus === 'success' ? 'bg-green-100 text-green-800' :
                          scanStatus === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {scanStatus === 'scanning' ? 'Scanning...' :
                           scanStatus === 'success' ? 'Detected!' :
                           scanStatus === 'error' ? 'Error' : 'Ready'}
                        </div>
                      </div>
                      
                      {/* Focus status */}
                      <div className="absolute top-2 right-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          isFocused ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isFocused ? 'Focused' : `Focusing... (${3 - focusTime}s)`}
                        </div>
                      </div>
                      
                      {/* Scanning area indicator */}
                      <div className="absolute inset-0 border-2 border-dashed border-red-400 opacity-50 m-4"></div>
                    </div>
                  )}
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
              </div>

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