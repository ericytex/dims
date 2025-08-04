import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';

export const FirebaseConfigTest: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<string>('Checking...');
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    const checkConfig = () => {
      try {
        // Check environment variables
        const env = {
          apiKey: import.meta.env.FIREBASE_API_KEY,
          authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.FIREBASE_APP_ID,
          measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID,
        };

        setEnvVars(env);

        // Check if all required variables are present
        const missingVars = Object.entries(env)
          .filter(([key, value]) => !value)
          .map(([key]) => key);

        if (missingVars.length > 0) {
          setConfigStatus(`❌ Missing environment variables: ${missingVars.join(', ')}`);
          return;
        }

        // Test Firebase initialization
        if (auth && db) {
          setConfigStatus('✅ Firebase configuration successful!');
        } else {
          setConfigStatus('❌ Firebase services not initialized');
        }

      } catch (error) {
        setConfigStatus(`❌ Configuration error: ${error}`);
      }
    };

    checkConfig();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Firebase Configuration Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-mono text-sm">{configStatus}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-mono text-sm">{key}:</span>
              <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
