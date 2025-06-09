import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Settings, AlertCircle, Save, Download } from 'lucide-react';
import { WorkflowNode } from '../../../types/workflow';

const MemoryNode: React.FC<NodeProps<WorkflowNode['data']>> = ({ 
  data, 
  selected,
  id 
}) => {
  const hasErrors = data.errors && data.errors.length > 0;
  const operation = data.config?.operation || 'store';
  const key = data.config?.key || 'No key set';
  const scope = data.config?.scope || 'session';

  const getOperationIcon = () => {
    switch (operation) {
      case 'store': return Save;
      case 'retrieve': return Download;
      default: return Database;
    }
  };

  const OperationIcon = getOperationIcon();

  return (
    <div className={`bg-white rounded-xl border-2 shadow-lg transition-all duration-200 min-w-[280px] ${
      selected 
        ? 'border-orange-500 shadow-xl' 
        : hasErrors
        ? 'border-red-300 hover:border-red-400'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
    }`}>
      {/* Input Handle */}
      {data.inputs?.map(input => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-orange-500 transition-colors duration-200"
          style={{ top: '50%' }}
        />
      ))}

      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Memory</span>
          </div>
          <div className="flex items-center space-x-1">
            {hasErrors && (
              <AlertCircle className="w-4 h-4 text-red-200" />
            )}
            <OperationIcon className="w-4 h-4 text-white/70" />
            <Settings className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors duration-200" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {data.label}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Operation:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  operation === 'store' ? 'bg-green-100 text-green-700' :
                  operation === 'retrieve' ? 'bg-blue-100 text-blue-700' :
                  operation === 'update' ? 'bg-yellow-100 text-yellow-700' :
                  operation === 'delete' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {operation}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Key:</span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {key}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Scope:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  scope === 'session' ? 'bg-blue-100 text-blue-700' :
                  scope === 'global' ? 'bg-purple-100 text-purple-700' :
                  scope === 'user' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {scope}
                </span>
              </div>
            </div>
          </div>

          {hasErrors && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-700">
                  {data.errors![0]}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      {data.outputs?.map(output => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-orange-500 transition-colors duration-200"
          style={{ top: '50%' }}
        />
      ))}
    </div>
  );
};

export default MemoryNode;