import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { WorkflowNode, PromptNodeConfig, ToolNodeConfig, LogicNodeConfig, MemoryNodeConfig, IntegrationNodeConfig } from '../../types/workflow';

interface PropertiesPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ nodeId, onClose }) => {
  const { nodes, updateNode, deleteNode } = useWorkflowStore();
  const [hasChanges, setHasChanges] = useState(false);
  
  const node = nodeId ? nodes.find(n => n.id === nodeId) : null;
  
  if (!node) return null;

  const handleConfigUpdate = (updates: any) => {
    updateNode(nodeId!, {
      data: {
        ...node.data,
        config: {
          ...node.data?.config,
          ...updates
        }
      }
    });
    setHasChanges(true);
  };

  const handleLabelUpdate = (label: string) => {
    updateNode(nodeId!, { 
      data: {
        ...node.data,
        label
      }
    });
    setHasChanges(true);
  };

  const handleDescriptionUpdate = (description: string) => {
    updateNode(nodeId!, { 
      data: {
        ...node.data,
        description
      }
    });
    setHasChanges(true);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this block?')) {
      deleteNode(nodeId!);
      onClose();
    }
  };

  const renderPromptConfig = (config: PromptNodeConfig) => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Instruction
        </label>
        <textarea
          value={config.instruction || ''}
          onChange={(e) => handleConfigUpdate({ instruction: e.target.value })}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter your AI instruction here..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Describe what you want the AI to do with the input data
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <select
            value={config.model || 'gpt-4'}
            onChange={(e) => handleConfigUpdate({ model: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3">Claude 3</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature
          </label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature || 0.7}
            onChange={(e) => handleConfigUpdate({ temperature: parseFloat(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Tokens
        </label>
        <input
          type="number"
          min="1"
          max="4000"
          value={config.maxTokens || 1000}
          onChange={(e) => handleConfigUpdate({ maxTokens: parseInt(e.target.value) })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Variables
          </label>
          <button
            onClick={() => {
              const newVariable = { name: '', type: 'text', description: '' };
              handleConfigUpdate({ 
                variables: [...(config.variables || []), newVariable] 
              });
            }}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Variable</span>
          </button>
        </div>
        
        <div className="space-y-2">
          {(config.variables || []).map((variable, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg">
              <input
                type="text"
                placeholder="Variable name"
                value={variable.name}
                onChange={(e) => {
                  const newVariables = [...(config.variables || [])];
                  newVariables[index] = { ...variable, name: e.target.value };
                  handleConfigUpdate({ variables: newVariables });
                }}
                className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={variable.type}
                onChange={(e) => {
                  const newVariables = [...(config.variables || [])];
                  newVariables[index] = { ...variable, type: e.target.value };
                  handleConfigUpdate({ variables: newVariables });
                }}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
              <button
                onClick={() => {
                  const newVariables = (config.variables || []).filter((_, i) => i !== index);
                  handleConfigUpdate({ variables: newVariables });
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderToolConfig = (config: ToolNodeConfig) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service
          </label>
          <select
            value={config.service || ''}
            onChange={(e) => handleConfigUpdate({ service: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a service...</option>
            <option value="http">HTTP Request</option>
            <option value="webhook">Webhook</option>
            <option value="email">Email</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action
          </label>
          <input
            type="text"
            value={config.action || ''}
            onChange={(e) => handleConfigUpdate({ action: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., send_request"
          />
        </div>
      </div>

      {config.service === 'http' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                value={config.parameters?.method || 'GET'}
                onChange={(e) => handleConfigUpdate({ 
                  parameters: { ...config.parameters, method: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                value={config.parameters?.url || ''}
                onChange={(e) => handleConfigUpdate({ 
                  parameters: { ...config.parameters, url: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers (JSON)
            </label>
            <textarea
              value={JSON.stringify(config.parameters?.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  handleConfigUpdate({ 
                    parameters: { ...config.parameters, headers }
                  });
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder='{"Content-Type": "application/json"}'
            />
          </div>

          {(config.parameters?.method === 'POST' || config.parameters?.method === 'PUT' || config.parameters?.method === 'PATCH') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.parameters?.body || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const body = JSON.parse(e.target.value);
                    handleConfigUpdate({ 
                      parameters: { ...config.parameters, body }
                    });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLogicConfig = (config: LogicNodeConfig) => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logic Type
        </label>
        <select
          value={config.type || 'if-else'}
          onChange={(e) => handleConfigUpdate({ type: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="if-else">If/Else</option>
          <option value="switch">Switch</option>
          <option value="filter">Filter</option>
          <option value="loop">Loop</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condition
        </label>
        <textarea
          value={config.condition || ''}
          onChange={(e) => handleConfigUpdate({ condition: e.target.value })}
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="e.g., input.status === 'urgent'"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use JavaScript-like syntax for conditions
        </p>
      </div>

      {config.type === 'switch' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Branches
            </label>
            <button
              onClick={() => {
                const newBranch = { condition: '', label: `Branch ${(config.branches || []).length + 1}` };
                handleConfigUpdate({ 
                  branches: [...(config.branches || []), newBranch] 
                });
              }}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {(config.branches || []).map((branch, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg">
                <input
                  type="text"
                  placeholder="Condition"
                  value={branch.condition}
                  onChange={(e) => {
                    const newBranches = [...(config.branches || [])];
                    newBranches[index] = { ...branch, condition: e.target.value };
                    handleConfigUpdate({ branches: newBranches });
                  }}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Label"
                  value={branch.label}
                  onChange={(e) => {
                    const newBranches = [...(config.branches || [])];
                    newBranches[index] = { ...branch, label: e.target.value };
                    handleConfigUpdate({ branches: newBranches });
                  }}
                  className="w-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const newBranches = (config.branches || []).filter((_, i) => i !== index);
                    handleConfigUpdate({ branches: newBranches });
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMemoryConfig = (config: MemoryNodeConfig) => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operation
        </label>
        <select
          value={config.operation || 'store'}
          onChange={(e) => handleConfigUpdate({ operation: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="store">Store Data</option>
          <option value="retrieve">Retrieve Data</option>
          <option value="update">Update Data</option>
          <option value="delete">Delete Data</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Key
        </label>
        <input
          type="text"
          value={config.key || ''}
          onChange={(e) => handleConfigUpdate({ key: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., customer_data"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scope
        </label>
        <select
          value={config.scope || 'session'}
          onChange={(e) => handleConfigUpdate({ scope: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="session">Session</option>
          <option value="global">Global</option>
          <option value="user">User</option>
        </select>
      </div>

      {(config.operation === 'store' || config.operation === 'update') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <textarea
            value={config.value || ''}
            onChange={(e) => handleConfigUpdate({ value: e.target.value })}
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Data to store or reference"
          />
        </div>
      )}
    </div>
  );

  const renderIntegrationConfig = (config: IntegrationNodeConfig) => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Endpoint
        </label>
        <input
          type="text"
          value={config.endpoint || ''}
          onChange={(e) => handleConfigUpdate({ endpoint: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="/api/endpoint"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Method
        </label>
        <select
          value={config.method || 'GET'}
          onChange={(e) => handleConfigUpdate({ method: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Headers (JSON)
        </label>
        <textarea
          value={JSON.stringify(config.headers || {}, null, 2)}
          onChange={(e) => {
            try {
              const headers = JSON.parse(e.target.value);
              handleConfigUpdate({ headers });
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder='{"Content-Type": "application/json"}'
        />
      </div>

      {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Body (JSON)
          </label>
          <textarea
            value={JSON.stringify(config.body || {}, null, 2)}
            onChange={(e) => {
              try {
                const body = JSON.parse(e.target.value);
                handleConfigUpdate({ body });
              } catch (error) {
                // Invalid JSON, don't update
              }
            }}
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder='{"key": "value"}'
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Response Mapping (JSON)
        </label>
        <textarea
          value={JSON.stringify(config.responseMapping || {}, null, 2)}
          onChange={(e) => {
            try {
              const responseMapping = JSON.parse(e.target.value);
              handleConfigUpdate({ responseMapping });
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder='{"output_field": "response.data.field"}'
        />
        <p className="text-xs text-gray-500 mt-1">
          Map response fields to output variables
        </p>
      </div>
    </div>
  );

  const renderConfig = () => {
    switch (node.type) {
      case 'prompt':
        return renderPromptConfig(node.data.config as PromptNodeConfig);
      case 'tool':
        return renderToolConfig(node.data.config as ToolNodeConfig);
      case 'logic':
        return renderLogicConfig(node.data.config as LogicNodeConfig);
      case 'memory':
        return renderMemoryConfig(node.data.config as MemoryNodeConfig);
      case 'integration':
        return renderIntegrationConfig(node.data.config as IntegrationNodeConfig);
      default:
        return <div>Unknown node type</div>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Block Properties</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block Name
            </label>
            <input
              type="text"
              value={node.data.label}
              onChange={(e) => handleLabelUpdate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter block name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={node.data.description || ''}
              onChange={(e) => handleDescriptionUpdate(e.target.value)}
              className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter block description"
            />
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Configuration</h3>
        {renderConfig()}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        {hasChanges && (
          <div className="flex items-center space-x-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Changes saved automatically</span>
          </div>
        )}

        {node.data.errors && node.data.errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                {node.data.errors[0]}
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={handleDelete}
          className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Block</span>
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;