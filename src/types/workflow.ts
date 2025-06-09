export interface WorkflowNode {
  id: string;
  type: 'prompt' | 'tool' | 'logic' | 'memory' | 'integration';
  position: { x: number; y: number };
  data: NodeData;
  selected?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'smoothstep' | 'step' | 'straight';
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface NodeData {
  label: string;
  description?: string;
  config: NodeConfig;
  inputs: NodeHandle[];
  outputs: NodeHandle[];
  integrationId?: string;
  isValid?: boolean;
  errors?: string[];
}

export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  dataType?: 'text' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required?: boolean;
}

export interface NodeConfig {
  [key: string]: any;
}

// Specific node configurations
export interface PromptNodeConfig extends NodeConfig {
  instruction: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
  temperature: number;
  maxTokens: number;
  variables: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface ToolNodeConfig extends NodeConfig {
  service: string;
  action: string;
  parameters: Record<string, any>;
  authentication?: {
    type: 'apikey' | 'oauth2' | 'basic';
    credentials: Record<string, any>;
  };
}

export interface LogicNodeConfig extends NodeConfig {
  type: 'if-else' | 'switch' | 'filter' | 'loop';
  condition: string;
  branches: Array<{
    condition: string;
    label: string;
  }>;
}

export interface MemoryNodeConfig extends NodeConfig {
  operation: 'store' | 'retrieve' | 'update' | 'delete';
  key: string;
  value?: string;
  scope: 'session' | 'global' | 'user';
}

export interface IntegrationNodeConfig extends NodeConfig {
  integrationId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: any;
  responseMapping?: Record<string, string>;
}

// Workflow execution types
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  input: any;
  output?: any;
  error?: string;
  steps: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
}

// Canvas state management
export interface CanvasState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  isConnecting: boolean;
  connectionSource?: {
    nodeId: string;
    handleId: string;
    handleType: 'source' | 'target';
  };
}

// Block palette types
export interface BlockTemplate {
  id: string;
  type: WorkflowNode['type'];
  label: string;
  description: string;
  icon: string;
  category: 'core' | 'integrations' | 'logic' | 'data';
  defaultConfig: NodeConfig;
  defaultHandles: {
    inputs: NodeHandle[];
    outputs: NodeHandle[];
  };
  color: string;
  integrationId?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId: string;
  type: 'missing_input' | 'invalid_config' | 'circular_dependency' | 'disconnected_node';
  message: string;
  field?: string;
}

export interface ValidationWarning {
  nodeId: string;
  type: 'performance' | 'best_practice' | 'deprecated';
  message: string;
}

// Undo/Redo types
export interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timestamp: number;
  action: string;
}

export interface UndoRedoState {
  history: HistoryState[];
  currentIndex: number;
  maxHistorySize: number;
}