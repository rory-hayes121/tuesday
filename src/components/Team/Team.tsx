import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  Clock, 
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Crown,
  Eye,
  Users,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar_url?: string;
  last_active: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  invited_by: string;
  inviter_name?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
}

const Team: React.FC = () => {
  const { user, workspace, permissions, connectionStatus } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'employee'>('employee');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);

  useEffect(() => {
    // Only load if we have workspace, user, and database connection
    if (workspace?.id && user?.id && connectionStatus === 'connected') {
      loadTeamData();
    }
  }, [workspace?.id, user?.id, connectionStatus]);

  const loadTeamData = async () => {
    if (!workspace?.id || !user?.id) {
      console.log('Missing workspace or user data');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Loading team data for workspace:', workspace.id);

      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: true });

      if (membersError) {
        console.error('Failed to load team members:', membersError);
        setError('Failed to load team members: ' + membersError.message);
        return;
      }

      console.log('Loaded team members:', members?.length || 0);
      setTeamMembers(members || []);

      // Load pending invitations (only if user is admin)
      if (permissions.canManageTeam) {
        const { data: invitations, error: invitationsError } = await supabase
          .from('invitations')
          .select(`
            *,
            inviter:invited_by (
              name
            )
          `)
          .eq('workspace_id', workspace.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (invitationsError) {
          console.error('Failed to load invitations:', invitationsError);
          // Don't fail the whole load for invitations
        } else {
          const formattedInvitations = (invitations || []).map(inv => ({
            ...inv,
            inviter_name: inv.inviter?.name || 'Unknown'
          }));
          setPendingInvites(formattedInvitations);
          console.log('Loaded pending invitations:', formattedInvitations.length);
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Failed to load team data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'employee': return Shield;
      default: return Shield;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'employee': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setError('');
    setSuccess('');

    try {
      // Check if user already exists in workspace
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('workspace_id', workspace!.id)
        .eq('email', inviteEmail.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        setError('User is already a member of this workspace');
        setIsInviting(false);
        return;
      }

      // Check if there's already a pending invitation
      const { data: existingInvite } = await supabase
        .from('invitations')
        .select('id')
        .eq('workspace_id', workspace!.id)
        .eq('email', inviteEmail.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        setError('An invitation has already been sent to this email');
        setIsInviting(false);
        return;
      }

      // Call the send-invitation Edge Function
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          workspaceId: workspace!.id,
          invitedBy: user!.id,
          workspaceName: workspace!.name,
          inviterName: user!.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const result = await response.json();
      console.log('Invitation sent successfully:', result);

      setSuccess('Invitation sent successfully!');
      setInviteEmail('');
      setInviteRole('employee');
      setShowInviteModal(false);
      
      // Reload team data to show the new pending invitation
      await loadTeamData();

    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      setError(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      setError('');
      setSuccess('');

      const invitation = pendingInvites.find(inv => inv.id === inviteId);
      if (!invitation) return;

      // Call the send-invitation Edge Function again
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: invitation.email,
          role: invitation.role,
          workspaceId: workspace!.id,
          invitedBy: user!.id,
          workspaceName: workspace!.name,
          inviterName: user!.name,
          resend: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.error || 'Failed to resend invitation');
      }

      setSuccess('Invitation resent successfully!');
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      setError(error.message || 'Failed to resend invitation');
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

      if (error) {
        throw error;
      }

      setSuccess('Invitation revoked successfully');
      await loadTeamData();
    } catch (error: any) {
      console.error('Failed to revoke invitation:', error);
      setError('Failed to revoke invitation');
    }
  };

  const handleEditMember = (memberId: string) => {
    // TODO: Implement member editing
    alert(`Edit member ${memberId} - Coming soon!`);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw error;
      }

      setSuccess('Team member removed successfully');
      await loadTeamData();
    } catch (error: any) {
      console.error('Failed to remove team member:', error);
      setError('Failed to remove team member');
    }
  };

  const getStatsModalData = (type: string) => {
    switch (type) {
      case 'total':
        return { title: 'All Team Members', members: teamMembers };
      case 'admins':
        return { title: 'Administrators', members: teamMembers.filter(m => m.role === 'admin') };
      case 'employees':
        return { title: 'Employees', members: teamMembers.filter(m => m.role === 'employee') };
      case 'pending':
        return { title: 'Pending Invites', invites: pendingInvites };
      default:
        return { title: '', members: [] };
    }
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
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading workspace...</h3>
          <p className="text-gray-600">Please wait while we load your workspace data</p>
        </div>
      </div>
    );
  }

  // Show connection error if database is not connected
  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Database Connection Error</h3>
          <p className="text-gray-600">Unable to connect to the database. Please check your configuration.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Total Members', 
      value: teamMembers.length, 
      icon: Users, 
      change: `${teamMembers.filter(m => m.role === 'admin').length} admins`, 
      color: 'blue',
      type: 'total'
    },
    { 
      label: 'Admins', 
      value: teamMembers.filter(m => m.role === 'admin').length, 
      icon: Crown, 
      change: 'Workspace administrators', 
      color: 'purple',
      type: 'admins'
    },
    { 
      label: 'Employees', 
      value: teamMembers.filter(m => m.role === 'employee').length, 
      icon: Shield, 
      change: 'Team members', 
      color: 'green',
      type: 'employees'
    },
    { 
      label: 'Pending Invites', 
      value: pendingInvites.length, 
      icon: Mail, 
      change: 'Awaiting acceptance', 
      color: 'orange',
      type: 'pending'
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage team members and their access permissions</p>
        </div>
        {permissions.canManageTeam && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div 
              key={index} 
              onClick={() => setShowStatsModal(stat.type)}
              className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getStatColor(stat.color)} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
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
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredMembers.length} members
          </div>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && permissions.canManageTeam && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Pending Invites</h2>
              <span className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                {pendingInvites.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited by {invite.inviter_name} • {formatTimeAgo(invite.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(invite.role)}`}>
                    {invite.role}
                  </span>
                  <button 
                    onClick={() => handleResendInvite(invite.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Resend
                  </button>
                  <button 
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            const initials = getInitials(member.name);
            const isCurrentUser = member.id === user?.id;
            
            return (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getAvatarColor(member.name)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold">{initials}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {member.name}
                          {isCurrentUser && <span className="text-sm text-gray-500 ml-1">(You)</span>}
                        </h3>
                        {member.role === 'admin' && (
                          <Crown className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <p className="text-gray-600">{member.email}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(member.role)}`}>
                          <RoleIcon className="w-3 h-3 inline mr-1" />
                          {member.role}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Last active: {formatTimeAgo(member.last_active)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {permissions.canManageTeam && !isCurrentUser && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditMember(member.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'employee')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleInviteMember}
                disabled={!inviteEmail.trim() || isInviting}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {isInviting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Invite</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {getStatsModalData(showStatsModal).title}
              </h3>
              <button 
                onClick={() => setShowStatsModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {showStatsModal === 'pending' ? (
                getStatsModalData(showStatsModal).invites?.map((invite: any) => (
                  <div key={invite.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-sm text-gray-500">Role: {invite.role}</p>
                    </div>
                  </div>
                ))
              ) : (
                getStatsModalData(showStatsModal).members?.map((member: TeamMember) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getAvatarColor(member.name)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold">{getInitials(member.name)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;