/**
 * Activepieces API Client
 * Interfaces with self-hosted Activepieces instance at activepieces-production-aa7c.up.railway.app
 * Uses session-based authentication for real flow creation
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

interface SessionToken {
  token: string;
  expiresAt: number;
  projectId: string;
}

class ActivepiecesClient {
  private baseUrl: string;
  private projectId: string;
  private sessionToken: SessionToken | null = null;
  private authPromptCallback: ((message: string) => Promise<string>) | null = null;

  constructor() {
    this.baseUrl = 'https://activepieces-production-aa7c.up.railway.app';
    this.projectId = import.meta.env.VITE_ACTIVEPIECES_PROJECT_ID || 'C8NIVPDXRrRamepemIuFV';

    console.log('Activepieces Client initialized for session-based authentication:', {
      baseUrl: this.baseUrl,
      projectId: this.projectId
    });
  }

  // Set callback for authentication prompts
  setAuthPromptCallback(callback: (message: string) => Promise<string>) {
    this.authPromptCallback = callback;
  }

  // Extract JWT token from browser (user needs to be logged into Activepieces)
  private extractTokenFromBrowser(): string | null {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') return null;

      // Try to get token from localStorage (common in SPAs)
      const storedToken = localStorage.getItem('activepieces_token') || 
                         localStorage.getItem('token') ||
                         localStorage.getItem('access_token');
      
      if (storedToken) {
        return storedToken;
      }

      // Try to extract from cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name.includes('token') || name.includes('auth') || name.includes('jwt')) {
          return value;
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to extract token from browser:', error);
      return null;
    }
  }

  // Parse JWT token to get expiration
  private parseJWT(token: string): { exp?: number; projectId?: string } {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.warn('Failed to parse JWT:', error);
      return {};
    }
  }

  // Check if token is valid and not expired
  private isTokenValid(token: string): boolean {
    const parsed = this.parseJWT(token);
    if (!parsed.exp) return false;
    
    // Check if token expires in next 5 minutes (buffer for requests)
    const expiresAt = parsed.exp * 1000;
    const now = Date.now();
    return expiresAt > (now + 5 * 60 * 1000);
  }

  // Prompt user for fresh token
  private async promptForToken(): Promise<string> {
    if (!this.authPromptCallback) {
      throw new Error('Authentication required. Please log into Activepieces and try again.');
    }

    const message = `Please copy your authentication token from Activepieces:
    
1. Open ${this.baseUrl} in a new tab
2. Log in if not already logged in
3. Open Developer Tools (F12)
4. Go to Network tab
5. Refresh the page or navigate around
6. Find any API request (like /api/v1/flows)
7. Copy the Authorization header value (remove "Bearer " prefix)
8. Paste the token below:`;

    return await this.authPromptCallback(message);
  }

  // Get valid session token
  private async getValidToken(): Promise<string> {
    // Try to use cached token if valid
    if (this.sessionToken && this.isTokenValid(this.sessionToken.token)) {
      return this.sessionToken.token;
    }

    // Try to extract from browser
    const browserToken = this.extractTokenFromBrowser();
    if (browserToken && this.isTokenValid(browserToken)) {
      const parsed = this.parseJWT(browserToken);
      this.sessionToken = {
        token: browserToken,
        expiresAt: (parsed.exp || 0) * 1000,
        projectId: parsed.projectId || this.projectId
      };
      return browserToken;
    }

    // Prompt user for fresh token
    const userToken = await this.promptForToken();
    if (!userToken) {
      throw new Error('Authentication token is required');
    }

    // Clean token (remove "Bearer " if present)
    const cleanToken = userToken.replace(/^Bearer\s+/i, '').trim();
    
    if (!this.isTokenValid(cleanToken)) {
      throw new Error('Invalid or expired token provided');
    }

    const parsed = this.parseJWT(cleanToken);
    this.sessionToken = {
      token: cleanToken,
      expiresAt: (parsed.exp || 0) * 1000,
      projectId: parsed.projectId || this.projectId
    };

    return cleanToken;
  }

  // Make authenticated API request
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    // Get valid token for authenticated requests
    const needsAuth = !endpoint.includes('/health') && !endpoint.includes('/pieces');
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (needsAuth) {
      const token = await this.getValidToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Making request to:', url, { 
      endpoint, 
      hasAuth: needsAuth,
      method: options.method || 'GET'
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url
      });

      if (response.status === 401 || response.status === 403) {
        // Clear cached token and retry once
        this.sessionToken = null;
        throw new Error('Authentication failed. Please log into Activepieces and try again.');
      }

      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Real flow creation using authenticated API
  async createFlow(data: CreateFlowRequest): Promise<ActivepiecesFlow> {
    try {
      console.log('Creating real flow in Activepieces:', data);
      
      const response = await this.request<ActivepiecesFlow>('/flows', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          projectId: this.sessionToken?.projectId || this.projectId
        }),
      });

      console.log('Flow created successfully:', response);
      return response;
    } catch (error) {
      console.error('Flow creation failed:', error);
      throw new Error(`Failed to create flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Simplified methods for self-hosted instances
  async listFlows(): Promise<ActivepiecesFlow[]> {
    try {
      return await this.request<ActivepiecesFlow[]>('/flows');
    } catch (error) {
      console.error('Failed to list flows:', error);
      return [];
    }
  }

  async getFlow(flowId: string): Promise<ActivepiecesFlow> {
    return await this.request<ActivepiecesFlow>(`/flows/${flowId}`);
  }

  async deleteFlow(flowId: string): Promise<void> {
    await this.request(`/flows/${flowId}`, { method: 'DELETE' });
  }

  async executeFlow(flowId: string, input: any = {}): Promise<ActivepiecesRun> {
    return await this.request<ActivepiecesRun>(`/flows/${flowId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ input })
    });
  }

  async listRuns(flowId?: string, status?: string, limit: number = 50): Promise<ActivepiecesRun[]> {
    const params = new URLSearchParams();
    if (flowId) params.append('flowId', flowId);
    if (status) params.append('status', status);
    params.append('limit', limit.toString());

    return await this.request<ActivepiecesRun[]>(`/flow-runs?${params.toString()}`);
  }

  async listPieces(): Promise<any[]> {
    // This endpoint works without auth, so we can still use it
    try {
      return await this.request<any[]>('/pieces');
    } catch (error) {
      console.error('Failed to fetch pieces:', error);
      return [];
    }
  }

  async healthCheck(): Promise<{ status: string; version?: string; authRequired?: boolean }> {
    try {
      const healthData = await this.request<any>('/health');
      return { status: 'healthy', version: healthData.version, authRequired: false };
    } catch (error) {
      return { 
        status: 'error',
        version: error instanceof Error ? error.message : 'Unknown error',
        authRequired: false
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; requiresAuth: boolean; error?: string }> {
    try {
      const pieces = await this.listPieces();
      return { success: pieces.length > 0, requiresAuth: false };
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
    // Add null/undefined checks to prevent crashes
    if (!agentData) {
      throw new Error('Agent data is required for transformation');
    }

    const { name, description, nodes = [], edges = [] } = agentData;

    // Validate required fields
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
    
    // Build trigger configuration
    const trigger = triggerNode ? {
      name: 'webhook',
      displayName: 'Manual Trigger',
      nextAction: nodes.find((node: any) => 
        edges.some((edge: any) => edge?.source === triggerNode.id && edge?.target === node?.id)
      )?.id,
      settings: {
        inputSchema: triggerNode.data?.config || {}
      }
    } : {
      name: 'webhook',
      displayName: 'Manual Trigger',
      settings: {}
    };

    // Transform nodes to Activepieces steps with safe access
    const steps = nodes
      .filter((node: any) => node?.type && node.type !== 'input')
      .map((node: any) => ({
        name: this.mapNodeTypeToActivepiecesPiece(node.type || 'unknown'),
        displayName: node.data?.label || node.type || 'Unknown Step',
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
    // Add safety checks
    if (!nodeId || !Array.isArray(edges)) {
      return undefined;
    }

    const outgoingEdge = edges.find(edge => edge?.source === nodeId);
    return outgoingEdge?.target;
  }

  private transformNodeSettings(node: any): any {
    // Add safety checks for node data
    if (!node) {
      return {};
    }

    const { type, data } = node;
    
    // Ensure data exists
    const nodeData = data || {};
    const config = nodeData.config || {};
    
    switch (type) {
      case 'prompt':
        return {
          model: config.model || 'gpt-4',
          prompt: config.instruction || config.prompt || '',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 1000,
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
          condition: config.condition || '',
          branches: config.branches || [],
        };
      
      case 'output':
        return {
          template: config.template || '',
          format: config.format || 'json',
        };
      
      default:
        return config;
    }
  }

  // Credential management methods (now with real API)
  async createCredential(data: CreateCredentialRequest): Promise<ActivepiecesCredential> {
    return await this.request<ActivepiecesCredential>('/app-connections', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async listCredentials(): Promise<ActivepiecesCredential[]> {
    return await this.request<ActivepiecesCredential[]>('/app-connections');
  }

  async getCredential(credentialId: string): Promise<ActivepiecesCredential> {
    return await this.request<ActivepiecesCredential>(`/app-connections/${credentialId}`);
  }

  async deleteCredential(credentialId: string): Promise<void> {
    await this.request(`/app-connections/${credentialId}`, { method: 'DELETE' });
  }

  async testCredential(credentialId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.request(`/app-connections/${credentialId}/test`, { method: 'POST' });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Test failed' };
    }
  }

  async updateFlow(flowId: string, data: Partial<CreateFlowRequest>): Promise<ActivepiecesFlow> {
    return await this.request<ActivepiecesFlow>(`/flows/${flowId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async startFlow(flowId: string): Promise<void> {
    await this.request(`/flows/${flowId}/start`, { method: 'POST' });
  }

  async stopFlow(flowId: string): Promise<void> {
    await this.request(`/flows/${flowId}/stop`, { method: 'POST' });
  }

  async getRun(runId: string): Promise<ActivepiecesRun> {
    return await this.request<ActivepiecesRun>(`/flow-runs/${runId}`);
  }

  async getRunLogs(runId: string): Promise<any[]> {
    return await this.request<any[]>(`/flow-runs/${runId}/logs`);
  }

  async getPiece(pieceName: string): Promise<any> {
    return await this.request<any>(`/pieces/${pieceName}`);
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