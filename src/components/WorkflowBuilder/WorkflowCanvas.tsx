import React, { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../../stores/workflowStore';
import PromptNode from './nodes/PromptNode';
import ToolNode from './nodes/ToolNode';
import LogicNode from './nodes/LogicNode';
import MemoryNode from './nodes/MemoryNode';
import IntegrationNode from './nodes/IntegrationNode';

const nodeTypes = {
  prompt: PromptNode,
  tool: ToolNode,
  logic: LogicNode,
  memory: MemoryNode,
  integration: IntegrationNode,
};

interface WorkflowCanvasProps {
  className?: string;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ className = '' }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    addNode, 
    updateNode, 
    deleteNode,
    addEdge: addWorkflowEdge,
    deleteEdge 
  } = useWorkflowStore();

  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges);

  // Sync store state with local state
  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes, setLocalNodes]);

  useEffect(() => {
    setLocalEdges(edges);
  }, [edges, setLocalEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      };
      
      setLocalEdges((eds) => addEdge(newEdge, eds));
      addWorkflowEdge(newEdge);
    },
    [setLocalEdges, addWorkflowEdge]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowInstance || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {},
        },
      };

      setLocalNodes((nds) => nds.concat(newNode));
      addNode(newNode);
    },
    [reactFlowInstance, setLocalNodes, addNode]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Handle node selection for properties panel
    console.log('Node clicked:', node);
  }, []);

  const onNodeDelete = useCallback((nodesToDelete: Node[]) => {
    nodesToDelete.forEach(node => {
      deleteNode(node.id);
    });
  }, [deleteNode]);

  const onEdgeDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => {
      deleteEdge(edge.id);
    });
  }, [deleteEdge]);

  return (
    <div className={`h-full w-full ${className}`} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodesDelete={onNodeDelete}
        onEdgesDelete={onEdgeDelete}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        className="bg-gray-50"
      >
        <Controls className="bg-white shadow-lg rounded-lg border" />
        <MiniMap 
          className="bg-white shadow-lg rounded-lg border"
          nodeColor={(node) => {
            switch (node.type) {
              case 'prompt': return '#3b82f6';
              case 'tool': return '#10b981';
              case 'logic': return '#f59e0b';
              case 'memory': return '#8b5cf6';
              case 'integration': return '#ef4444';
              default: return '#6b7280';
            }
          }}
        />
        <Background color="#e5e7eb" gap={16} />
      </ReactFlow>
    </div>
  );
};

const WorkflowCanvasWrapper: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowCanvasWrapper;