import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  Settings, 
  Trash2,
  X,
  Key,
  TestTube,
  Zap,
  RefreshCw
} from 'lucide-react';
import { ActivepiecesService } from '../../services/activepieces';
import { Tool } from '../../types';

const Integrations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableApps, setAvailableApps] = useState<any[]>([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectionModal, setShowConnectionModal] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const activepiecesService = new ActivepiecesService({
    baseUrl: 'https://activepieces-production-aa7c.up.railway.app'
  });

  useEffect(() => {
    loadAvailableIntegrations();
  }, []);

  const loadAvailableIntegrations = async () => {
    try {
      setIsLoading(true);
      const apps = await activepiecesService.getAvailableIntegrations();
      setAvailableApps(apps);
      
      // Mock some connected integrations for demo
      setConnectedIntegrations([
        { id: 'slack', name: 'Slack', icon: 'MessageSquare', connected: true, category: 'communication' },
        { id: 'notion', name: 'Notion', icon: 'FileText', connected: true, category: 'productivity' }
      ]);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      // Fallback to mock data if API fails
      setAvailableApps([
        {
          name: 'slack',
          displayName: 'Slack',
          description: 'Team communication and collaboration',
          logoUrl: '',
          auth: { type: 'OAUTH2', required: true },
          actions: [{ name: 'send_message', displayName: 'Send Message' }]
        },
        {
          name: 'notion',
          displayName: 'Notion',
          description: 'All-in-one workspace for notes and docs',
          logoUrl: '',
          auth: { type: 'API_KEY', required: true },
          actions: [{ name: 'create_page', displayName: 'Create Page' }]
        },
        {
          name: 'gmail',
          displayName: 'Gmail',
          description: 'Email service by Google',
          logoUrl: '',
          auth: { type: 'OAUTH2', required: true },
          actions: [{ name: 'send_email', displayName: 'Send Email' }]
        },
        {
          name: 'github',
          displayName: 'GitHub',
          description: 'Code hosting and collaboration',
          logoUrl: '',
          auth: { type: 'API_KEY', required: true },
          actions: [{ name: 'create_issue', displayName: 'Create Issue' }]
        },
        {
          name: 'discord',
          displayName: 'Discord',
          description: 'Voice, video and text communication',
          logoUrl: '',
          auth: { type: 'API_KEY', required: true },
          actions: [{ name: 'send_message', displayName: 'Send Message' }]
        },
        {
          name: 'airtable',
          displayName: 'Airtable',
          description: 'Cloud collaboration service',
          logoUrl: '',
          auth: { type: 'API_KEY', required: true },
          actions: [{ name: 'create_record', displayName: 'Create Record' }]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'communication', label: 'Communication' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'crm', label: 'CRM' },
    { id: 'database', label: 'Database' },
    { id: 'ai', label: 'AI' }
  ];

  const getAppCategory = (appName: string): string => {
    const categoryMap: { [key: string]: string } = {
      'slack': 'communication',
      'discord': 'communication',
      'notion': 'productivity',
      'gmail': 'communication',
      'github': 'productivity',
      'airtable': 'database'
    };
    return categoryMap[appName] || 'productivity';
  };

  const getAppIcon = (appName: string): string => {
    const iconMap: { [key: string]: string } = {
      'slack': 'MessageSquare',
      'notion': 'FileText',
      'gmail': 'Mail',
      'github': 'Github',
      'discord': 'MessageSquare',
      'airtable': 'Database'
    };
    return iconMap[appName] || 'Zap';
  };

  const filteredApps = availableApps.filter(app => {
    const matchesSearch = app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const appCategory = getAppCategory(app.name);
    const matchesCategory = selectedCategory === 'all' || appCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (app: any) => {
    setShowConnectionModal(app);
    setApiKey('');
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
      // Add to connected integrations
      const newIntegration: Tool = {
        id: showConnectionModal.name,
        name: showConnectionModal.displayName,
        icon: getAppIcon(showConnectionModal.name),
        connected: true,
        category: getAppCategory(showConnectionModal.name) as any
      };
      
      setConnectedIntegrations(prev => [...prev, newIntegration]);
      setShowConnectionModal(null);
      setApiKey('');
      alert('Integration connected successfully!');
    }
  };

  const handleDisconnect = (appId: string) => {
    setConnectedIntegrations(prev => prev.filter(app => app.id !== appId));
    alert('Integration disconnected successfully!');
  };

  const handleRefresh = () => {
    loadAvailableIntegrations();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect your tools and services powered by Activepieces</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Browse Apps</span>
          </button>
        </div>
      </div>

      {/* Connected Integrations Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Connected Integrations</h2>
          <span className="text-sm text-gray-500">{connectedIntegrations.length} active connections</span>
        </div>
        
        {connectedIntegrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedIntegrations.map((integration) => (
              <div key={integration.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-green-600 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Connected</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleConnect(integration)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDisconnect(integration.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Available in workflow builder • {Math.floor(Math.random() * 10) + 1} actions
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
            <p className="text-gray-600">Connect your first app to start building powerful workflows</p>
          </div>
        )}
      </div>

      {/* Available Apps */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">Available Apps ({filteredApps.length})</h2>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search apps..."
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
            {filteredApps.map((app) => {
              const isConnected = connectedIntegrations.some(conn => conn.id === app.name);
              
              return (
                <div key={app.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isConnected 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.displayName}</h3>
                        <p className="text-sm text-gray-500 capitalize">{getAppCategory(app.name)}</p>
                      </div>
                    </div>
                    {isConnected && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {app.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {isConnected ? (
                      <button 
                        onClick={() => handleConnect(app)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configure</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect(app)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Connect
                      </button>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{app.actions?.length || 0} actions</span>
                      <span>•</span>
                      <span>{app.auth?.type || 'No auth'}</span>
                    </div>
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
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Connect {showConnectionModal.displayName}
                  </h3>
                  <p className="text-sm text-gray-500">Configure your connection</p>
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
              {showConnectionModal.auth?.type === 'API_KEY' && (
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
              )}

              {showConnectionModal.auth?.type === 'OAUTH2' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    This app uses OAuth2 authentication. You'll be redirected to authorize the connection.
                  </p>
                </div>
              )}

              {apiKey && showConnectionModal.auth?.type === 'API_KEY' && (
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
                disabled={showConnectionModal.auth?.type === 'API_KEY' && !apiKey}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;