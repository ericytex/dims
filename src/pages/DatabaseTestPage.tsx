import React, { useState } from 'react';
import { useSQLiteDatabase } from '../hooks/useSQLiteDatabase';
import DatabaseManager from '../components/DatabaseManager';
import CentralSyncStatus from '../components/CentralSyncStatus';

const DatabaseTestPage: React.FC = () => {
  const { execute, query, isInitialized } = useSQLiteDatabase();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runSampleQueries = async () => {
    if (!isInitialized) return;

    setLoading(true);
    try {
      // Sample queries to test the database
      const queries = [
        'SELECT * FROM users',
        'SELECT * FROM facilities',
        'SELECT * FROM inventory_items',
        'SELECT COUNT(*) as total_transactions FROM stock_transactions',
        'SELECT COUNT(*) as total_transfers FROM transfers'
      ];

      const allResults = [];
      for (const sql of queries) {
        try {
          const result = await query(sql);
          allResults.push({ query: sql, result });
        } catch (error) {
          allResults.push({ query: sql, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error('Error running sample queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSampleData = async () => {
    if (!isInitialized) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      // Add sample inventory item
      await execute(`
        INSERT INTO inventory_items (id, name, description, category, sku, unit, current_stock, min_stock, max_stock, cost, supplier, facility_id, location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `item-${Date.now()}`,
        'Sample Item',
        'A sample inventory item for testing',
        'Test Category',
        `SKU-${Date.now()}`,
        'units',
        100,
        10,
        500,
        1500,
        'Test Supplier',
        'facility-1',
        'Test Location',
        now,
        now
      ]);

      // Add sample transaction
      await execute(`
        INSERT INTO stock_transactions (id, item_id, facility_id, type, quantity, unit, reason, user_id, transaction_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `txn-${Date.now()}`,
        'item-1',
        'facility-1',
        'stock_in',
        50,
        'kg',
        'Sample stock in transaction',
        'admin-1',
        now,
        now
      ]);

      alert('Sample data added successfully!');
    } catch (error) {
      console.error('Error adding sample data:', error);
      alert('Error adding sample data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SQLite Database Test</h1>
          <p className="text-gray-600">Test the SQLite persistence functionality with sample operations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Database Manager */}
          <div>
            <DatabaseManager />
          </div>

          {/* Central Sync Status */}
          <div>
            <CentralSyncStatus />
          </div>

          {/* Test Operations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Operations</h2>
            
            <div className="space-y-4">
              <button
                onClick={runSampleQueries}
                disabled={!isInitialized || loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Running...' : 'Run Sample Queries'}
              </button>

              <button
                onClick={addSampleData}
                disabled={!isInitialized || loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adding...' : 'Add Sample Data'}
              </button>
            </div>

            {/* Results Display */}
            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Query Results</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Query {index + 1}:</h4>
                      <p className="text-sm text-gray-600 mb-2 font-mono">{result.query}</p>
                      
                      {result.error ? (
                        <div className="text-red-600 text-sm">
                          Error: {result.error}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">Results:</p>
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">About SQLite Persistence</h3>
          <div className="text-blue-700 space-y-2">
            <p>This implementation provides:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Full Offline Functionality:</strong> Works without internet connection</li>
              <li><strong>Automatic Persistence:</strong> Saves to IndexedDB after each operation</li>
              <li><strong>Data Recovery:</strong> Loads previous state on app restart</li>
              <li><strong>Export Capability:</strong> Download database as .db file</li>
              <li><strong>Schema Management:</strong> Versioned database schema with migrations</li>
              <li><strong>Error Handling:</strong> Robust error handling and recovery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTestPage; 