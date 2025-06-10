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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deploy Workflow</h2>
              <p className="text-sm text-gray-500">Deploy and manage your agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Deployment Section */}
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Deployment Status</h3>
            
            {!flow ? (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Zap className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h4 className="text-base font-medium text-gray-900 mb-2">Ready to Deploy</h4>
                <p className="text-gray-500 text-sm mb-4">
                  Deploy your workflow to start running it
                </p>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-base font-medium text-green-900">{flow.displayName}</h4>
                      <p className="text-green-700 text-sm">Successfully deployed</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      flow.status === 'ENABLED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flow.status}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-green-700">
                  <p><strong>Flow ID:</strong> {flow.id}</p>
                  <p><strong>Created:</strong> {formatDate(flow.created)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Test Run Section */}
          {flow && (
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-900 mb-3">Test Run</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Input (JSON)
                  </label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder='{"message": "Hello, world!"}'
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <button
                  onClick={handleTestRun}
                  disabled={isLoading || !flow}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
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
              <h3 className="text-base font-medium text-gray-900 mb-3">Recent Executions</h3>
              <div className="space-y-2">
                {runs.slice(0, 3).map((run) => (
                  <div key={run.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={getStatusColor(run.status)}>
                          {getStatusIcon(run.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Run {run.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500">{formatDate(run.started)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        run.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                        run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        run.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))}
                {runs.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{runs.length - 3} more executions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivepiecesDeployment; 