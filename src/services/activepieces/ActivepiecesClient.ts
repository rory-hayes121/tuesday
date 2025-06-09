export interface ActivepiecesConfig {
  baseUrl: string;
}

export interface ActivepiecesFlow {
  id: string;
  displayName: string;
  status: 'ENABLED' | 'DISABLED';
  projectId: string;
  version: {
    id: string;
    flowId: string;
    displayName: string;
    trigger: any;
    updatedBy: string;
    valid: boolean;
    state: 'LOCKED' | 'DRAFT';
  };
  created: string;
  updated: string;
}

export interface ActivepiecesFlowRun {
  id: string;
  projectId: string;
  flowId: string;
  flowVersionId: string;
  environment: string;
  flowDisplayName: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STOPPED' | 'PAUSED';
  startTime: string;
  finishTime?: string;
  logsFileId?: string;
  tasks?: number;
}

export interface ActivepiecesApp {
  name: string;
  displayName: string;
  description: string;
  logoUrl: string;
  minimumSupportedRelease: string;
  maximumSupportedRelease: string;
  auth?: {
    type: 'OAUTH2' | 'API_KEY' | 'BASIC' | 'CUSTOM';
    required: boolean;
  };
  actions: Array<{
    name: string;
    displayName: string;
    description: string;
    props: any;
  }>;
  triggers: Array<{
    name: string;
    displayName: string;
    description: string;
    props: any;
  }>;
}

export interface CreateFlowRequest {
  displayName: string;
  projectId: string;
}

export interface TriggerFlowRequest {
  flowId: string;
  projectId: string;
  payload?: any;
}

export class ActivepiecesClient {
  private config: ActivepiecesConfig;

  constructor(config: ActivepiecesConfig) {
    this.config = config;
  }

  // Flow Management
  async createFlow(request: CreateFlowRequest): Promise<ActivepiecesFlow> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create flow: ${error}`);
    }

    return await response.json();
  }

  async getFlow(flowId: string): Promise<ActivepiecesFlow> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flows/${flowId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get flow: ${error}`);
    }

    return await response.json();
  }

  async listFlows(projectId: string): Promise<ActivepiecesFlow[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flows?projectId=${projectId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list flows: ${error}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  async updateFlow(flowId: string, updates: Partial<ActivepiecesFlow>): Promise<ActivepiecesFlow> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flows/${flowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update flow: ${error}`);
    }

    return await response.json();
  }

  async deleteFlow(flowId: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flows/${flowId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete flow: ${error}`);
    }
  }

  // Flow Execution
  async triggerFlow(request: TriggerFlowRequest): Promise<ActivepiecesFlowRun> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flow-runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to trigger flow: ${error}`);
    }

    return await response.json();
  }

  async getFlowRun(runId: string): Promise<ActivepiecesFlowRun> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flow-runs/${runId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get flow run: ${error}`);
    }

    return await response.json();
  }

  async getFlowRunLogs(runId: string): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flow-runs/${runId}/logs`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get flow run logs: ${error}`);
    }

    const logs = await response.text();
    return logs.split('\n').filter(line => line.trim());
  }

  async listFlowRuns(flowId: string): Promise<ActivepiecesFlowRun[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/flow-runs?flowId=${flowId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list flow runs: ${error}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  // Apps and Integrations
  async getAvailableApps(): Promise<ActivepiecesApp[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/apps`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get available apps: ${error}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  async getApp(appName: string): Promise<ActivepiecesApp> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/apps/${appName}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get app: ${error}`);
    }

    return await response.json();
  }

  // Projects
  async createProject(name: string): Promise<{ id: string; displayName: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: name })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create project: ${error}`);
    }

    return await response.json();
  }

  async getProject(projectId: string): Promise<{ id: string; displayName: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/projects/${projectId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get project: ${error}`);
    }

    return await response.json();
  }
}