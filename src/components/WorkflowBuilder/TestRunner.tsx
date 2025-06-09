import React, { useState } from 'react';
import { Play, Square, RotateCcw, Download, X } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { ActivepiecesService } from '../../services/activepieces';

interface TestRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ isOpen, onClose }) => {
  const [execution, setExecution] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testInput, setTestInput] = useState('{}');
  
  const { nodes, edges } = useWorkflowStore();

  const handleRunTest = async () => {
    setIsRunning(true);
    setExecution(null);

    try {
      const input = JSON.parse(testInput);
      
      // Create a test execution using Activepieces service
      const activepiecesService = new ActivepiecesService({
        baseUrl: 'https://activepieces-production-aa7c.up.railway.app'
      });

      // Generate preview to validate workflow
      const preview = activepiecesService.generatePreview(nodes, edges);
      
      if (preview.errors.length > 0) {
        setExecution({
          id: 'test-failed',
          status: 'failed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          input: input,
          error: preview.errors.join(', '),
          steps: []
        });
        return;
      }

      // Simulate execution for testing
      const mockExecution = {
        id: `test-${Date.now()}`,
        status: 'running',
        startedAt: new Date().toISOString(),
        input: input,
        steps: []
      };

      setExecution(mockExecution);

      // Simulate step execution
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const step = {
          nodeId: node.id,
          status: 'running',
          startedAt: new Date().toISOString(),
          input: i === 0 ? input : { data: `Output from ${nodes[i-1].data.label}` }
        };

        mockExecution.steps.push(step);
        setExecution({ ...mockExecution });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Complete the step
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        step.output = {
          success: true,
          result: `Processed by ${node.data.label}`,
          nodeType: node.type,
          timestamp: new Date().toISOString()
        };
        step.duration = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();

        setExecution({ ...mockExecution });
      }

      // Complete execution
      mockExecution.status = 'completed';
      mockExecution.completedAt = new Date().toISOString();
      mockExecution.output = {
        success: true,
        message: 'Workflow completed successfully',
        processedNodes: nodes.length
      };

      setExecution({ ...mockExecution });

    } catch (error) {
      setExecution({
        id: 'test-error',
        status: 'failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        input: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        steps: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Test Workflow</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Input & Controls */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Input (JSON)
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRunTest}
                  disabled={isRunning}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Run Test</span>
                    </>
                  )}
                </button>

                {execution && (
                  <button
                    onClick={() => setExecution(null)}
                    className="w-full text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear Results</span>
                  </button>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Test Mode</h4>
                <p className="text-sm text-blue-700">
                  This simulates workflow execution using Activepieces engine. Deploy your workflow to run it with real integrations.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 p-6">
            {execution ? (
              <div className="space-y-6">
                {/* Execution Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        execution.status === 'completed' ? 'text-green-600 bg-green-100' :
                        execution.status === 'failed' ? 'text-red-600 bg-red-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="ml-2 text-sm font-medium">
                        {execution.completedAt ? 
                          formatDuration(new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) :
                          'Running...'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {execution.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-sm text-red-700">{execution.error}</span>
                    </div>
                  )}
                </div>

                {/* Execution Steps */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Steps</h3>
                  <div className="space-y-3">
                    {execution.steps.map((step: any, index: number) => {
                      const node = nodes.find(n => n.id === step.nodeId);
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">
                                {node?.data.label || step.nodeId}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStepStatusColor(step.status)}`}>
                                {step.status}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDuration(step.duration)}
                            </span>
                          </div>
                          
                          {step.error && (
                            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              {step.error}
                            </div>
                          )}
                          
                          {step.output && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                                View Output
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final Output */}
                {execution.output && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Final Output</h3>
                    <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(execution.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Run a test to see execution results</p>
                  <p className="text-sm mt-2">This will simulate your workflow execution</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;