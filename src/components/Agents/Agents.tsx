import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bot, 
  Users, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Plus,
  Search,
  Filter,
  User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'inactive';
  created_by: string;
  creator_name?: string;
  last_run: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
  blocks: any;
}

interface AgentsProps {
  onCreateAgent: () => void;
  onEditAgent: (agentId: string) => void;
}

const Agents: React.FC<AgentsProps> = ({ onCreateAgent, onEditAgent }) => {
  const { user, workspace, permissions } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Only load agents if we have both workspace and user, and we're authenticated
    if (workspace?.id && user?.id) {
      loadAgents();
    }
  }, [workspace?.id, user?.id]);

  const loadAgents = async () => {
    if (!workspace?.id || !user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      let query = supabase
        .from('agents')
        .select(`
          *,
          creator:created_by (
            name
          )
        `)
        .eq('workspace_id', workspace.id);

      // If user is not admin, only show their own agents
      if (user.role !== 'admin') {
        query = query.eq('created_by', user.id);
      }

      const { data, error: agentsError } = await query.order('updated_at', { ascending: false });

      if (agentsError) {
        console.error('Failed to load agents:', agentsError);
        setError('Failed to load agents');
        return;
      }

      // Format the data to include creator name
      const formattedAgents = (data || []).map(agent => ({
        ...agent,
        creator_name: agent.creator?.name || 'Unknown'
      }));

      setAgents(formattedAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      setError('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agentId);

      if (error) {
        throw error;
      }

      // Update local state
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, status: newStatus as any } : agent
      ));
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
      setError('Failed to update agent status');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) {
        throw error;
      }

      // Update local state
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
    } catch (error) {
      console.error('Failed to delete agent:', error);
      setError('Failed to delete agent');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { 
      label: 'Total Agents', 
      value: agents.length, 
      icon: Bot, 
      change: `${agents.filter(a => a.status === 'active').length} active`, 
      color: 'blue' 
    },
    { 
      label: 'Total Runs', 
      value: agents.reduce((sum, agent) => sum + agent.run_count, 0), 
      icon: Activity, 
      change: 'This month', 
      color: 'green' 
    },
    { 
      label: 'My Agents', 
      value: agents.filter(a => a.created_by === user?.id).length, 
      icon: User, 
      change: 'Created by you', 
      color: 'purple' 
    },
    { 
      label: 'Draft Agents', 
      value: agents.filter(a => a.status === 'draft').length, 
      icon: Edit, 
      change: 'Need configuration', 
      color: 'orange' 
    },
  ];

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Show loading only when actually loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show message if we don't have workspace or user data yet
  if (!workspace?.id || !user?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading workspace...</h3>
          <p className="text-gray-600">Please wait while we load your workspace data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'admin' 
              ? 'Manage all workspace agents and monitor their performance'
              : 'Manage your AI agents and monitor their performance'
            }
          </p>
        </div>
        <button
          onClick={onCreateAgent}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Agent</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getStatColor(stat.color)} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAgents.length} agents
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {user?.role === 'admin' ? 'All Agents' : 'Your Agents'}
          </h2>
        </div>
        
        {filteredAgents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {agents.length === 0 ? 'No agents yet' : 'No agents found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {agents.length === 0 
                ? 'Create your first AI agent to get started with automation'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {agents.length === 0 && (
              <button
                onClick={onCreateAgent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Agent</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAgents.map((agent) => {
              const isOwner = agent.created_by === user?.id;
              const canEdit = isOwner || user?.role === 'admin';
              
              return (
                <div 
                  key={agent.id} 
                  onClick={() => onEditAgent(agent.id)}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                        {user?.role === 'admin' && !isOwner && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            by {agent.creator_name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {agent.description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {agent.last_run 
                              ? `Last run: ${formatTimeAgo(agent.last_run)}`
                              : 'Never run'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-4 h-4" />
                          <span>{agent.run_count} runs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Created {formatTimeAgo(agent.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(agent.id, agent.status);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title={agent.status === 'active' ? 'Pause agent' : 'Activate agent'}
                      >
                        {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      {canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAgent(agent.id);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit agent"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAgent(agent.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete agent"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;