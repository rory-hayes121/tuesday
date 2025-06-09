export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  lastRun: string;
  runsCount: number;
  createdAt: string;
  blocks: AgentBlock[];
}

export interface AgentBlock {
  id: string;
  type: 'prompt' | 'tool' | 'logic' | 'memory';
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  category: 'communication' | 'productivity' | 'crm' | 'database' | 'ai';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: TemplateBlock[];
  preview: string;
}

export interface TemplateBlock {
  id: string;
  type: 'prompt' | 'tool' | 'logic' | 'memory';
  name: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
  lastActive: string;
}