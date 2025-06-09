import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Puzzle, 
  GitBranch, 
  Database,
  Zap,
  X,
  Sparkles,
  Code,
  Filter,
  Plus
} from 'lucide-react';
// import { ActivepiecesService } from '../../services/activepieces';
import { BlockTemplate } from '../../types/workflow';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (template: BlockTemplate) => void;
  position: { x: number; y: number } | null;
}

const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
  onAddNode,
  position
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [blockTemplates, setBlockTemplates] = useState<BlockTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIntegrations();
      initializeBlockTemplates();
    }
  }, [isOpen]);

  // const getActivepiecesService = () => {
  //   const baseUrl = import.meta.env.VITE_ACTIVEPIECES_URL || 'https://demo.activepieces.com';
  //   return new ActivepiecesService({ baseUrl });
  // };

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      // TODO: Re-enable when ActivepiecesService is fixed
      // const activepiecesService = getActivepiecesService();
      // const apps = await activepiecesService.getAvailableIntegrations();
      // setIntegrations(apps || []);
      
      // Use fallback integrations for now
      setIntegrations([
        { name: 'slack', displayName: 'Slack', description: 'Team communication' },
        { name: 'notion', displayName: 'Notion', description: 'All-in-one workspace' },
        { name: 'gmail', displayName: 'Gmail', description: 'Email service' },
        { name: 'github', displayName: 'GitHub', description: 'Code hosting' },
        { name: 'discord', displayName: 'Discord', description: 'Voice and text chat' },
        { name: 'airtable', displayName: 'Airtable', description: 'Cloud collaboration' }
      ]);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      // Use fallback integrations
      setIntegrations([
        { name: 'slack', displayName: 'Slack', description: 'Team communication' },
        { name: 'notion', displayName: 'Notion', description: 'All-in-one workspace' },
        { name: 'gmail', displayName: 'Gmail', description: 'Email service' },
        { name: 'github', displayName: 'GitHub', description: 'Code hosting' },
        { name: 'discord', displayName: 'Discord', description: 'Voice and text chat' },
        { name: 'airtable', displayName: 'Airtable', description: 'Cloud collaboration' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeBlockTemplates = () => {
    const coreTemplates: BlockTemplate[] = [
      {
        id: 'prompt-basic',
        type: 'prompt',
        label: 'AI Prompt',
        description: 'Send instructions to AI models like GPT-4',
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
        description: 'Make HTTP API calls to any service',
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
        description: 'Conditional branching based on data',
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
        description: 'Filter arrays based on conditions',
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
        description: 'Save data for later use in the workflow',
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
        description: 'Get previously stored data',
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
      description: integration.description || `${integration.displayName} integration`,
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
    { id: 'all', label: 'All', icon: Plus },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'core', label: 'Core', icon: Puzzle },
    { id: 'logic', label: 'Logic', icon: GitBranch },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'integrations', label: 'Apps', icon: Zap }
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
      Filter,
      Sparkles,
      Code
    };
    return iconMap[iconName] || Puzzle;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Step</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for apps and actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Categories Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4">
            <div className="space-y-1">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selectedCategory === category.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedCategory === 'integrations' && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Powered by Activepieces with 100+ integrations
                </p>
              </div>
            )}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No steps found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search or browse different categories
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => {
                  const Icon = getIcon(template.icon);
                  return (
                    <button
                      key={template.id}
                      onClick={() => onAddNode(template)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{template.label}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                          {template.category === 'integrations' && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                App
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNodeModal;