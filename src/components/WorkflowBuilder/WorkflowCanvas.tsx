import React, { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnSelectionChangeParams,
  NodeChange,
  EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../../stores/workflowStore';
import { WorkflowNode, WorkflowEdge } from '../../types/workflow';
import PromptNode from './nodes/PromptNode';
import ToolNode from './nodes/ToolNode';
import LogicNode from './nodes/LogicNode';
import MemoryNode from './nodes/MemoryNode';
import IntegrationNode from './nodes/IntegrationNode';

// Custom node types
const nodeTypes = {
  prompt: PromptNode,
  tool: ToolNode,
  logic: LogicNode,
  memory: MemoryNode,
  integration: IntegrationNode,
};

interface WorkflowCanvasProps {
  onNodeSelect?: (nodeId: string | null) => void;
  onCanvasClick?: () => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  onNodeSelect,
  onCanvasClick
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodes,
    selectedEdges,
    viewport,
    isConnecting,
    connectionSource,
    addNode,
    updateNode,
    addEdge: addStoreEdge,
    deleteNode,
    deleteEdge,
    selectNode,
    selectEdge,
    clearSelection,
    setViewport,
    startConnection,
    endConnection,
    cancelConnection,
    snapToGrid,
    validateWorkflow,
    saveToHistory
  } = useWorkflowStore();

  // Use ReactFlow's built-in state management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync store state with ReactFlow state
  useEffect(() => {
    const reactFlowNodes: Node[] = storeNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: selectedNodes.includes(node.id),
      draggable: true,
      selectable: true,
      deletable: true
    }));

    const reactFlowEdges: Edge[] = storeEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type || 'smoothstep',
      animated: edge.animated || false,
      selected: selectedEdges.includes(edge.id),
      style: edge.style || { stroke: '#94a3b8', strokeWidth: 2 },
      deletable: true
    }));

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [storeNodes, storeEdges, selectedNodes, selectedEdges, setNodes, setEdges]);

  // Handle node changes from ReactFlow
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    // Handle specific changes that need store updates
    changes.forEach(change => {
      switch (change.type) {
        case 'position':
          if (change.position && change.dragging === false) {
            // Update store with final position and save to history
            const storeNode = storeNodes.find(n => n.id === change.id);
            if (storeNode) {
              const snappedPosition = snapToGrid(change.position);
              // Update the store node position
              updateNode(change.id, { position: snappedPosition });
              saveToHistory(`Move node ${change.id}`);
            }
          }
          break;
        case 'remove':
          deleteNode(change.id);
          saveToHistory(`Delete node ${change.id}`);
          break;
        case 'select':
          if (change.selected) {
            selectNode(change.id);
            onNodeSelect?.(change.id);
          }
          break;
      }
    });
  }, [onNodesChange, storeNodes, snapToGrid, saveToHistory, updateNode, deleteNode, selectNode, onNodeSelect]);

  // Handle edge changes from ReactFlow
  const handleEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    
    // Handle specific changes that need store updates
    changes.forEach(change => {
      switch (change.type) {
        case 'remove':
          deleteEdge(change.id);
          saveToHistory(`Delete edge ${change.id}`);
          break;
        case 'select':
          if (change.selected) {
            selectEdge(change.id);
          }
          break;
      }
    });
  }, [onEdgesChange, deleteEdge, selectEdge, saveToHistory]);

  // Handle new connections
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      const newEdge: WorkflowEdge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        type: 'smoothstep',
        animated: false
      };
      addStoreEdge(newEdge);
      saveToHistory('Add connection');
    }
  }, [addStoreEdge, saveToHistory]);

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0].id;
      selectNode(nodeId);
      onNodeSelect?.(nodeId);
    } else if (params.edges.length > 0) {
      selectEdge(params.edges[0].id);
      onNodeSelect?.(null);
    } else {
      clearSelection();
      onNodeSelect?.(null);
    }
  }, [selectNode, selectEdge, clearSelection, onNodeSelect]);

  // Handle canvas click
  const onPaneClick = useCallback(() => {
    clearSelection();
    onCanvasClick?.();
    onNodeSelect?.(null);
    
    if (isConnecting) {
      cancelConnection();
    }
  }, [clearSelection, onCanvasClick, onNodeSelect, isConnecting, cancelConnection]);

  // Handle drop from palette
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !reactFlowInstance) return;

    const type = event.dataTransfer.getData('application/reactflow');
    const nodeData = JSON.parse(event.dataTransfer.getData('application/nodedata') || '{}');

    if (!type) return;

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const snappedPosition = snapToGrid(position);

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type: type as WorkflowNode['type'],
      position: snappedPosition,
      data: {
        label: nodeData.label || `${type} Node`,
        description: nodeData.description || '',
        config: nodeData.defaultConfig || {},
        inputs: nodeData.defaultHandles?.inputs || [],
        outputs: nodeData.defaultHandles?.outputs || [],
        integrationId: nodeData.integrationId,
        isValid: true,
        errors: []
      }
    };

    addNode(newNode);
    selectNode(newNode.id);
    onNodeSelect?.(newNode.id);
    saveToHistory(`Add ${type} node`);
  }, [reactFlowInstance, addNode, selectNode, snapToGrid, onNodeSelect, saveToHistory]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle viewport changes
  const handleViewportChange = useCallback((newViewport: { x: number; y: number; zoom: number }) => {
    setViewport(newViewport);
  }, [setViewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected nodes and edges
        selectedNodes.forEach(nodeId => deleteNode(nodeId));
        selectedEdges.forEach(edgeId => deleteEdge(edgeId));
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          saveToHistory('Delete selection');
        }
      } else if (event.key === 'Escape') {
        clearSelection();
        if (isConnecting) {
          cancelConnection();
        }
      } else if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            // Select all nodes
            storeNodes.forEach(node => selectNode(node.id, true));
            saveToHistory('Select all');
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              // Redo
              useWorkflowStore.getState().redo();
            } else {
              // Undo
              useWorkflowStore.getState().undo();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedEdges, storeNodes, deleteNode, deleteEdge, clearSelection, selectNode, isConnecting, cancelConnection, saveToHistory]);

  // Validate workflow when nodes or edges change
  useEffect(() => {
    validateWorkflow();
  }, [storeNodes, storeEdges, validateWorkflow]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        defaultViewport={viewport}
        snapToGrid={true}
        snapGrid={[20, 20]}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
      >
        <Background 
          variant="dots" 
          gap={20} 
          size={1}
          color="#e2e8f0"
        />
        <Controls 
          position="bottom-right"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          position="bottom-left"
          nodeColor={(node) => {
            switch (node.type) {
              case 'prompt': return '#3b82f6';
              case 'tool': return '#10b981';
              case 'logic': return '#8b5cf6';
              case 'memory': return '#f59e0b';
              case 'integration': return '#ef4444';
              default: return '#6b7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider
const WorkflowCanvasWrapper: React.FC<WorkflowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowCanvas {...props} />
  </ReactFlowProvider>
);

export default WorkflowCanvasWrapper;