import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  WorkflowNode, 
  WorkflowEdge, 
  CanvasState, 
  BlockTemplate,
  ValidationResult,
  UndoRedoState,
  HistoryState
} from '../types/workflow';

interface WorkflowStore extends CanvasState {
  // State management
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  updateNodeData: (nodeId: string, updates: Partial<WorkflowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Selection management
  selectNode: (nodeId: string, multi?: boolean) => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  clearSelection: () => void;
  
  // Viewport management
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  
  // Connection management
  startConnection: (nodeId: string, handleId: string, handleType: 'source' | 'target') => void;
  endConnection: (nodeId: string, handleId: string) => void;
  cancelConnection: () => void;
  
  // Block templates
  blockTemplates: BlockTemplate[];
  setBlockTemplates: (templates: BlockTemplate[]) => void;
  addBlockTemplate: (template: BlockTemplate) => void;
  
  // Validation
  validationResult: ValidationResult | null;
  validateWorkflow: () => ValidationResult;
  
  // Undo/Redo
  undoRedoState: UndoRedoState;
  saveToHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Utility functions
  getNodeById: (nodeId: string) => WorkflowNode | undefined;
  getEdgeById: (edgeId: string) => WorkflowEdge | undefined;
  getConnectedNodes: (nodeId: string) => { incoming: WorkflowNode[]; outgoing: WorkflowNode[] };
  findPath: (sourceId: string, targetId: string) => string[] | null;
  
  // Auto-layout
  autoLayout: () => void;
  snapToGrid: (position: { x: number; y: number }, gridSize?: number) => { x: number; y: number };
}

export const useWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    isConnecting: false,
    connectionSource: undefined,
    blockTemplates: [],
    validationResult: null,
    undoRedoState: {
      history: [],
      currentIndex: -1,
      maxHistorySize: 50
    },

    // State management
    setNodes: (nodes) => {
      set({ nodes });
    },

    setEdges: (edges) => {
      set({ edges });
    },

    addNode: (node) => {
      set((state) => ({
        nodes: [...state.nodes, node]
      }));
      get().saveToHistory(`Add ${node.type} node`);
    },

    updateNode: (nodeId, updates) => {
      set((state) => ({
        nodes: state.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      }));
    },

    updateNodeData: (nodeId, updates) => {
      set((state) => ({
        nodes: state.nodes.map(node =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
        )
      }));
    },

