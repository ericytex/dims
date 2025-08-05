import React, { useState, useCallback } from 'react';
import { BarcodeScanner } from 'react-barcode-scanner';
import { Camera, X, Search, QrCode } from 'lucide-react';

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

  const handleScan = useCallback((result: any) => {
    if (result && result.text) {
      onScan(result.text);
      setIsScanning(false);
    }
  }, [onScan]);

  const handleError = useCallback((error: any) => {
    console.error('Barcode scan error:', error);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Scan Barcode</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {/* Scanner Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Camera Scanner</span>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'Stop' : 'Start'} Scanner</span>
              </button>
            </div>

            {isScanning && (
              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <BarcodeScanner
                    onUpdate={handleScan}
                    onError={handleError}
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <QrCode className="w-12 h-12 mx-auto mb-2" />
                  <p>Click "Start Scanner" to begin</p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Section */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-2">
              <Search className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Manual Entry</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex space-x-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode manually..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
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
              <li>• Click "Start Scanner" to use camera</li>
              <li>• Point camera at barcode/QR code</li>
              <li>• Or enter barcode manually above</li>
              <li>• Scanner will automatically detect and search</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 