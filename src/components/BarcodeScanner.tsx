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
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for success sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }
  }, []);

  // Initialize scanner
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const playSuccessSound = () => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleScan = useCallback((barcode: string) => {
    // Prevent duplicate scans
    if (barcode === lastScannedCode) {
      return;
    }
    
    setLastScannedCode(barcode);
    setScanStatus('success');
    setErrorMessage('');
    playSuccessSound();
    
    // Show success feedback briefly
    setTimeout(() => {
      onScan(barcode);
      setIsScanning(false);
      setScanStatus('idle');
      setLastScannedCode('');
    }, 1000);
  }, [onScan, lastScannedCode, isSoundEnabled]);

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

    if (!videoRef.current) {
      setErrorMessage('Video element not ready. Please try again.');
      return;
    }

    try {
      setScanStatus('scanning');
      setIsScanning(true);
      setErrorMessage('');
      
      console.log('Starting barcode scanner...');
      
      // Wait a moment for the video element to be properly mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configure Quagga for barcode detection
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            facingMode: "environment", // Use back camera
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true
      }, (err: any) => {
        if (err) {
          console.error('Quagga initialization failed:', err);
          setErrorMessage('Failed to initialize scanner. Please try again.');
          setIsScanning(false);
          setScanStatus('error');
          return;
        }
        
        console.log('Quagga initialized successfully');
        
        try {
          Quagga.start();
          console.log('Barcode scanner started successfully');
        } catch (startError: any) {
          console.error('Failed to start Quagga:', startError);
          setErrorMessage('Failed to start camera. Please try again.');
          setIsScanning(false);
          setScanStatus('error');
        }
      });

      // Listen for barcode detection
      Quagga.onDetected((result: any) => {
        try {
          const code = result.codeResult.code;
          console.log('Barcode detected:', code);
          handleScan(code);
        } catch (detectionError: any) {
          console.error('Error processing detected barcode:', detectionError);
        }
      });

      // Listen for processing
      Quagga.onProcessed((result: any) => {
        if (result) {
          console.log('Processing barcode...');
        }
      });

      // Listen for errors
      Quagga.onError((error: any) => {
        console.error('Quagga error:', error);
        if (error.name !== 'NotFoundError') {
          setErrorMessage('Scanner error. Please try again.');
          setIsScanning(false);
          setScanStatus('error');
        }
      });
      
    } catch (error: any) {
      console.error('Scanner failed to start', error);
      setErrorMessage('Failed to start scanner. Please try again.');
      setIsScanning(false);
      setScanStatus('error');
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner...');
    
    // Stop Quagga
    Quagga.stop();
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setScanStatus('idle');
    setErrorMessage('');
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
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Scanner Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Barcode Scanner</span>
              <button
                onClick={isScanning ? stopScanning : startScanning}
                disabled={!isInitialized}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                  isScanning 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : isInitialized
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'Stop' : 'Start'} Scanner</span>
              </button>
            </div>

            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {isScanning ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                    style={{ display: 'block' }}
                  />
                ) : (
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
                  
                  {/* Status indicator */}
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
  );
}; 