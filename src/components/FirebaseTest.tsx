import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const FirebaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Test Firebase connection
    const testConnection = async () => {
      try {
        setStatus('Testing Firebase connection...');
        
        // Test Firestore connection
        const testCollection = collection(db, 'test');
        const querySnapshot = await getDocs(testCollection);
        setStatus('✅ Firebase connection successful!');
        
        console.log('Firebase connection test passed');
      } catch (error) {
        setStatus(`❌ Firebase connection failed: ${error}`);
        console.error('Firebase connection test failed:', error);
      }
    };

    testConnection();
  }, []);

  const handleSignUp = async () => {
    try {
      setStatus('Creating test user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setStatus('✅ User created successfully!');
    } catch (error: any) {
      setStatus(`❌ Sign up failed: ${error.message}`);
    }
  };

  const handleSignIn = async () => {
    try {
      setStatus('Signing in...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setStatus('✅ Sign in successful!');
    } catch (error: any) {
      setStatus(`❌ Sign in failed: ${error.message}`);
    }
  };

  const handleTestDatabase = async () => {
    try {
      setStatus('Testing database write...');
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello Firebase!',
        timestamp: new Date(),
        test: true
      });
      setStatus(`✅ Database write successful! Document ID: ${docRef.id}`);
    } catch (error: any) {
      setStatus(`❌ Database write failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-mono text-sm">{status}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleSignUp}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Sign In
            </button>
          </div>
        </div>

        {user && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p className="text-green-800">
              ✅ User: {user.email} (ID: {user.uid})
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Database Test</h2>
        <button
          onClick={handleTestDatabase}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Test Database Write
        </button>
      </div>
    </div>
  );
}; 