    deleteNode: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => 
          edge.source !== nodeId && edge.target !== nodeId
        ),
        selectedNodes: state.selectedNodes.filter(id => id !== nodeId)
      }));
      get().saveToHistory(`Delete node ${nodeId}`);
    },

    addEdge: (edge) => {
      set((state) => ({
        edges: [...state.edges, edge]
      }));
      get().saveToHistory('Add connection');
    },

    deleteEdge: (edgeId) => {
      set((state) => ({
        edges: state.edges.filter(edge => edge.id !== edgeId),
        selectedEdges: state.selectedEdges.filter(id => id !== edgeId)
      }));
      get().saveToHistory('Delete connection');
    },

    // Selection management
    selectNode: (nodeId, multi = false) => {
      set((state) => ({
        selectedNodes: multi 
          ? state.selectedNodes.includes(nodeId)
            ? state.selectedNodes.filter(id => id !== nodeId)
            : [...state.selectedNodes, nodeId]
          : [nodeId],
        selectedEdges: multi ? state.selectedEdges : []
      }));
    },

    selectEdge: (edgeId, multi = false) => {
      set((state) => ({
        selectedEdges: multi
          ? state.selectedEdges.includes(edgeId)
            ? state.selectedEdges.filter(id => id !== edgeId)
            : [...state.selectedEdges, edgeId]
          : [edgeId],
        selectedNodes: multi ? state.selectedNodes : []
      }));
    },

    clearSelection: () => {
      set({ selectedNodes: [], selectedEdges: [] });
    },

    // Viewport management
    setViewport: (viewport) => {
      set({ viewport });
    },

    // Connection management
    startConnection: (nodeId, handleId, handleType) => {
      set({
        isConnecting: true,
        connectionSource: { nodeId, handleId, handleType }
      });
    },

    endConnection: (nodeId, handleId) => {
      const state = get();
      if (!state.connectionSource) return;

      const { nodeId: sourceNodeId, handleId: sourceHandleId, handleType: sourceHandleType } = state.connectionSource;
      
      // Validate connection
      if (sourceNodeId === nodeId) return; // Can't connect to self
      if (sourceHandleType === 'target') return; // Must start from source
      
      // Check if connection already exists
      const existingEdge = state.edges.find(edge =>
        edge.source === sourceNodeId && 
        edge.target === nodeId &&
        edge.sourceHandle === sourceHandleId &&
        edge.targetHandle === handleId
      );
      
      if (existingEdge) return;

      // Create new edge
      const newEdge: WorkflowEdge = {
        id: `edge-${sourceNodeId}-${nodeId}-${Date.now()}`,
        source: sourceNodeId,
        target: nodeId,
        sourceHandle: sourceHandleId,
        targetHandle: handleId,
        type: 'smoothstep',
        animated: false
      };

      get().addEdge(newEdge);
      get().cancelConnection();
    },

    cancelConnection: () => {
      set({
        isConnecting: false,
        connectionSource: undefined
      });
    },

    // Block templates
    setBlockTemplates: (templates) => {
      set({ blockTemplates: templates });
    },

    addBlockTemplate: (template) => {
      set((state) => ({
        blockTemplates: [...state.blockTemplates, template]
      }));
    },

    // Validation
    validateWorkflow: () => {
      const { nodes, edges } = get();
      const errors: any[] = [];
      const warnings: any[] = [];

      // Check for disconnected nodes
      nodes.forEach(node => {
        const hasIncoming = edges.some(edge => edge.target === node.id);
        const hasOutgoing = edges.some(edge => edge.source === node.id);
        
        if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
          warnings.push({
            nodeId: node.id,
            type: 'disconnected_node',
            message: 'Node is not connected to the workflow'
          });
        }
      });

      // Check for circular dependencies
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
      const hasCycle = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        for (const edge of outgoingEdges) {
          if (hasCycle(edge.target)) return true;
        }
        
        recursionStack.delete(nodeId);
        return false;
      };

      for (const node of nodes) {
        if (hasCycle(node.id)) {
          errors.push({
            nodeId: node.id,
            type: 'circular_dependency',
            message: 'Circular dependency detected'
          });
          break;
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings
      };

      set({ validationResult: result });
      return result;
    },

    // Undo/Redo
    saveToHistory: (action) => {
      const { nodes, edges, undoRedoState } = get();
      const newHistoryState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
        action
      };

      const newHistory = [
        ...undoRedoState.history.slice(0, undoRedoState.currentIndex + 1),
        newHistoryState
      ].slice(-undoRedoState.maxHistorySize);

      set({
        undoRedoState: {
          ...undoRedoState,
          history: newHistory,
          currentIndex: newHistory.length - 1
        }
      });
    },

    undo: () => {
      const { undoRedoState } = get();
      if (undoRedoState.currentIndex > 0) {
        const previousState = undoRedoState.history[undoRedoState.currentIndex - 1];
        set({
          nodes: JSON.parse(JSON.stringify(previousState.nodes)),
          edges: JSON.parse(JSON.stringify(previousState.edges)),
          undoRedoState: {
            ...undoRedoState,
            currentIndex: undoRedoState.currentIndex - 1
          }
        });
      }
    },

    redo: () => {
      const { undoRedoState } = get();
      if (undoRedoState.currentIndex < undoRedoState.history.length - 1) {
        const nextState = undoRedoState.history[undoRedoState.currentIndex + 1];
        set({
          nodes: JSON.parse(JSON.stringify(nextState.nodes)),
          edges: JSON.parse(JSON.stringify(nextState.edges)),
          undoRedoState: {
            ...undoRedoState,
            currentIndex: undoRedoState.currentIndex + 1
          }
        });
      }
    },

    canUndo: () => {
      const { undoRedoState } = get();
      return undoRedoState.currentIndex > 0;
    },

    canRedo: () => {
      const { undoRedoState } = get();
      return undoRedoState.currentIndex < undoRedoState.history.length - 1;
    },

    // Utility functions
    getNodeById: (nodeId) => {
      return get().nodes.find(node => node.id === nodeId);
    },

    getEdgeById: (edgeId) => {
      return get().edges.find(edge => edge.id === edgeId);
    },

    getConnectedNodes: (nodeId) => {
      const { nodes, edges } = get();
      const incoming = edges
        .filter(edge => edge.target === nodeId)
        .map(edge => nodes.find(node => node.id === edge.source))
        .filter(Boolean) as WorkflowNode[];
      
      const outgoing = edges
        .filter(edge => edge.source === nodeId)
        .map(edge => nodes.find(node => node.id === edge.target))
        .filter(Boolean) as WorkflowNode[];

      return { incoming, outgoing };
    },

    findPath: (sourceId, targetId) => {
      const { edges } = get();
      const visited = new Set<string>();
      const path: string[] = [];

      const dfs = (currentId: string): boolean => {
        if (currentId === targetId) {
          path.push(currentId);
          return true;
        }

        if (visited.has(currentId)) return false;
        visited.add(currentId);
        path.push(currentId);

        const outgoingEdges = edges.filter(edge => edge.source === currentId);
        for (const edge of outgoingEdges) {
          if (dfs(edge.target)) return true;
        }

        path.pop();
        return false;
      };

      return dfs(sourceId) ? path : null;
    },

    // Auto-layout
    autoLayout: () => {
      const { nodes, edges } = get();
      const layoutNodes = [...nodes];
      
      // Simple hierarchical layout
      const levels: string[][] = [];
      const visited = new Set<string>();
      
      // Find root nodes (no incoming edges)
      const rootNodes = nodes.filter(node => 
        !edges.some(edge => edge.target === node.id)
      );
      
      if (rootNodes.length === 0) return; // No layout possible
      
      levels.push(rootNodes.map(node => node.id));
      visited.add(...rootNodes.map(node => node.id));
      
      // Build levels
      let currentLevel = 0;
      while (levels[currentLevel] && levels[currentLevel].length > 0) {
        const nextLevel: string[] = [];
        
        for (const nodeId of levels[currentLevel]) {
          const outgoingEdges = edges.filter(edge => edge.source === nodeId);
          for (const edge of outgoingEdges) {
            if (!visited.has(edge.target)) {
              nextLevel.push(edge.target);
              visited.add(edge.target);
            }
          }
        }
        
        if (nextLevel.length > 0) {
          levels.push(nextLevel);
        }
        currentLevel++;
      }
      
      // Position nodes
      const levelHeight = 200;
      const nodeWidth = 300;
      
      levels.forEach((level, levelIndex) => {
        level.forEach((nodeId, nodeIndex) => {
          const node = layoutNodes.find(n => n.id === nodeId);
          if (node) {
            node.position = {
              x: nodeIndex * (nodeWidth + 50),
              y: levelIndex * levelHeight
            };
          }
        });
      });
      
      set({ nodes: layoutNodes });
      get().saveToHistory('Auto layout');
    },

    snapToGrid: (position, gridSize = 20) => {
      return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
      };
    }
  }))
);