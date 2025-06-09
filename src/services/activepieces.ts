/**
 * Activepieces API Client
 * Interfaces with self-hosted Activepieces instance at activepieces-production-aa7c.up.railway.app
 */

interface ActivepiecesCredential {
  id: string;
  displayName: string;
  pieceName: string;
  projectId: string;
  created: string;
  updated: string;
}

interface ActivepiecesFlow {
  id: string;
  displayName: string;
  status: 'ENABLED' | 'DISABLED';
  projectId: string;
  trigger: any;
  steps: any[];
  created: string;
  updated: string;
}

interface ActivepiecesRun {
  id: string;
  flowId: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STOPPED';
  logsFileId?: string;
  started: string;
  finished?: string;
  input?: any;
  output?: any;
}

interface CreateCredentialRequest {
  displayName: string;
  pieceName: string;
  value: any;
  projectId: string;
}

interface CreateFlowRequest {
  displayName: string;
  trigger: any;
  steps: any[];
  status?: 'ENABLED' | 'DISABLED';
}

interface ExecuteFlowRequest {
  flowId: string;
  input?: any;
}

class ActivepiecesClient {
  private baseUrl: string;
  private apiKey: string;
  private projectId: string;

  constructor() {
    this.baseUrl = 'https://activepieces-production-aa7c.up.railway.app';
    // For self-hosted instances, API key might not be required or could be different
    this.apiKey = import.meta.env.VITE_ACTIVEPIECES_API_KEY || '';
    // Use the actual project ID from the Railway deployment
    this.projectId = import.meta.env.VITE_ACTIVEPIECES_PROJECT_ID || 'C8NIVPDXRrRamepemIuFV';

    console.log('Activepieces Client initialized:', {
      baseUrl: this.baseUrl,
      projectId: this.projectId,
      hasApiKey: !!this.apiKey
    });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add API key if available
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    console.log('Making request to:', url, { endpoint, hasApiKey: !!this.apiKey });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      // Handle CORS errors specifically
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('CORS or network error detected. This is likely due to CORS configuration on the Activepieces instance.');
        throw new Error('CORS_ERROR: Unable to connect to Activepieces instance. Please configure CORS headers on your Railway deployment.');
      }
      throw error;
    }
  }

  // Credential Management
  async createCredential(data: CreateCredentialRequest): Promise<ActivepiecesCredential> {
    return this.request<ActivepiecesCredential>('/credentials', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        projectId: this.projectId,
      }),
    });
  }

  async listCredentials(): Promise<ActivepiecesCredential[]> {
    return this.request<ActivepiecesCredential[]>(`/credentials?projectId=${this.projectId}`);
  }

  async getCredential(credentialId: string): Promise<ActivepiecesCredential> {
    return this.request<ActivepiecesCredential>(`/credentials/${credentialId}`);
  }

  async deleteCredential(credentialId: string): Promise<void> {
    await this.request(`/credentials/${credentialId}`, {
      method: 'DELETE',
    });
  }

  async testCredential(credentialId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.request(`/credentials/${credentialId}/test`, {
        method: 'POST',
      });
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Flow Management
  async createFlow(data: CreateFlowRequest): Promise<ActivepiecesFlow> {
    return this.request<ActivepiecesFlow>('/flows', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        projectId: this.projectId,
      }),
    });
  }

  async updateFlow(flowId: string, data: Partial<CreateFlowRequest>): Promise<ActivepiecesFlow> {
    return this.request<ActivepiecesFlow>(`/flows/${flowId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getFlow(flowId: string): Promise<ActivepiecesFlow> {
    return this.request<ActivepiecesFlow>(`/flows/${flowId}`);
  }

  async listFlows(): Promise<ActivepiecesFlow[]> {
    return this.request<ActivepiecesFlow[]>(`/flows?projectId=${this.projectId}`);
  }

  async deleteFlow(flowId: string): Promise<void> {
    await this.request(`/flows/${flowId}`, {
      method: 'DELETE',
    });
  }

  // Flow Execution
  async executeFlow(flowId: string, input: any = {}): Promise<ActivepiecesRun> {
    return this.request<ActivepiecesRun>(`/flows/${flowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  async startFlow(flowId: string): Promise<void> {
    await this.request(`/flows/${flowId}/start`, {
      method: 'POST',
    });
  }

  async stopFlow(flowId: string): Promise<void> {
    await this.request(`/flows/${flowId}/stop`, {
      method: 'POST',
    });
  }

  // Run Management
  async getRun(runId: string): Promise<ActivepiecesRun> {
    return this.request<ActivepiecesRun>(`/runs/${runId}`);
  }

  async listRuns(flowId?: string, status?: string, limit: number = 50): Promise<ActivepiecesRun[]> {
    const params = new URLSearchParams({
      projectId: this.projectId,
      limit: limit.toString(),
    });
    
    if (flowId) params.append('flowId', flowId);
    if (status) params.append('status', status);

    return this.request<ActivepiecesRun[]>(`/runs?${params.toString()}`);
  }

  async getRunLogs(runId: string): Promise<any[]> {
    return this.request<any[]>(`/runs/${runId}/logs`);
  }

  // Pieces (Integrations) Information
  async listPieces(): Promise<any[]> {
    return this.request<any[]>('/pieces');
  }

  async getPiece(pieceName: string): Promise<any> {
    return this.request<any>(`/pieces/${pieceName}`);
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; version?: string; authRequired?: boolean }> {
    try {
      // Try health endpoint first (usually doesn't require auth)
      const healthResponse = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        return { status: 'healthy', version: healthData.version, authRequired: false };
      }

      // Try the projects endpoint to test auth
      const projectsResponse = await fetch(`${this.baseUrl}/v1/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (projectsResponse.status === 401 || projectsResponse.status === 403) {
        return { status: 'requires-auth', authRequired: true };
      }

      return { status: 'unknown', authRequired: false };
    } catch (error) {
      return { 
        status: 'error',
        version: error instanceof Error ? error.message : 'Unknown error',
        authRequired: false
      };
    }
  }

  // Test connection to determine authentication requirements
  async testConnection(): Promise<{ success: boolean; requiresAuth: boolean; error?: string }> {
    try {
      // Try to access a basic endpoint without authentication first
      const response = await fetch(`${this.baseUrl}/v1/projects/${this.projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, requiresAuth: false };
      } else if (response.status === 401 || response.status === 403) {
        return { success: false, requiresAuth: true, error: 'Authentication required' };
      } else {
        const errorText = await response.text();
        return { success: false, requiresAuth: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { 
        success: false, 
        requiresAuth: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Helper method to transform Tuesday workflow to Activepieces flow
  transformToActivepiecesFlow(agentData: any): CreateFlowRequest {
    const { name, description, nodes, edges } = agentData;

    // Find trigger node (input type)
    const triggerNode = nodes.find((node: any) => node.type === 'input');
    
    // Build trigger configuration
    const trigger = triggerNode ? {
      name: 'webhook',
      displayName: 'Manual Trigger',
      nextAction: nodes.find((node: any) => 
        edges.some((edge: any) => edge.source === triggerNode.id && edge.target === node.id)
      )?.id,
      settings: {
        inputSchema: triggerNode.data?.config || {}
      }
    } : {
      name: 'webhook',
      displayName: 'Manual Trigger',
      settings: {}
    };

    // Transform nodes to Activepieces steps
    const steps = nodes
      .filter((node: any) => node.type !== 'input')
      .map((node: any) => ({
        name: this.mapNodeTypeToActivepiecesPiece(node.type),
        displayName: node.data?.label || node.type,
        nextAction: this.findNextAction(node.id, edges, nodes),
        settings: this.transformNodeSettings(node),
      }));

    return {
      displayName: name,
      trigger,
      steps,
      status: 'ENABLED',
    };
  }

  private mapNodeTypeToActivepiecesPiece(nodeType: string): string {
    const mapping: Record<string, string> = {
      'prompt': 'openai',
      'tool': 'http',
      'logic': 'data-mapper',
      'memory': 'store',
      'output': 'data-mapper',
    };
    return mapping[nodeType] || 'data-mapper';
  }

  private findNextAction(nodeId: string, edges: any[], nodes: any[]): string | undefined {
    const outgoingEdge = edges.find(edge => edge.source === nodeId);
    return outgoingEdge?.target;
  }

  private transformNodeSettings(node: any): any {
    const { type, data } = node;
    
    switch (type) {
      case 'prompt':
        return {
          model: data.config?.model || 'gpt-4',
          prompt: data.config?.instruction || data.config?.prompt || '',
          temperature: data.config?.temperature || 0.7,
          maxTokens: data.config?.maxTokens || 1000,
        };
      
      case 'tool':
        return {
          url: data.config?.endpoint || '',
          method: data.config?.method || 'GET',
          headers: data.config?.headers || {},
          body: data.config?.body || {},
        };
      
      case 'logic':
        return {
          condition: data.config?.condition || '',
          branches: data.config?.branches || [],
        };
      
      case 'output':
        return {
          template: data.config?.template || '',
          format: data.config?.format || 'json',
        };
      
      default:
        return data.config || {};
    }
  }
}

// Export singleton instance
export const activepiecesClient = new ActivepiecesClient();

// Export types
export type {
  ActivepiecesCredential,
  ActivepiecesFlow,
  ActivepiecesRun,
  CreateCredentialRequest,
  CreateFlowRequest,
  ExecuteFlowRequest,
}; 