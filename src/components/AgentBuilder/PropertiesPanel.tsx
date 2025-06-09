import React from 'react';
import { 
  MessageSquare, 
  Puzzle, 
  GitBranch, 
  Database,
  Trash2,
  X,
  Settings
} from 'lucide-react';
import { AgentBlock } from '../../types';

interface PropertiesPanelProps {
  block: AgentBlock;
  onUpdate: (updates: Partial<AgentBlock>) => void;
  onDelete: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, onUpdate, onDelete }) => {
  const blockIcons = {
    prompt: MessageSquare,
    tool: Puzzle,
    logic: GitBranch,
    memory: Database
  };

  const blockColors = {
    prompt: 'from-blue-500 to-blue-600',
    tool: 'from-green-500 to-green-600',
    logic: 'from-purple-500 to-purple-600',
    memory: 'from-orange-500 to-orange-600'
  };

  const Icon = blockIcons[block.type];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-10 h-10 bg-gradient-to-r ${blockColors[block.type]} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">{block.type} Block</h3>
            <p className="text-sm text-gray-500">Configure block settings</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {block.type === 'prompt' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Instruction
              </label>
              <textarea
                value={block.data.instruction || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, instruction: e.target.value } })}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter your AI instruction here..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what you want the AI to do with the input data
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                value={block.data.model || 'gpt-4'}
                onChange={(e) => onUpdate({ data: { ...block.data, model: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variables
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Add variable (e.g., {{customer_name}})"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">
                  Variables will be replaced with actual values during execution
                </p>
              </div>
            </div>
          </div>
        )}

        {block.type === 'tool' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <select
                value={block.data.service || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, service: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a service...</option>
                <option value="slack">Slack</option>
                <option value="notion">Notion</option>
                <option value="salesforce">Salesforce</option>
                <option value="airtable">Airtable</option>
                <option value="gmail">Gmail</option>
                <option value="calendar">Google Calendar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={block.data.action || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, action: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an action...</option>
                <option value="send_message">Send Message</option>
                <option value="create_page">Create Page</option>
                <option value="update_record">Update Record</option>
                <option value="get_data">Get Data</option>
                <option value="search">Search</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parameters
              </label>
              <textarea
                value={JSON.stringify(block.data.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const params = JSON.parse(e.target.value);
                    onUpdate({ data: { ...block.data, parameters: params } });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder='{"key": "value"}'
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON format for action parameters
              </p>
            </div>
          </div>
        )}

        {block.type === 'logic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <input
                type="text"
                value={block.data.condition || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, condition: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., status == 'urgent'"
              />
              <p className="text-xs text-gray-500 mt-1">
                Define the condition for branching logic
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Type
              </label>
              <select
                value={block.data.branchType || 'if-else'}
                onChange={(e) => onUpdate({ data: { ...block.data, branchType: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="if-else">If/Else</option>
                <option value="switch">Switch</option>
                <option value="filter">Filter</option>
              </select>
            </div>
          </div>
        )}

        {block.type === 'memory' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation
              </label>
              <select
                value={block.data.operation || 'store'}
                onChange={(e) => onUpdate({ data: { ...block.data, operation: e.target.value } })}
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
                value={block.data.key || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, key: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., customer_data"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <textarea
                value={block.data.value || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, value: e.target.value } })}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Data to store or reference"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <button 
          onClick={onDelete}
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