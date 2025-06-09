import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  Settings, 
  Trash2,
  Slack,
  MessageSquare,
  Database,
  FileText,
  Users,
  ShoppingCart,
  Mail,
  Calendar,
  Zap,
  X,
  Key,
  TestTube
} from 'lucide-react';
import { Tool } from '../../types';

const Integrations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConnectionModal, setShowConnectionModal] = useState<Tool | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'communication', label: 'Communication' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'crm', label: 'CRM' },
    { id: 'database', label: 'Database' },
    { id: 'ai', label: 'AI' }
  ];

  const [availableTools, setAvailableTools] = useState<Tool[]>([
    { id: 'slack', name: 'Slack', icon: 'Slack', connected: true, category: 'communication' },
    { id: 'notion', name: 'Notion', icon: 'FileText', connected: true, category: 'productivity' },
    { id: 'salesforce', name: 'Salesforce', icon: 'Users', connected: false, category: 'crm' },
    { id: 'airtable', name: 'Airtable', icon: 'Database', connected: true, category: 'database' },
    { id: 'discord', name: 'Discord', icon: 'MessageSquare', connected: false, category: 'communication' },
    { id: 'gmail', name: 'Gmail', icon: 'Mail', connected: false, category: 'communication' },
    { id: 'calendar', name: 'Google Calendar', icon: 'Calendar', connected: false, category: 'productivity' },
    { id: 'shopify', name: 'Shopify', icon: 'ShoppingCart', connected: false, category: 'crm' },
  ]);

  const connectedTools = availableTools.filter(tool => tool.connected);

  const getIcon = (iconName: string) => {
    const iconMap = {
      Slack: Slack,
      FileText: FileText,
      Users: Users,
      Database: Database,
      MessageSquare: MessageSquare,
      Mail: Mail,
      Calendar: Calendar,
      ShoppingCart: ShoppingCart,
    };
    return iconMap[iconName as keyof typeof iconMap] || Zap;
  };

  const filteredTools = availableTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (tool: Tool) => {
    setShowConnectionModal(tool);
    setApiKey('');
    setApiSecret('');
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTestingConnection(false);
    alert('Connection test successful!');
  };

  const handleSaveConnection = () => {
    if (showConnectionModal && apiKey) {
      // Update the tool's connection status
      setAvailableTools(tools => 
        tools.map(tool => 
          tool.id === showConnectionModal.id 
            ? { ...tool, connected: true }
            : tool
        )
      );
      setShowConnectionModal(null);
      setApiKey('');
      setApiSecret('');
      alert('Integration connected successfully!');
    }
  };

  const handleDisconnect = (toolId: string) => {
    setAvailableTools(tools => 
      tools.map(tool => 
        tool.id === toolId 
          ? { ...tool, connected: false }
          : tool
      )
    );
    alert('Integration disconnected successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect your tools and services to power your AI agents</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Integration</span>
        </button>
      </div>

      {/* Connected Tools Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Connected Tools</h2>
          <span className="text-sm text-gray-500">{connectedTools.length} active connections</span>
        </div>
        
        {connectedTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedTools.map((tool) => {
              const Icon = getIcon(tool.icon);
              return (
                <div key={tool.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{tool.name}</h3>
                        <p className="text-sm text-green-600 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Connected</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => handleConnect(tool)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDisconnect(tool.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last used: 2 hours ago • 45 API calls this month
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
            <p className="text-gray-600">Connect your first tool to start building powerful AI agents</p>
          </div>
        )}
      </div>

      {/* Available Integrations */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">Available Integrations</h2>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const Icon = getIcon(tool.icon);
              return (
                <div key={tool.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        tool.connected 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{tool.category}</p>
                      </div>
                    </div>
                    {tool.connected && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Connect {tool.name} to automate workflows and enhance your AI agents with powerful integrations.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {tool.connected ? (
                      <button 
                        onClick={() => handleConnect(tool)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configure</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect(tool)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Connect
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  {React.createElement(getIcon(showConnectionModal.icon), { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showConnectionModal.connected ? 'Configure' : 'Connect'} {showConnectionModal.name}
                  </h3>
                  <p className="text-sm text-gray-500">Enter your API credentials</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConnectionModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret (Optional)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your API secret"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {apiKey && (
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowConnectionModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveConnection}
                disabled={!apiKey}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {showConnectionModal.connected ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;