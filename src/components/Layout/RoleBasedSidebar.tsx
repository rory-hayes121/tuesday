import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Puzzle, 
  BookOpen, 
  Users, 
  Settings,
  Plus,
  Zap,
  Home,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RoleBasedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const RoleBasedSidebar: React.FC<RoleBasedSidebarProps> = ({ activeSection, onSectionChange }) => {
  const { user, workspace, permissions } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, permission: null },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
    { id: 'agents', label: 'Agents', icon: Bot, permission: null },
    { id: 'templates', label: 'Templates', icon: BookOpen, permission: null },
    { id: 'integrations', label: 'Integrations', icon: Puzzle, permission: 'canManageIntegrations' as const },
    { id: 'team', label: 'Team', icon: Users, permission: 'canManageTeam' as const },
    { id: 'billing', label: 'Billing', icon: CreditCard, permission: 'canViewBilling' as const },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'canManageWorkspace' as const },
  ];

  const visibleNavItems = navItems.filter(item => 
    !item.permission || permissions[item.permission]
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AgentFlow</h1>
            <p className="text-xs text-gray-500">{workspace?.name}</p>
          </div>
        </div>
      </div>

      {/* Create Agent Button */}
      {permissions.canCreateAgents && (
        <div className="p-4">
          <button 
            onClick={() => onSectionChange('builder')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-3 flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Create Agent</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                user?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedSidebar;