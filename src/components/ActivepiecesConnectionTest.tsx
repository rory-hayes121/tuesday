import React, { useState } from 'react';
import { activepiecesClient } from '../services/activepieces';
import { Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ActivepiecesConnectionTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test basic connectivity
      const connectionTest = await activepiecesClient.testConnection();
      
      // Test health endpoint
      const healthCheck = await activepiecesClient.healthCheck();

      setTestResult({
        connection: connectionTest,
        health: healthCheck,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Activepieces Connection Test
        </h2>
        <p className="text-gray-600">
          Test connectivity to your self-hosted Activepieces instance at Railway
        </p>
        <p className="text-sm text-gray-500 mt-1">
          URL: https://activepieces-production-aa7c.up.railway.app
        </p>
        <p className="text-sm text-gray-500">
          Project ID: C8NIVPDXRrRamepemIuFV
        </p>
      </div>

      <button
        onClick={runConnectionTest}
        disabled={isTesting}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        {isTesting ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>Testing...</span>
          </>
        ) : (
          <span>Run Connection Test</span>
        )}
      </button>

      {testResult && (
        <div className="mt-6 space-y-4">
          <h3 className="font-medium text-gray-900">Test Results:</h3>
          
          {testResult.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-900">Connection Failed</span>
              </div>
              <p className="text-red-700">{testResult.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection Test Results */}
              <div className={`border rounded-lg p-4 ${
                testResult.connection?.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {testResult.connection?.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    testResult.connection?.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Project API Access
                  </span>
                </div>
                
                {testResult.connection?.success ? (
                  <p className="text-green-700">✅ Successfully connected to project API</p>
                ) : (
                  <div className="text-red-700">
                    <p>❌ {testResult.connection?.error}</p>
                    {testResult.connection?.requiresAuth && (
                      <p className="mt-1">🔐 Authentication appears to be required</p>
                    )}
                  </div>
                )}
              </div>

              {/* Health Check Results */}
              <div className={`border rounded-lg p-4 ${
                testResult.health?.status === 'healthy' 
                  ? 'bg-green-50 border-green-200' 
                  : testResult.health?.status === 'requires-auth'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {testResult.health?.status === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : testResult.health?.status === 'requires-auth' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    testResult.health?.status === 'healthy' ? 'text-green-900' : 
                    testResult.health?.status === 'requires-auth' ? 'text-yellow-900' : 'text-red-900'
                  }`}>
                    Health Check
                  </span>
                </div>
                
                <p className={
                  testResult.health?.status === 'healthy' ? 'text-green-700' : 
                  testResult.health?.status === 'requires-auth' ? 'text-yellow-700' : 'text-red-700'
                }>
                  Status: {testResult.health?.status}
                </p>
                
                {testResult.health?.version && (
                  <p className="text-gray-600 text-sm">Version: {testResult.health.version}</p>
                )}
                
                {testResult.health?.authRequired && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded border">
                    <p className="text-yellow-800 text-sm">
                      🔐 Authentication required for API access. You may need to:
                    </p>
                    <ul className="list-disc list-inside text-yellow-700 text-sm mt-1">
                      <li>Check if there's an API key setting in your Activepieces admin panel</li>
                      <li>Look for authentication settings in the project configuration</li>
                      <li>Check if the instance is configured for public access</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                <div className="text-blue-800 text-sm space-y-1">
                  {testResult.connection?.success ? (
                    <>
                      <p>✅ Great! Your Activepieces instance is accessible.</p>
                      <p>You can now proceed with workflow deployment.</p>
                    </>
                  ) : testResult.connection?.requiresAuth ? (
                    <>
                      <p>🔐 Authentication is required. To proceed:</p>
                      <p>1. Check your Activepieces admin panel for API key settings</p>
                      <p>2. Look in Project Settings → API or Security section</p>
                      <p>3. Or check if there's a "Generate API Key" option</p>
                    </>
                  ) : (
                    <>
                      <p>❌ There seems to be a connectivity issue.</p>
                      <p>1. Verify the Railway deployment is running</p>
                      <p>2. Check if the URL is accessible</p>
                      <p>3. Verify the project ID is correct</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Test run at: {new Date(testResult.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivepiecesConnectionTest; 