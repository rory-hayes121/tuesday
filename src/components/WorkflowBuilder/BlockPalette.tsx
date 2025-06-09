import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Puzzle, 
  GitBranch, 
  Database,
  Zap,
  Filter,
  X,
  Plus
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { BlockTemplate } from '../../types/workflow';
import { useAuth } from '../../hooks/useAuth';
import { ActivepiecesService } from '../../services/activepieces';

interface BlockPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const BlockPalette: React.FC<BlockPaletteProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [integrations, setIntegrations] = useState<any[]>([]);
  
  const { blockTemplates, setBlockTemplates } = useWorkflowStore();
  const { workspace } = useAuth();

  // Load integrations and build block templates
  useEffect(() => {
    loadIntegrations();
    initializeBlockTemplates();
  }, [workspace?.id]);

  const getActivepiecesService = () => {
    const baseUrl = import.meta.env.VITE_ACTIVEPIECES_URL || 'https://demo.activepieces.com';
    return new ActivepiecesService({ baseUrl });
  };

  const loadIntegrations = async () => {
    try {
      const activepiecesService = getActivepiecesService();
      const apps = await activepiecesService.getAvailableIntegrations();
      setIntegrations(apps || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      // Use fallback integrations
      setIntegrations([
        { name: 'slack', displayName: 'Slack' },
        { name: 'notion', displayName: 'Notion' },
        { name: 'gmail', displayName: 'Gmail' },
        { name: 'github', displayName: 'GitHub' }
      ]);
    }
  };

  const initializeBlockTemplates = () => {
    const coreTemplates: BlockTemplate[] = [
      {
        id: 'prompt-basic',
        type: 'prompt',
        label: 'AI Prompt',
        description: 'Send instructions to AI models',
        icon: 'MessageSquare',
        category: 'core',
        color: 'from-blue-500 to-blue-600',
        defaultConfig: {
          instruction: 'Enter your AI instruction here...',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          variables: []
        },
        defaultHandles: {
          inputs: [
            {
              id: 'input',
              type: 'target',
              position: 'left',
              label: 'Input',
              dataType: 'any',
              required: false
            }
          ],
          outputs: [
            {
              id: 'output',
              type: 'source',
              position: 'right',
              label: 'Response',
              dataType: 'text',
              required: false
            }
          ]
        }
      },
      {
        id: 'tool-http',
        type: 'tool',
        label: 'HTTP Request',
        description: 'Make HTTP API calls',
        icon: 'Puzzle',
        category: 'core',
        color: 'from-green-500 to-green-600',
        defaultConfig: {
          service: 'http',
          action: 'request',
          parameters: {
            method: 'GET',
            url: '',
            headers: {},
            body: null
          }
        },
        defaultHandles: {
          inputs: [
            {
              id: 'input',
              type: 'target',
              position: 'left',
              label: 'Input',
              dataType: 'any',
              required: false
            }
          ],
          outputs: [
            {
              id: 'output',
              type: 'source',
              position: 'right',
              label: 'Response',
              dataType: 'object',
              required: false
            }
          ]
        }
      },
      {
        id: 'logic-if-else',
        type: 'logic',
        label: 'If/Else',
        description: 'Conditional branching logic',
        icon: 'GitBranch',
        category: 'logic',
        color: 'from-purple-500 to-purple-600',
        defaultConfig: {
          type: 'if-else',
          condition: '',
          branches: [
            { condition: 'true', label: 'True' },
            { condition: 'false', label: 'False' }
          ]
        },
        defaultHandles: {
          inputs: [
            {
              id: 'input',
              type: 'target',
              position: 'left',
              label: 'Input',
              dataType: 'any',
              required: true
            }
          ],
          outputs: [
            {
              id: 'true',
              type: 'source',
              position: 'right',
              label: 'True',
              dataType: 'any',
              required: false
            },
            {
              id: 'false',
              type: 'source',
              position: 'right',
              label: 'False',
              dataType: 'any',
              required: false
            }
          ]
        }
      },
      {
        id: 'logic-filter',
        type: 'logic',
        label: 'Filter',
        description: 'Filter data based on conditions',
        icon: 'Filter',
        category: 'logic',
        color: 'from-purple-500 to-purple-600',
        defaultConfig: {
          type: 'filter',
          condition: '',
          branches: []
        },
        defaultHandles: {
          inputs: [
            {
              id: 'input',
              type: 'target',
              position: 'left',
              label: 'Input',
              dataType: 'array',
              required: true
            }
          ],
          outputs: [
            {
              id: 'output',
              type: 'source',
              position: 'right',
              label: 'Filtered',
              dataType: 'array',
              required: false
            }
          ]
        }
      },
      {
        id: 'memory-store',
        type: 'memory',
        label: 'Store Data',
        description: 'Store data in memory',
        icon: 'Database',
        category: 'data',
        color: 'from-orange-500 to-orange-600',
        defaultConfig: {
          operation: 'store',
          key: '',
          value: '',
          scope: 'session'
        },
        defaultHandles: {
          inputs: [
            {
              id: 'input',
              type: 'target',
              position: 'left',
              label: 'Data',
              dataType: 'any',
              required: true
            }
          ],
          outputs: [
            {
              id: 'output',
              type: 'source',
              position: 'right',
              label: 'Stored',
              dataType: 'any',
              required: false
            }
          ]
        }
      },
      {
        id: 'memory-retrieve',
        type: 'memory',
        label: 'Retrieve Data',
        description: 'Retrieve data from memory',
        icon: 'Database',
        category: 'data',
        color: 'from-orange-500 to-orange-600',
        defaultConfig: {
          operation: 'retrieve',
          key: '',
          scope: 'session'
        },
        defaultHandles: {
          inputs: [],
          outputs: [
            {
              id: 'output',
              type: 'source',
              position: 'right',
              label: 'Data',
              dataType: 'any',
              required: false
            }
          ]
        }
      }
    ];

    // Add integration templates from Activepieces
    const integrationTemplates: BlockTemplate[] = integrations.map(integration => ({
      id: `integration-${integration.name}`,
      type: 'integration',
      label: integration.displayName,
      description: `${integration.displayName} integration via Activepieces`,
      icon: 'Zap',
      category: 'integrations',
      color: 'from-red-500 to-red-600',
      integrationId: integration.name,
      defaultConfig: {
        integrationId: integration.name,
        endpoint: '',
        method: 'GET',
        headers: {},
        body: null,
        responseMapping: {}
      },
      defaultHandles: {
        inputs: [
          {
            id: 'input',
            type: 'target',
            position: 'left',
            label: 'Input',
            dataType: 'any',
            required: false
          }
        ],
        outputs: [
          {
            id: 'output',
            type: 'source',
            position: 'right',
            label: 'Response',
            dataType: 'object',
            required: false
          }
        ]
      }
    }));

    setBlockTemplates([...coreTemplates, ...integrationTemplates]);
  };

  const categories = [
    { id: 'all', label: 'All Blocks', icon: Plus },
    { id: 'core', label: 'Core', icon: Puzzle },
    { id: 'logic', label: 'Logic', icon: GitBranch },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Zap }
  ];

  const filteredTemplates = blockTemplates.filter(template => {
    const matchesSearch = template.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      MessageSquare,
      Puzzle,
      GitBranch,
      Database,
      Zap,
      Filter
    };
    return iconMap[iconName] || Puzzle;
  };

  const handleDragStart = (event: React.DragEvent, template: BlockTemplate) => {
    event.dataTransfer.setData('application/reactflow', template.type);
    event.dataTransfer.setData('application/nodedata', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Block Palette</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredTemplates.map(template => {
            const Icon = getIcon(template.icon);
            return (
              <div
                key={template.id}
                draggable
                onDragStart={(e) => handleDragStart(e, template)}
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">{template.label}</h4>
                    <p className="text-xs text-gray-600 truncate">{template.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks found</h3>
            <p className="text-gray-600">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 border-t border-gray-200 bg-blue-50">
        <p className="text-xs text-blue-700">
          💡 Drag blocks onto the canvas to build your workflow. Powered by Activepieces.
        </p>
      </div>
    </div>
  );
};

export default BlockPalette;