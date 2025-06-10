import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Zap, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { WorkflowNode } from '../../../types/workflow';
import { PieceMetadata, ActionMetadata, TriggerMetadata } from '../../../services/activepiecesCatalog';
import { WorkspaceConnection, workspaceConnectionService } from '../../../services/connections';
import IntegrationSelectionModal from '../IntegrationSelectionModal';

interface IntegrationNodeProps {
  data: WorkflowNode['data'] & {
    piece?: PieceMetadata;
    action?: ActionMetadata | TriggerMetadata;
    actionType?: 'action' | 'trigger';
    connection?: WorkspaceConnection;
    isConfigured?: boolean;
    status?: 'idle' | 'running' | 'success' | 'error';
  };
  id: string;
  selected?: boolean;
}

const IntegrationNode: React.FC<IntegrationNodeProps> = ({ data, id, selected }) => {
  const [showModal, setShowModal] = useState(false);
  const [availableConnections, setAvailableConnections] = useState<WorkspaceConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Mock workspace ID - in real app, get from context
  const workspaceId = 'default-workspace';

  // Load available connections when piece is selected
  useEffect(() => {
    if (data.piece) {
      loadConnections();
    }
  }, [data.piece]);

  const loadConnections = async () => {
    if (!data.piece) return;
    
    setLoadingConnections(true);
    try {
      const connections = await workspaceConnectionService.getConnectionsForPiece(
        workspaceId,
        data.piece.name
      );
      setAvailableConnections(connections);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleIntegrationSelect = (piece: PieceMetadata, action: ActionMetadata | TriggerMetadata, type: 'action' | 'trigger') => {
    // This would typically update the workflow store
    console.log('Selected integration:', { piece, action, type });
    
    // Update node data
    const updatedData = {
      ...data,
      piece,
      action,
      actionType: type,
      isConfigured: true,
      label: `${piece.displayName}: ${action.displayName}`
    };
    
    // In real implementation, update the workflow store
    console.log('Updated node data:', updatedData);
    setShowModal(false);
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getNodeColor = () => {
    if (data.status === 'error') return 'border-red-300 bg-red-50';
    if (data.status === 'success') return 'border-green-300 bg-green-50';
    if (data.status === 'running') return 'border-blue-300 bg-blue-50';
    if (selected) return 'border-blue-400 bg-blue-50';
    return 'border-gray-300 bg-white';
  };

  const isConfigured = data.isConfigured && data.piece && data.action;
  const needsConnection = data.piece?.auth?.required && !data.connection;

  return (
    <>
      <div 
        className={`
          min-w-[200px] rounded-lg border-2 shadow-sm transition-all duration-200
          ${getNodeColor()}
          ${selected ? 'shadow-lg scale-105' : 'hover:shadow-md'}
        `}
      >
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          className="w-3 h-3 border-2 border-gray-300 bg-white hover:border-blue-400 transition-colors"
        />

        {/* Node Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {data.piece?.logoUrl ? (
                <img 
                  src={data.piece.logoUrl} 
                  alt={data.piece.displayName}
                  className="w-6 h-6 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://img.icons8.com/color/48/000000/puzzle.png';
                  }}
                />
              ) : (
                <Zap className="w-5 h-5 text-gray-400" />
              )}
              
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {isConfigured ? data.piece!.displayName : 'Integration'}
                </h3>
                {data.action && (
                  <p className="text-xs text-gray-500 truncate">
                    {data.action.displayName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <button
                onClick={() => setShowModal(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Configure integration"
              >
                {isConfigured ? (
                  <Settings className="w-4 h-4 text-gray-400" />
                ) : (
                  <Plus className="w-4 h-4 text-blue-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Node Body */}
        <div className="p-3">
          {!isConfigured ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-2">
                Click + to add an integration
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Integration
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Action Type Badge */}
              <div className="flex items-center justify-between">
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${data.actionType === 'trigger' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                  }
                `}>
                  {data.actionType === 'trigger' ? 'Trigger' : 'Action'}
                </span>
                
                {data.piece?.auth?.required && (
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${data.connection 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  `}>
                    {data.connection ? 'Connected' : 'Needs Auth'}
                  </span>
                )}
              </div>

              {/* Connection Info */}
              {data.piece?.auth?.required && (
                <div className="text-xs text-gray-500">
                  {data.connection ? (
                    <span>Using: {data.connection.name}</span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Connection required</span>
                  )}
                </div>
              )}

              {/* Description */}
              {data.action?.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {data.action.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="w-3 h-3 border-2 border-gray-300 bg-white hover:border-blue-400 transition-colors"
        />

        {/* Validation Indicators */}
        {needsConnection && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <AlertCircle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Integration Selection Modal */}
      <IntegrationSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleIntegrationSelect}
        mode={data.actionType === 'trigger' ? 'trigger' : 'action'}
      />
    </>
  );
};

export default IntegrationNode;