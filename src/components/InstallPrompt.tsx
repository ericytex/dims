import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';

interface InstallPromptProps {
  onClose?: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = window.navigator.standalone === true;
    
    if (isStandalone || isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if we should show the install prompt
    const shouldShowInstallPrompt = () => {
      const isAndroid = /Android/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      const isMobile = /Mobile/.test(navigator.userAgent);
      
      return isAndroid && isChrome && isMobile && !isInstalled;
    };

    if (shouldShowInstallPrompt()) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for manual installation
      showManualInstallInstructions();
      return;
    }

    setIsInstalling(true);
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
      showManualInstallInstructions();
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const showManualInstallInstructions = () => {
    const instructions = `
      To install this app on your Android device:
      
      1. Open Chrome browser
      2. Tap the menu (⋮) in the top right
      3. Tap "Add to Home screen"
      4. Tap "Add" to confirm
      
      The app will now appear on your home screen!
    `;
    
    alert(instructions);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-uganda-yellow rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-uganda-black" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Install App
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mt-1">
              Add this app to your home screen for quick access
            </p>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-uganda-yellow text-uganda-black px-3 py-2 rounded-md text-xs font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
              >
                {isInstalling ? (
                  <>
                    <div className="w-3 h-3 border border-uganda-black border-t-transparent rounded-full animate-spin" />
                    <span>Installing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    <span>Install</span>
                  </>
                )}
              </button>
              
              <button
                onClick={showManualInstallInstructions}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                How?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt; 