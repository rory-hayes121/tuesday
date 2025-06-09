import React, { useState } from 'react';
import { 
  Upload, 
  Play, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Code,
  Download,
  X,
  Activity
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { ActivepiecesService } from '../../services/activepieces';

interface ActivepiecesDeploymentProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}

const ActivepiecesDeployment: React.FC<ActivepiecesDeploymentProps> = ({
  isOpen,
  onClose,
  agentId,
  agentName
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [activepiecesConfig, setActivepiecesConfig] = useState({
    baseUrl: 'https://activepieces-production-aa7c.up.railway.app',
    projectId: 'default-project'
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [testInput, setTestInput] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { nodes, edges } = useWorkflowStore();

  const handleDeploy = async () => {
    if (!activepiecesConfig.projectId) {
      alert('Please configure Activepieces project settings');
      return;
    }

    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const activepiecesService = new ActivepiecesService({
        baseUrl: activepiecesConfig.baseUrl
      });
      
      const result = await activepiecesService.deployAgent(
        agentId, 
        agentName, 
        nodes, 
        edges,
        activepiecesConfig.projectId
      );
      
      setDeploymentResult(result);
    } catch (error) {
      setDeploymentResult({
        errors: [`Deployment failed: ${error}`]
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePreview = () => {
    try {
      const activepiecesService = new ActivepiecesService({
        baseUrl: 'preview'
      });
      
      const preview = activepiecesService.generatePreview(nodes, edges);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      alert(`Preview generation failed: ${error}`);
    }
  };

  const handleTest = async () => {
    if (!deploymentResult?.deployment?.flowId) {
      alert('Please deploy the workflow first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const input = JSON.parse(testInput);
      const activepiecesService = new ActivepiecesService({
        baseUrl: activepiecesConfig.baseUrl
      });

      const result = await activepiecesService.triggerWorkflow(
        deploymentResult.deployment.flowId,
        activepiecesConfig.projectId,
        input
      );

      setTestResult(result);

      // Poll for completion
      if (result.success && result.runId) {
        const pollInterval = setInterval(async () => {
          try {
            const status = await activepiecesService.getExecutionStatus(result.runId!);
            if (status.status !== 'RUNNING') {
              clearInterval(pollInterval);
              const finalResult = await activepiecesService.getExecutionResult(result.runId!);
              setTestResult(finalResult);
            }
          } catch (error) {
            clearInterval(pollInterval);
            console.error('Failed to poll execution status:', error);
          }
        }, 2000);

        // Stop polling after 30 seconds
        setTimeout(() => clearInterval(pollInterval), 30000);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: `Test execution failed: ${error}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadFlow = () => {
    if (!previewData?.flowVersion) return;

    const blob = new Blob([JSON.stringify(previewData.flowVersion, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName}_activepieces_flow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Deploy to Activepieces</h2>
              <p className="text-gray-600">Convert your workflow to executable Activepieces flow</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Configuration */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Activepieces Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activepieces URL
                    </label>
                    <input
                      type="url"
                      value={activepiecesConfig.baseUrl}
                      onChange={(e) => setActivepiecesConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://activepieces-production-aa7c.up.railway.app"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={activepiecesConfig.projectId}
                      onChange={(e) => setActivepiecesConfig(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="default-project"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePreview}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Code className="w-4 h-4" />
                  <span>Preview Flow</span>
                </button>

                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !activepiecesConfig.projectId}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Deploy to Activepieces</span>
                    </>
                  )}
                </button>

                {deploymentResult?.deployment && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Input (JSON)
                      </label>
                      <textarea
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        className="w-full h-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        placeholder='{"key": "value"}'
                      />
                    </div>
                    
                    <button
                      onClick={handleTest}
                      disabled={isTesting}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      {isTesting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Test Flow</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Workflow Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Workflow Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Nodes: {nodes.length}</div>
                  <div>Connections: {edges.length}</div>
                  <div>Agent: {agentName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 p-6">
            {showPreview && previewData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Generated Flow Preview</h3>
                  <button
                    onClick={handleDownloadFlow}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Flow</span>
                  </button>
                </div>

                {previewData.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-900">Validation Errors</span>
                    </div>
                    <div className="space-y-1">
                      {previewData.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-700">• {error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-yellow-900">Warnings</span>
                    </div>
                    <div className="space-y-1">
                      {previewData.warnings.map((warning: string, index: number) => (
                        <div key={index} className="text-sm text-yellow-700">• {warning}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Flow Definition</h4>
                  <div className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h5 className="font-medium text-gray-900">{previewData.flowVersion.displayName}</h5>
                    </div>
                    <div className="p-4">
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(previewData.flowVersion, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : deploymentResult ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Deployment Result</h3>
                
                {deploymentResult.deployment ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-900">Deployment Successful</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-green-900">Flow ID:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-green-100 px-2 py-1 rounded">
                            {deploymentResult.deployment.flowId}
                          </code>
                          <button className="text-green-600 hover:text-green-700">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-green-900">Project ID:</span>
                        <code className="block text-sm bg-green-100 px-2 py-1 rounded mt-1">
                          {deploymentResult.deployment.projectId}
                        </code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-900">Deployment Failed</span>
                    </div>
                    
                    <div className="space-y-1">
                      {deploymentResult.errors?.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-700">• {error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Test Execution Result</h4>
                    
                    {testResult.success ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-900">Test Successful</span>
                        </div>
                        
                        {testResult.runId && (
                          <div className="text-sm text-green-700">
                            Run ID: <code>{testResult.runId}</code>
                          </div>
                        )}
                        
                        {testResult.status && (
                          <div className="text-sm text-green-700">
                            Status: <span className="font-medium">{testResult.status}</span>
                          </div>
                        )}

                        {testResult.logs && testResult.logs.length > 0 && (
                          <details className="mt-3">
                            <summary className="text-sm text-green-700 cursor-pointer">View Logs</summary>
                            <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-auto max-h-32">
                              {testResult.logs.join('\n')}
                            </pre>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-red-900">Test Failed</span>
                        </div>
                        
                        <div className="text-sm text-red-700">
                          {testResult.error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Configure Activepieces settings and deploy your workflow</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivepiecesDeployment;