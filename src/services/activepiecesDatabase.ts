/**
 * Activepieces HTTP Client
 * Calls our Netlify function which handles database operations server-side
 * Fixes browser compatibility issues by moving database logic to backend
 */

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

interface CreateFlowRequest {
  displayName: string;
  trigger: any;
  steps: any[];
  status?: 'ENABLED' | 'DISABLED';
}

class ActivepiecesHttpClient {
  private baseUrl: string;
  private projectId: string;

  constructor() {
    this.projectId = 'C8NIVPDXRrRamepemIuFV'; // Tuesday project ID
    
    // Use Netlify function URL
    this.baseUrl = '/.netlify/functions/activepieces';

    console.log('Activepieces HTTP Client initialized:', {
      projectId: this.projectId,
      baseUrl: this.baseUrl,
      mode: 'netlify-function'
    });
  }

  // Create flow via API
  async createFlow(data: CreateFlowRequest): Promise<ActivepiecesFlow> {
    try {
      console.log('Creating flow via API:', data);
      
      const response = await fetch(`${this.baseUrl}/flows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API request failed: ${response.status} ${error}`);
      }

      const flow = await response.json();
      console.log('Flow created successfully via API:', flow);
      return flow;

    } catch (error) {
      console.error('API flow creation failed:', error);
      throw new Error(`Failed to create flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // List flows via API
  async listFlows(): Promise<ActivepiecesFlow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/flows`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to list flows:', response.status);
        return [];
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to list flows:', error);
      return [];
    }
  }

  // Get specific flow
  async getFlow(flowId: string): Promise<ActivepiecesFlow> {
    try {
      const response = await fetch(`${this.baseUrl}/flows/${flowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Flow ${flowId} not found`);
      }

      return await response.json();

    } catch (error) {
      throw new Error(`Failed to get flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete flow
  async deleteFlow(flowId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/flows/${flowId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete flow: ${response.status}`);
      }

      console.log('Flow deleted:', flowId);
    } catch (error) {
      throw new Error(`Failed to delete flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Mock implementations for methods not yet implemented
  async executeFlow(flowId: string, input: any = {}): Promise<ActivepiecesRun> {
    // For now, return a mock run - real execution would require trigger mechanism
    return {
      id: this.generateId(),
      flowId,
      status: 'RUNNING',
      started: new Date().toISOString(),
      input
    };
  }

  async listRuns(flowId?: string, status?: string, limit: number = 50): Promise<ActivepiecesRun[]> {
    // Mock implementation - would query flow_run table
    return [];
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version?: string; authRequired?: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { 
          status: 'error',
          version: `HTTP ${response.status}`,
          authRequired: false
        };
      }

      return await response.json();
    } catch (error) {
      return { 
        status: 'error',
        version: error instanceof Error ? error.message : 'Connection failed',
        authRequired: false
      };
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; requiresAuth: boolean; error?: string }> {
    try {
      const health = await this.healthCheck();
      return { 
        success: health.status === 'healthy', 
        requiresAuth: false,
        error: health.status === 'error' ? health.version : undefined
      };
    } catch (error) {
      return { 
        success: false, 
        requiresAuth: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Generate ID (client-side, for mocks)
  private generateId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 21; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Helper method to transform Tuesday workflow to Activepieces flow (same as before)
  transformToActivepiecesFlow(agentData: any): CreateFlowRequest {
    if (!agentData) {
      throw new Error('Agent data is required for transformation');
    }

    const { name, description, nodes = [], edges = [] } = agentData;

    if (!name) {
      throw new Error('Agent name is required');
    }

    if (!Array.isArray(nodes)) {
      throw new Error('Nodes must be an array');
    }

    if (!Array.isArray(edges)) {
      throw new Error('Edges must be an array');
    }

    // Find trigger node (input type)
    const triggerNode = nodes.find((node: any) => node?.type === 'input');
    
    // Build trigger configuration for Activepieces
    const trigger = {
      name: 'webhook',
      displayName: 'Manual Trigger',
      type: 'PIECE_TRIGGER',
      settings: {
        pieceName: '@activepieces/piece-webhook',
        pieceVersion: '~0.9.1',
        triggerName: 'webhook',
        input: triggerNode?.data?.config || {}
      },
      nextAction: nodes.find((node: any) => 
        edges.some((edge: any) => edge?.source === triggerNode?.id && edge?.target === node?.id)
      )?.id
    };

    // Transform nodes to Activepieces steps with proper structure
    const steps = nodes
      .filter((node: any) => node?.type && node.type !== 'input')
      .map((node: any, index: number) => ({
        name: `step_${index + 1}`,
        displayName: node.data?.label || node.type || 'Unknown Step',
        type: 'PIECE',
        settings: {
          pieceName: this.mapNodeTypeToActivepiecesPiece(node.type || 'unknown'),
          pieceVersion: '~0.9.1',
          actionName: this.getActionNameForNodeType(node.type),
          input: this.transformNodeSettings(node)
        },
        nextAction: this.findNextAction(node.id, edges, nodes)
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
      'prompt': '@activepieces/piece-openai',
      'tool': '@activepieces/piece-http',
      'logic': '@activepieces/piece-data-mapper',
      'memory': '@activepieces/piece-store',
      'output': '@activepieces/piece-data-mapper',
    };
    return mapping[nodeType] || '@activepieces/piece-data-mapper';
  }

  private getActionNameForNodeType(nodeType: string): string {
    const mapping: Record<string, string> = {
      'prompt': 'ask_openai',
      'tool': 'send_request',
      'logic': 'advanced_mapping',
      'memory': 'put',
      'output': 'advanced_mapping',
    };
    return mapping[nodeType] || 'advanced_mapping';
  }

  private findNextAction(nodeId: string, edges: any[], nodes: any[]): string | undefined {
    if (!nodeId || !Array.isArray(edges)) {
      return undefined;
    }

    const outgoingEdge = edges.find(edge => edge?.source === nodeId);
    return outgoingEdge?.target;
  }

  private transformNodeSettings(node: any): any {
    if (!node) {
      return {};
    }

    const { type, data } = node;
    const nodeData = data || {};
    const config = nodeData.config || {};
    
    switch (type) {
      case 'prompt':
        return {
          model: config.model || 'gpt-4',
          messages: [
            {
              role: 'user',
              content: config.instruction || config.prompt || ''
            }
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 1000,
        };
      
      case 'tool':
        return {
          url: config.endpoint || '',
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.body || {},
        };
      
      case 'logic':
        return {
          mapping: config.condition || config.mapping || {},
        };
      
      case 'output':
        return {
          mapping: config.template || config.mapping || {},
        };
      
      default:
        return config;
    }
  }

  // No cleanup needed for HTTP client
  async close(): Promise<void> {
    // No-op for HTTP client
  }
}

// Export singleton instance
export const activepiecesDatabaseClient = new ActivepiecesHttpClient();

// Export types
export type {
  ActivepiecesFlow,
  ActivepiecesRun,
  CreateFlowRequest,
}; 