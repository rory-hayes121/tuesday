import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Settings, AlertCircle, Plus } from 'lucide-react';
import { WorkflowNode } from '../../../types/workflow';

const PromptNode: React.FC<NodeProps<WorkflowNode['data']>> = ({ 
  data, 
  selected,
  id 
}) => {
  const hasErrors = data.errors && data.errors.length > 0;
  const instruction = data.config?.instruction || 'No instruction set';
  const model = data.config?.model || 'gpt-4';

  return (
    <div className="relative">
      <div className={`bg-white rounded-xl border-2 shadow-lg transition-all duration-200 min-w-[280px] ${
        selected 
          ? 'border-blue-500 shadow-xl' 
          : hasErrors
          ? 'border-red-300 hover:border-red-400'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}>
        {/* Input Handle */}
        {data.inputs?.map(input => (
          <Handle
            key={input.id}
            type="target"
            position={Position.Top}
            id={input.id}
            className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-blue-500 transition-colors duration-200"
            style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
          />
        ))}

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="font-medium text-white">AI Prompt</span>
            </div>
            <div className="flex items-center space-x-1">
              {hasErrors && (
                <AlertCircle className="w-4 h-4 text-red-200" />
              )}
              <Settings className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors duration-200" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {data.label}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-3">
                {instruction}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                {model}
              </span>
              {data.config?.temperature !== undefined && (
                <span className="text-xs text-gray-500">
                  Temp: {data.config.temperature}
                </span>
              )}
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

        {/* Output Handle with Connection Line */}
        {data.outputs?.map(output => (
          <Handle
            key={output.id}
            type="source"
            position={Position.Bottom}
            id={output.id}
            className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-blue-500 transition-colors duration-200"
            style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
          />
        ))}
      </div>

      {/* Connection Line with Add Button */}
      {(!data.hasOutgoing && data.onAddNode) && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="w-0.5 h-12 bg-gray-300 opacity-50"></div>
          <button
            onClick={() => data.onAddNode(id)}
            className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 text-gray-500 hover:text-blue-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptNode;