import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Settings, AlertCircle } from 'lucide-react';
import { WorkflowNode } from '../../../types/workflow';

const PromptNode: React.FC<NodeProps<WorkflowNode['data']>> = ({ 
  data, 
  selected,
  id 
}) => {
  const hasErrors = data.errors && data.errors.length > 0;
  const promptText = data.config?.prompt || 'No prompt set';
  const model = data.config?.model || 'GPT-4';

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
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          className="w-3 h-3 border-2 border-gray-300 bg-white hover:border-blue-400 transition-colors"
        />

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
              <h4 className="font-medium text-gray-900 mb-2">
                {data.label}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Model:</span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {model}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Prompt:</span>
                  <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded border max-h-20 overflow-y-auto">
                    {promptText}
                  </p>
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
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="w-3 h-3 border-2 border-gray-300 bg-white hover:border-blue-400 transition-colors"
        />
      </div>
    </div>
  );
};

export default PromptNode;