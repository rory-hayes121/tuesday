import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  Shield, 
  CreditCard, 
  Bell,
  Save,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const WorkspaceSettings: React.FC = () => {
  const { workspace, user } = useAuth();
  const [settings, setSettings] = useState({
    workspaceName: workspace?.name || '',
    allowEmployeeInvites: workspace?.settings?.allowEmployeeInvites || false,
    defaultRole: workspace?.settings?.defaultRole || 'employee',
    integrationPolicy: workspace?.settings?.integrationPolicy || 'admin_only',
    agentVisibility: workspace?.settings?.agentVisibility || 'workspace'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // API call to update workspace settings
      await fetch(`/api/workspaces/${workspace?.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(settings)
      });
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-gray-600 mt-1">Manage your workspace configuration and policies</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">General</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={settings.workspaceName}
              onChange={(e) => setSettings(prev => ({ ...prev, workspaceName: e.target.value }))}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace URL
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">agentflow.com/</span>
              <input
                type="text"
                value={workspace?.slug || ''}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Contact support to change your workspace URL</p>
          </div>
        </div>
      </div>

      {/* Team Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Allow employee invitations</h3>
              <p className="text-sm text-gray-600">Let employees invite new team members</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowEmployeeInvites}
                onChange={(e) => setSettings(prev => ({ ...prev, allowEmployeeInvites: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default role for new members
            </label>
            <select
              value={settings.defaultRole}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultRole: e.target.value as 'admin' | 'employee' }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security & Permissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Security & Permissions</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Integration Management
            </label>
            <select
              value={settings.integrationPolicy}
              onChange={(e) => setSettings(prev => ({ ...prev, integrationPolicy: e.target.value as 'admin_only' | 'shared' }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="admin_only">Admin only</option>
              <option value="shared">Shared management</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Control who can manage workspace integrations
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Visibility
            </label>
            <select
              value={settings.agentVisibility}
              onChange={(e) => setSettings(prev => ({ ...prev, agentVisibility: e.target.value as 'workspace' | 'creator_only' }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="workspace">Workspace-wide</option>
              <option value="creator_only">Creator only</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Control who can see and edit agents
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-medium text-red-900">Delete Workspace</h3>
              <p className="text-sm text-red-700">
                Permanently delete this workspace and all its data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDangerZone(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;