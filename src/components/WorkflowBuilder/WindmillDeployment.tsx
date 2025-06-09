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
  X
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { WindmillService } from '../../services/windmill/WindmillService';

interface WindmillDeploymentProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}

const WindmillDeployment: React.FC<WindmillDeploymentProps> = ({
  isOpen,
  onClose,
  agentId,
  agentName
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [windmillConfig, setWindmillConfig] = useState({
    baseUrl: 'https://app.windmill.dev',
    token: '',
    workspace: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const { nodes, edges } = useWorkflowStore();

  const handleDeploy = async () => {
    if (!windmillConfig.token || !windmillConfig.workspace) {
      alert('Please configure Windmill connection settings');
      return;
    }

    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const windmillService = new WindmillService(windmillConfig);
      const result = await windmillService.deployAgent(agentId, agentName, nodes, edges);
      
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
      const windmillService = new WindmillService({
        baseUrl: 'preview',
        token: 'preview',
        workspace: 'preview'
      });
      
      const preview = windmillService.generatePreview(nodes, edges);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      alert(`Preview generation failed: ${error}`);
    }
  };

  const handleDownloadScripts = () => {
    if (!previewData?.scripts) return;

    previewData.scripts.forEach((script: any) => {
      const blob = new Blob([script.content], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${script.name}.ts`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Download flow definition
    const flowBlob = new Blob([JSON.stringify(previewData.flow, null, 2)], { type: 'application/json' });
    const flowUrl = URL.createObjectURL(flowBlob);
    const flowLink = document.createElement('a');
    flowLink.href = flowUrl;
    flowLink.download = `${agentName}_flow.json`;
    flowLink.click();
    URL.revokeObjectURL(flowUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Deploy to Windmill</h2>
              <p className="text-gray-600">Convert your workflow to executable Windmill scripts</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Windmill Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Windmill URL
                    </label>
                    <input
                      type="url"
                      value={windmillConfig.baseUrl}
                      onChange={(e) => setWindmillConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://app.windmill.dev"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Token
                    </label>
                    <input
                      type="password"
                      value={windmillConfig.token}
                      onChange={(e) => setWindmillConfig(prev => ({ ...prev, token: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Windmill API token"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workspace
                    </label>
                    <input
                      type="text"
                      value={windmillConfig.workspace}
                      onChange={(e) => setWindmillConfig(prev => ({ ...prev, workspace: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your-workspace"
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
                  <span>Preview Scripts</span>
                </button>

                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !windmillConfig.token || !windmillConfig.workspace}
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
                      <span>Deploy to Windmill</span>
                    </>
                  )}
                </button>
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
                  <h3 className="text-lg font-medium text-gray-900">Generated Scripts Preview</h3>
                  <button
                    onClick={handleDownloadScripts}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All</span>
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

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Scripts ({previewData.scripts.length})</h4>
                  {previewData.scripts.map((script: any, index: number) => (
                    <details key={index} className="border border-gray-200 rounded-lg">
                      <summary className="p-4 cursor-pointer hover:bg-gray-50 font-medium">
                        {script.name} ({script.language})
                      </summary>
                      <div className="border-t border-gray-200 p-4">
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
                          {script.content}
                        </pre>
                      </div>
                    </details>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Flow Definition</h4>
                  <details className="border border-gray-200 rounded-lg">
                    <summary className="p-4 cursor-pointer hover:bg-gray-50 font-medium">
                      {previewData.flow.summary}
                    </summary>
                    <div className="border-t border-gray-200 p-4">
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(previewData.flow, null, 2)}
                      </pre>
                    </div>
                  </details>
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
                        <span className="text-sm font-medium text-green-900">Flow Path:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-green-100 px-2 py-1 rounded">
                            {deploymentResult.deployment.flowPath}
                          </code>
                          <button className="text-green-600 hover:text-green-700">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-green-900">Scripts Deployed:</span>
                        <div className="mt-1 space-y-1">
                          {deploymentResult.deployment.scriptPaths.map((path: string, index: number) => (
                            <code key={index} className="block text-sm bg-green-100 px-2 py-1 rounded">
                              {path}
                            </code>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-green-200">
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2">
                          <Play className="w-4 h-4" />
                          <span>Test Execution</span>
                        </button>
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Configure Windmill settings and deploy your workflow</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindmillDeployment;