import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Save, 
  Play, 
  Settings, 
  ArrowLeft,
  Zap,
  Eye,
  RotateCcw,
  Undo,
  Redo,
  Upload
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import WorkflowCanvas from '../WorkflowBuilder/WorkflowCanvas';
import BlockPalette from '../WorkflowBuilder/BlockPalette';
import PropertiesPanel from '../WorkflowBuilder/PropertiesPanel';
import WorkflowToolbar from '../WorkflowBuilder/WorkflowToolbar';
import TestRunner from '../WorkflowBuilder/TestRunner';
import WorkflowPreview from '../WorkflowBuilder/WorkflowPreview';
import ActivepiecesDeployment from '../WorkflowBuilder/ActivepiecesDeployment';

interface AgentBuilderProps {
  agentId?: string | null;
  onSave: (workflow: any) => void;
  onTest: () => void;
}

const AgentBuilder: React.FC<AgentBuilderProps> = ({ agentId, onSave, onTest }) => {
  const [agentName, setAgentName] = useState('Untitled Agent');
  const [agentDescription, setAgentDescription] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showActivepiecesDeploy, setShowActivepiecesDeploy] = useState(false);

  const { user, workspace } = useAuth();
  const { 
    nodes, 
    edges, 
    validationResult,
    validateWorkflow,
    clearSelection,
    setNodes,
    setEdges
  } = useWorkflowStore();

  // Load existing agent if editing
  useEffect(() => {
    if (agentId) {
      loadAgent();
    } else {
      // Clear the workflow for new agent
      setNodes([]);
      setEdges([]);
      setAgentName('Untitled Agent');
      setAgentDescription('');
    }
  }, [agentId]);

  const loadAgent = async () => {
    if (!agentId) return;

    try {
      setIsLoading(true);
      
      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('Failed to load agent:', error);
        return;
      }

      if (agent) {
        setAgentName(agent.name);
        setAgentDescription(agent.description || '');
        
        // Load the workflow blocks
        if (agent.blocks && agent.blocks.nodes) {
          setNodes(agent.blocks.nodes);
          setEdges(agent.blocks.edges || []);
        }
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!workspace?.id || !user?.id) return;

    setIsSaving(true);
    try {
      const workflow = {
        name: agentName,
        description: agentDescription,
        nodes,
        edges,
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const agentData = {
        name: agentName,
        description: agentDescription,
        workspace_id: workspace.id,
        created_by: user.id,
        blocks: { nodes, edges },
        status: 'draft',
        updated_at: new Date().toISOString()
      };

      if (agentId) {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update(agentData)
          .eq('id', agentId);

        if (error) {
          throw error;
        }
      } else {
        // Create new agent
        const { data, error } = await supabase
          .from('agents')
          .insert(agentData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update the workflow with the new agent ID
        workflow.id = data.id;
      }

      onSave(workflow);
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('Failed to save agent. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [agentId, agentName, agentDescription, nodes, edges, workspace, user, onSave]);

  const handleTest = useCallback(async () => {
    // Validate workflow before testing
    const validation = validateWorkflow();
    if (!validation.isValid) {
      alert('Please fix validation errors before testing');
      return;
    }

    setShowTestRunner(true);
  }, [validateWorkflow]);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleActivepiecesDeploy = useCallback(() => {
    // Validate workflow before deployment
    const validation = validateWorkflow();
    if (!validation.isValid) {
      alert('Please fix validation errors before deploying');
      return;
    }

    if (!agentId) {
      alert('Please save the agent before deploying');
      return;
    }

    setShowActivepiecesDeploy(true);
  }, [validateWorkflow, agentId]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleCanvasClick = useCallback(() => {
    clearSelection();
    setSelectedNodeId(null);
  }, [clearSelection]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1"
                placeholder="Enter agent name..."
              />
              <span className="text-gray-300">|</span>
              <input
                type="text"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                className="text-gray-600 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1"
                placeholder="Add description..."
              />
            </div>
          </div>
          
          {/* Deploy to Activepieces Button (only show for saved agents) */}
          {agentId && (
            <button
              onClick={handleActivepiecesDeploy}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Deploy to Activepieces</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <WorkflowToolbar
        onSave={handleSave}
        onTest={handleTest}
        onPreview={handlePreview}
        isTestMode={isTestMode}
        isSaving={isSaving}
      />

      <div className="flex-1 flex relative">
        {/* Block Palette */}
        <BlockPalette 
          isOpen={showPalette}
          onClose={() => setShowPalette(false)}
        />

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas
            onNodeSelect={handleNodeSelect}
            onCanvasClick={handleCanvasClick}
          />

          {/* Add Block Button */}
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`absolute bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center z-10 ${
              showPalette ? 'rotate-45' : ''
            }`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Properties Panel */}
        {selectedNodeId && (
          <PropertiesPanel
            nodeId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Modals */}
      <TestRunner
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
      />

      <WorkflowPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />

      <ActivepiecesDeployment
        isOpen={showActivepiecesDeploy}
        onClose={() => setShowActivepiecesDeploy(false)}
        agentId={agentId || 'new'}
        agentName={agentName}
      />
    </div>
  );
};

export default AgentBuilder;