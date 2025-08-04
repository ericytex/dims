import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';

export const FirebaseExample: React.FC = () => {
  const { user, signIn, signUp, signOut, isAuthenticated, loading: authLoading } = useFirebaseAuth();
  const { 
    inventoryItems, 
    addInventoryItem, 
    loading: dbLoading, 
    error 
  } = useFirebaseDatabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password);
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addInventoryItem({
        name: itemName,
        description: 'Sample item',
        category: 'General',
        sku: `SKU-${Date.now()}`,
        unit: 'pieces',
        currentStock: parseInt(itemQuantity) || 0,
        minStock: 10,
        maxStock: 100,
        cost: 1000,
        supplier: 'Sample Supplier',
        status: 'active'
      });
      setItemName('');
      setItemQuantity('');
    } catch (error) {
      console.error('Add item error:', error);
    }
  };

  if (authLoading || dbLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Firebase IMS Demo</h1>

      {/* Authentication Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        
        {!isAuthenticated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sign In */}
            <div>
              <h3 className="text-lg font-medium mb-3">Sign In</h3>
              <form onSubmit={handleSignIn} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Sign In
                </button>
              </form>
            </div>

            {/* Sign Up */}
            <div>
              <h3 className="text-lg font-medium mb-3">Sign Up</h3>
              <form onSubmit={handleSignUp} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Sign Up
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">Welcome, {user?.email}</p>
              <p className="text-sm text-gray-600">User ID: {user?.uid}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Inventory Management Section */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Inventory Management</h2>
          
          {/* Add Item Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Add New Item</h3>
            <form onSubmit={handleAddItem} className="flex gap-3">
              <input
                type="text"
                placeholder="Item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="w-32 p-2 border border-gray-300 rounded"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Item
              </button>
            </form>
          </div>

          {/* Inventory List */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Inventory</h3>
            {inventoryItems.length === 0 ? (
              <p className="text-gray-500">No items in inventory yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-lg">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">SKU:</span> {item.sku}</p>
                      <p><span className="font-medium">Stock:</span> {item.currentStock} {item.unit}</p>
                      <p><span className="font-medium">Category:</span> {item.category}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Firebase Status */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Firebase Status</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Authentication:</span> {isAuthenticated ? '✅ Connected' : '❌ Not connected'}</p>
          <p><span className="font-medium">Database:</span> {dbLoading ? '⏳ Loading...' : '✅ Connected'}</p>
          <p><span className="font-medium">Items Count:</span> {inventoryItems.length}</p>
        </div>
      </div>
    </div>
  );
}; 