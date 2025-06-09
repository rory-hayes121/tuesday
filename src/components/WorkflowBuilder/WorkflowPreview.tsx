import React from 'react';
import { X, Download, Share, Copy } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';

interface WorkflowPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ isOpen, onClose }) => {
  const { nodes, edges, validationResult } = useWorkflowStore();

  const generateWorkflowCode = () => {
    // Generate executable code for the workflow
    const workflow = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        config: node.data.config,
        position: node.position
      })),
      edges: edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }))
    };

    return JSON.stringify(workflow, null, 2);
  };

  const handleExport = () => {
    const code = generateWorkflowCode();
    const blob = new Blob([code], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const code = generateWorkflowCode();
    navigator.clipboard.writeText(code);
    // Show toast notification
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Workflow Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Export workflow"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Workflow Summary */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Blocks:</span>
                    <span className="text-sm font-medium">{nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Connections:</span>
                    <span className="text-sm font-medium">{edges.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`text-sm font-medium ${
                      validationResult?.isValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {validationResult?.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Block Types</h4>
                <div className="space-y-2">
                  {Object.entries(
                    nodes.reduce((acc, node) => {
                      acc[node.type] = (acc[node.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">{type}:</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {validationResult && !validationResult.isValid && (
                <div>
                  <h4 className="text-md font-medium text-red-900 mb-3">Validation Errors</h4>
                  <div className="space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Generated Code */}
          <div className="flex-1 p-6">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Workflow</h3>
              <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto">
                <pre className="text-sm font-mono text-gray-800">
                  {generateWorkflowCode()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPreview;