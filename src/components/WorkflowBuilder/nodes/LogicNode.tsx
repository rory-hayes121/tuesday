import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Settings, AlertCircle, Filter, Plus } from 'lucide-react';
import { WorkflowNode } from '../../../types/workflow';

const LogicNode: React.FC<NodeProps<WorkflowNode['data']>> = ({ 
  data, 
  selected,
  id 
}) => {
  const hasErrors = data.errors && data.errors.length > 0;
  const logicType = data.config?.type || 'if-else';
  const condition = data.config?.condition || 'No condition set';
  const branches = data.config?.branches || [];

  const getIcon = () => {
    switch (logicType) {
      case 'filter': return Filter;
      default: return GitBranch;
    }
  };

  const Icon = getIcon();

  return (
    <div className="relative">
      <div className={`bg-white rounded-xl border-2 shadow-lg transition-all duration-200 min-w-[280px] ${
        selected 
          ? 'border-purple-500 shadow-xl' 
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
            className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-purple-500 transition-colors duration-200"
            style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
          />
        ))}

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 text-white" />
              <span className="font-medium text-white capitalize">{logicType.replace('-', ' ')}</span>
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
                <div>
                  <span className="text-sm text-gray-500">Condition:</span>
                  <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded border">
                    {condition}
                  </p>
                </div>
                
                {branches.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Branches:</span>
                    <div className="mt-1 space-y-1">
                      {branches.slice(0, 3).map((branch: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-xs text-gray-700">{branch.label}</span>
                        </div>
                      ))}
                      {branches.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{branches.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

        {/* Output Handles */}
        {data.outputs?.map((output, index) => (
          <Handle
            key={output.id}
            type="source"
            position={Position.Bottom}
            id={output.id}
            className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-purple-500 transition-colors duration-200"
            style={{ 
              bottom: -6, 
              left: data.outputs!.length === 1 ? '50%' : `${25 + (index * 50)}%`,
              transform: 'translateX(-50%)'
            }}
          />
        ))}
      </div>

      {/* Connection Line with Add Button */}
      {(!data.hasOutgoing && data.onAddNode) && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="w-0.5 h-12 bg-gray-300 opacity-50"></div>
          <button
            onClick={() => data.onAddNode(id)}
            className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 text-gray-500 hover:text-purple-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LogicNode;