import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Loader, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Activity,
  Clock,
  Zap
} from 'lucide-react';
import { activepiecesClient, ActivepiecesFlow, ActivepiecesRun } from '../../services/activepieces';

interface ActivepiecesDeploymentProps {
  agentId: string;
  flowId?: string;
  onDeploy: () => Promise<void>;
  onClose: () => void;
}

const ActivepiecesDeployment: React.FC<ActivepiecesDeploymentProps> = ({
  agentId,
  flowId,
  onDeploy,
  onClose
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [flow, setFlow] = useState<ActivepiecesFlow | null>(null);
  const [runs, setRuns] = useState<ActivepiecesRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('{}');

  // Load flow details if flowId exists
  useEffect(() => {
    if (flowId) {
      loadFlowDetails();
    }
  }, [flowId]);

  const loadFlowDetails = async () => {
    if (!flowId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [flowData, runsData] = await Promise.all([
        activepiecesClient.getFlow(flowId),
        activepiecesClient.listRuns(flowId, undefined, 10)
      ]);
      
      setFlow(flowData);
      setRuns(runsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flow details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      await onDeploy();
      // Reload flow details after deployment
      setTimeout(loadFlowDetails, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleTestRun = async () => {
    if (!flowId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let input = {};
      try {
        input = JSON.parse(testInput);
      } catch {
        input = { message: testInput };
      }
      
      const run = await activepiecesClient.executeFlow(flowId, input);
      
      // Refresh runs list
      setTimeout(loadFlowDetails, 2000);
      
      alert(`Test run started! Run ID: ${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test run failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-blue-600';
      case 'SUCCEEDED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'STOPPED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <Loader className="w-4 h-4 animate-spin" />;
      case 'SUCCEEDED': return <CheckCircle className="w-4 h-4" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      case 'STOPPED': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Activepieces Deployment</h2>
              <p className="text-sm text-gray-500">Deploy and manage your workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Deployment Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Deployment Status</h3>
            
            {!flow ? (
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Deploy</h4>
                <p className="text-gray-500 mb-4">
                  Deploy your workflow to Activepieces to start running it
                </p>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isDeploying ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Deploy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="text-lg font-medium text-green-900">{flow.displayName}</h4>
                      <p className="text-green-700">Successfully deployed to Activepieces</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      flow.status === 'ENABLED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flow.status}
                    </span>
                    <a
                      href={`https://activepieces-production-aa7c.up.railway.app/flows/${flow.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                
                <div className="text-sm text-green-700">
                  <p><strong>Flow ID:</strong> {flow.id}</p>
                  <p><strong>Created:</strong> {formatDate(flow.created)}</p>
                  <p><strong>Last Updated:</strong> {formatDate(flow.updated)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Test Run Section */}
          {flow && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Run</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Input (JSON)
                  </label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder='{"message": "Hello, world!"}'
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <button
                  onClick={handleTestRun}
                  disabled={isLoading || !flow}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Test Run</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Execution History */}
          {runs.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Executions</h3>
              <div className="space-y-3">
                {runs.map((run) => (
                  <div key={run.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={getStatusColor(run.status)}>
                          {getStatusIcon(run.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Run {run.id}</p>
                          <p className="text-sm text-gray-500">Started: {formatDate(run.started)}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        run.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                        run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        run.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    
                    {run.finished && (
                      <p className="text-sm text-gray-500 mb-2">
                        Completed: {formatDate(run.finished)}
                      </p>
                    )}
                    
                    {run.output && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                          View Output
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                          {JSON.stringify(run.output, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivepiecesDeployment; 