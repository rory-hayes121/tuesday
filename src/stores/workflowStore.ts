import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Node, 
  Edge, 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange
} from 'reactflow';
import { WorkflowNode, WorkflowEdge } from '../types/workflow';

interface WorkflowState {
  // State
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isValidating: boolean;
  validationErrors: Record<string, string[]>;
  history: {
    past: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
    future: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
  };

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Omit<WorkflowNode, 'id'>) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  validateWorkflow: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  resetWorkflow: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isValidating: false,
  validationErrors: {},
  history: {
    past: [],
    future: []
  }
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setNodes: (nodes) => {
        const state = get();
        const newState = { nodes: state.nodes, edges: state.edges };
        set({
          nodes,
          history: {
            past: [...state.history.past, newState],
            future: []
          }
        });
      },

      setEdges: (edges) => {
        const state = get();
        const newState = { nodes: state.nodes, edges: state.edges };
        set({
          edges,
          history: {
            past: [...state.history.past, newState],
            future: []
          }
        });
      },

      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes as Node[]) as WorkflowNode[]
        }));
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges as Edge[]) as WorkflowEdge[]
        }));
      },

      onConnect: (connection) => {
        set((state) => ({
          edges: addEdge(connection, state.edges as Edge[]) as WorkflowEdge[]
        }));
      },

      addNode: (nodeData) => {
        const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          ...nodeData
        };
        
        set((state) => {
          const newState = { nodes: state.nodes, edges: state.edges };
          return {
            nodes: [...state.nodes, newNode],
            history: {
              past: [...state.history.past, newState],
              future: []
            }
          };
        });
      },

      updateNode: (nodeId, updates) => {
        set((state) => {
          const newState = { nodes: state.nodes, edges: state.edges };
          return {
            nodes: state.nodes.map(node => 
              node.id === nodeId ? { ...node, ...updates } : node
            ),
            history: {
              past: [...state.history.past, newState],
              future: []
            }
          };
        });
      },

      deleteNode: (nodeId) => {
        set((state) => {
          const newState = { nodes: state.nodes, edges: state.edges };
          return {
            nodes: state.nodes.filter(node => node.id !== nodeId),
            edges: state.edges.filter(edge => 
              edge.source !== nodeId && edge.target !== nodeId
            ),
            selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            history: {
              past: [...state.history.past, newState],
              future: []
            }
          };
        });
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      validateWorkflow: () => {
        set({ isValidating: true });
        
        const { nodes, edges } = get();
        const errors: Record<string, string[]> = {};

        // Basic validation logic
        nodes.forEach(node => {
          const nodeErrors: string[] = [];
          
          if (!node.data?.label) {
            nodeErrors.push('Node must have a label');
          }
          
          if (nodeErrors.length > 0) {
            errors[node.id] = nodeErrors;
          }
        });

        set({ 
          validationErrors: errors,
          isValidating: false 
        });
      },

      undo: () => {
        const state = get();
        if (state.history.past.length === 0) return;

        const previous = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, state.history.past.length - 1);
        const current = { nodes: state.nodes, edges: state.edges };

        set({
          nodes: previous.nodes,
          edges: previous.edges,
          history: {
            past: newPast,
            future: [current, ...state.history.future]
          }
        });
      },

      redo: () => {
        const state = get();
        if (state.history.future.length === 0) return;

        const next = state.history.future[0];
        const newFuture = state.history.future.slice(1);
        const current = { nodes: state.nodes, edges: state.edges };

        set({
          nodes: next.nodes,
          edges: next.edges,
          history: {
            past: [...state.history.past, current],
            future: newFuture
          }
        });
      },

      clearHistory: () => {
        set({
          history: {
            past: [],
            future: []
          }
        });
      },

      resetWorkflow: () => {
        set({
          ...initialState,
          history: {
            past: [],
            future: []
          }
        });
      }
    }),
    {
      name: 'workflow-store'
    }
  )
);