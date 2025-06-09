import { WorkflowNode, WorkflowEdge } from '../../types/workflow';

export interface WindmillScript {
  name: string;
  language: 'typescript' | 'python' | 'bash';
  content: string;
  schema: any;
  description: string;
}

export interface WindmillFlow {
  summary: string;
  description: string;
  value: {
    modules: WindmillModule[];
    failure_module?: WindmillModule;
  };
  schema: any;
}

export interface WindmillModule {
  id: string;
  value: {
    type: 'script' | 'flow' | 'rawscript';
    path?: string;
    content?: string;
    language?: string;
    input_transforms?: Record<string, any>;
  };
  summary?: string;
  suspend?: {
    required_events?: number;
    timeout?: number;
  };
}

export interface TranslationResult {
  scripts: WindmillScript[];
  flow: WindmillFlow;
  errors: string[];
  warnings: string[];
}

export class WindmillTranslator {
  private workspaceName: string;
  private agentName: string;

  constructor(workspaceName: string, agentName: string) {
    this.workspaceName = workspaceName;
    this.agentName = agentName;
  }

  translateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): TranslationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const scripts: WindmillScript[] = [];

    try {
      // Validate workflow structure
      this.validateWorkflow(nodes, edges, errors);

      // Generate scripts for each node
      for (const node of nodes) {
        try {
          const script = this.generateScript(node);
          scripts.push(script);
        } catch (error) {
          errors.push(`Failed to generate script for node ${node.id}: ${error}`);
        }
      }

      // Generate flow definition
      const flow = this.generateFlow(nodes, edges, scripts);

      // Add warnings for best practices
      this.addBestPracticeWarnings(nodes, edges, warnings);

      return { scripts, flow, errors, warnings };
    } catch (error) {
      errors.push(`Translation failed: ${error}`);
      return { 
        scripts: [], 
        flow: this.getEmptyFlow(), 
        errors, 
        warnings 
      };
    }
  }

  private validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[], errors: string[]): void {
    // Check for empty workflow
    if (nodes.length === 0) {
      errors.push('Workflow cannot be empty');
      return;
    }

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (nodes.length > 1 && !connectedNodes.has(node.id)) {
        errors.push(`Node "${node.data.label}" is not connected to the workflow`);
      }
    });

    // Check for circular dependencies
    if (this.hasCircularDependency(nodes, edges)) {
      errors.push('Workflow contains circular dependencies');
    }

    // Validate individual nodes
    nodes.forEach(node => {
      const nodeErrors = this.validateNode(node);
      errors.push(...nodeErrors);
    });
  }

  private validateNode(node: WorkflowNode): string[] {
    const errors: string[] = [];
    const config = node.data.config;

    switch (node.type) {
      case 'prompt':
        if (!config.instruction?.trim()) {
          errors.push(`Prompt node "${node.data.label}" is missing instruction`);
        }
        break;
      case 'tool':
        if (!config.service) {
          errors.push(`Tool node "${node.data.label}" is missing service configuration`);
        }
        if (config.service === 'http' && !config.parameters?.url) {
          errors.push(`HTTP tool node "${node.data.label}" is missing URL`);
        }
        break;
      case 'logic':
        if (!config.condition?.trim()) {
          errors.push(`Logic node "${node.data.label}" is missing condition`);
        }
        break;
      case 'memory':
        if (!config.key?.trim()) {
          errors.push(`Memory node "${node.data.label}" is missing key`);
        }
        break;
      case 'integration':
        if (!config.integrationId) {
          errors.push(`Integration node "${node.data.label}" is missing integration ID`);
        }
        break;
    }

    return errors;
  }

  private hasCircularDependency(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
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
      if (hasCycle(node.id)) return true;
    }

    return false;
  }

  private generateScript(node: WorkflowNode): WindmillScript {
    const scriptName = this.getScriptName(node);
    
    switch (node.type) {
      case 'prompt':
        return this.generatePromptScript(node, scriptName);
      case 'tool':
        return this.generateToolScript(node, scriptName);
      case 'logic':
        return this.generateLogicScript(node, scriptName);
      case 'memory':
        return this.generateMemoryScript(node, scriptName);
      case 'integration':
        return this.generateIntegrationScript(node, scriptName);
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  private getScriptName(node: WorkflowNode): string {
    const sanitized = node.data.label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return `${this.agentName}_${node.type}_${sanitized}`;
  }

  private generatePromptScript(node: WorkflowNode, scriptName: string): WindmillScript {
    const config = node.data.config;
    
    return {
      name: scriptName,
      language: 'typescript',
      description: `AI Prompt: ${node.data.description || node.data.label}`,
      schema: {
        type: 'object',
        properties: {
          input: { type: 'object', description: 'Input data for the prompt' },
          context: { type: 'object', description: 'Additional context variables' }
        }
      },
      content: `
// AI Prompt Script: ${node.data.label}
// Generated from AgentFlow workflow

export async function main(input: any, context: any = {}) {
  const instruction = \`${config.instruction || ''}\`;
  const model = "${config.model || 'gpt-4'}";
  const temperature = ${config.temperature || 0.7};
  const maxTokens = ${config.maxTokens || 1000};
  
  // Process instruction with variable substitution
  let processedInstruction = instruction;
  
  // Replace variables from input
  if (input && typeof input === 'object') {
    Object.keys(input).forEach(key => {
      const regex = new RegExp(\`{{\\s*\${key}\\s*}}\`, 'g');
      processedInstruction = processedInstruction.replace(regex, String(input[key] || ''));
    });
  }
  
  // Replace variables from context
  if (context && typeof context === 'object') {
    Object.keys(context).forEach(key => {
      const regex = new RegExp(\`{{\\s*\${key}\\s*}}\`, 'g');
      processedInstruction = processedInstruction.replace(regex, String(context[key] || ''));
    });
  }
  
  try {
    // Call AI service (implement your preferred AI API)
    const response = await callAIService(processedInstruction, {
      model,
      temperature,
      max_tokens: maxTokens
    });
    
    return {
      success: true,
      response: response.text,
      model: model,
      tokens_used: response.usage?.total_tokens || 0,
      instruction: processedInstruction,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI API call failed:', error);
    throw new Error(\`AI processing failed: \${error.message}\`);
  }
}

async function callAIService(instruction: string, options: any) {
  // TODO: Implement your AI service integration
  // This could be OpenAI, Anthropic, or any other AI API
  
  // Example OpenAI integration:
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: 'user', content: instruction }],
      temperature: options.temperature,
      max_tokens: options.max_tokens
    })
  });
  
  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    usage: data.usage
  };
  */
  
  // Placeholder implementation
  return {
    text: \`AI response to: \${instruction}\`,
    usage: { total_tokens: 100 }
  };
}
      `
    };
  }

  private generateToolScript(node: WorkflowNode, scriptName: string): WindmillScript {
    const config = node.data.config;
    
    if (config.service === 'http') {
      return this.generateHttpToolScript(node, scriptName, config);
    }
    
    return {
      name: scriptName,
      language: 'typescript',
      description: `Tool: ${node.data.description || node.data.label}`,
      schema: {
        type: 'object',
        properties: {
          input: { type: 'object', description: 'Input data for the tool' }
        }
      },
      content: `
// Tool Script: ${node.data.label}
export async function main(input: any) {
  const service = "${config.service}";
  const action = "${config.action}";
  
  console.log(\`Executing \${service} tool with action: \${action}\`);
  
  // TODO: Implement specific tool logic based on service type
  return {
    success: true,
    service: service,
    action: action,
    result: "Tool execution completed",
    input: input,
    timestamp: new Date().toISOString()
  };
}
      `
    };
  }

  private generateHttpToolScript(node: WorkflowNode, scriptName: string, config: any): WindmillScript {
    const params = config.parameters || {};
    
    return {
      name: scriptName,
      language: 'typescript',
      description: `HTTP Request: ${node.data.description || node.data.label}`,
      schema: {
        type: 'object',
        properties: {
          input: { type: 'object', description: 'Input data for the HTTP request' },
          url_params: { type: 'object', description: 'URL parameters to substitute' }
        }
      },
      content: `
// HTTP Request Script: ${node.data.label}
export async function main(input: any, url_params: any = {}) {
  let url = "${params.url || ''}";
  const method = "${params.method || 'GET'}";
  const headers = ${JSON.stringify(params.headers || {}, null, 2)};
  let body = ${JSON.stringify(params.body || null, null, 2)};
  
  // Substitute URL parameters
  if (url_params && typeof url_params === 'object') {
    Object.keys(url_params).forEach(key => {
      url = url.replace(\`{{\${key}}\`, String(url_params[key]));
    });
  }
  
  // Substitute input data in body
  if (body && input && typeof input === 'object') {
    let bodyStr = JSON.stringify(body);
    Object.keys(input).forEach(key => {
      const regex = new RegExp(\`"{{\\s*\${key}\\s*}}"\`, 'g');
      bodyStr = bodyStr.replace(regex, JSON.stringify(input[key]));
    });
    body = JSON.parse(bodyStr);
  }
  
  try {
    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (method !== 'GET' && body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    console.log(\`Making \${method} request to: \${url}\`);
    
    const response = await fetch(url, requestOptions);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      url: url,
      method: method,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('HTTP request failed:', error);
    throw new Error(\`HTTP request failed: \${error.message}\`);
  }
}
      `
    };
  }

  private generateLogicScript(node: WorkflowNode, scriptName: string): WindmillScript {
    const config = node.data.config;
    
    return {
      name: scriptName,
      language: 'typescript',
      description: `Logic: ${node.data.description || node.data.label}`,
      schema: {
        type: 'object',
        properties: {
          input: { type: 'object', description: 'Input data for condition evaluation' }
        }
      },
      content: `
// Logic Script: ${node.data.label}
export async function main(input: any) {
  const condition = \`${config.condition || ''}\`;
  const logicType = "${config.type || 'if-else'}";
  
  console.log(\`Evaluating condition: \${condition}\`);
  
  try {
    let result = false;
    
    if (logicType === 'filter') {
      // Filter logic for arrays
      if (Array.isArray(input)) {
        const filtered = input.filter(item => evaluateCondition(condition, item));
        return {
          success: true,
          type: 'filter',
          condition: condition,
          input_count: input.length,
          output_count: filtered.length,
          result: filtered,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Filter logic requires array input');
      }
    } else {
      // Standard if-else logic
      result = evaluateCondition(condition, input);
      
      return {
        success: true,
        type: logicType,
        condition: condition,
        result: result,
        input: input,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Logic evaluation failed:', error);
    throw new Error(\`Logic evaluation failed: \${error.message}\`);
  }
}

function evaluateCondition(condition: string, context: any): boolean {
  // Safe condition evaluation
  // This is a simplified implementation - in production, use a proper expression parser
  
  try {
    // Handle simple equality checks
    if (condition.includes('===')) {
      const [left, right] = condition.split('===').map(s => s.trim());
      return getValue(left, context) === getValue(right, context);
    }
    
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map(s => s.trim());
      return getValue(left, context) == getValue(right, context);
    }
    
    if (condition.includes('!=')) {
      const [left, right] = condition.split('!=').map(s => s.trim());
      return getValue(left, context) != getValue(right, context);
    }
    
    if (condition.includes('>')) {
      const [left, right] = condition.split('>').map(s => s.trim());
      return Number(getValue(left, context)) > Number(getValue(right, context));
    }
    
    if (condition.includes('<')) {
      const [left, right] = condition.split('<').map(s => s.trim());
      return Number(getValue(left, context)) < Number(getValue(right, context));
    }
    
    // Default to false for unknown conditions
    return false;
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
}

function getValue(expression: string, context: any): any {
  // Remove quotes for string literals
  if ((expression.startsWith('"') && expression.endsWith('"')) ||
      (expression.startsWith("'") && expression.endsWith("'"))) {
    return expression.slice(1, -1);
  }
  
  // Handle numeric literals
  if (!isNaN(Number(expression))) {
    return Number(expression);
  }
  
  // Handle object property access
  if (expression.includes('.')) {
    const parts = expression.split('.');
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }
  
  // Direct property access
  return context?.[expression];
}
      `
    };
  }

  private generateMemoryScript(node: WorkflowNode, scriptName: string): WindmillScript {
    const config = node.data.config;
    
    return {
      name: scriptName,
      language: 'typescript',
      description: `Memory: ${node.data.description || node.data.label}`,
      schema: {
        type: 'object',
        properties: {
          input: { type: 'object', description: 'Data to store or retrieve' }
        }
      },
      content: `
// Memory Script: ${node.data.label}
export async function main(input: any) {
  const operation = "${config.operation || 'store'}";
  const key = "${config.key || ''}";
  const scope = "${config.scope || 'session'}";
  
  console.log(\`Memory operation: \${operation} with key: \${key}\`);
  
  try {
    switch (operation) {
      case 'store':
        await storeData(key, input, scope);
        return {
          success: true,
          operation: 'store',
          key: key,
          scope: scope,
          stored: true,
          timestamp: new Date().toISOString()
        };
      
      case 'retrieve':
        const data = await retrieveData(key, scope);
        return {
          success: true,
          operation: 'retrieve',
          key: key,
          scope: scope,
          data: data,
          timestamp: new Date().toISOString()
        };
      
      case 'update':
        await updateData(key, input, scope);
        return {
          success: true,
          operation: 'update',
          key: key,
          scope: scope,
          updated: true,
          timestamp: new Date().toISOString()
        };
      
      case 'delete':
        await deleteData(key, scope);
        return {
          success: true,
          operation: 'delete',
          key: key,
          scope: scope,
          deleted: true,
          timestamp: new Date().toISOString()
        };
      
      default:
        throw new Error(\`Unknown memory operation: \${operation}\`);
    }
  } catch (error) {
    console.error('Memory operation failed:', error);
    throw new Error(\`Memory operation failed: \${error.message}\`);
  }
}

async function storeData(key: string, value: any, scope: string) {
  // TODO: Implement actual storage based on scope
  // This could use Windmill's state, external database, or file system
  
  const storageKey = \`\${scope}:\${key}\`;
  
  // Example using Windmill's internal state (if available)
  // await Deno.env.set(storageKey, JSON.stringify(value));
  
  console.log(\`Stored data for key: \${storageKey}\`);
}

async function retrieveData(key: string, scope: string): Promise<any> {
  // TODO: Implement actual retrieval based on scope
  
  const storageKey = \`\${scope}:\${key}\`;
  
  // Example using Windmill's internal state (if available)
  // const stored = await Deno.env.get(storageKey);
  // return stored ? JSON.parse(stored) : null;
  
  console.log(\`Retrieved data for key: \${storageKey}\`);
  return null; // Placeholder
}

async function updateData(key: string, value: any, scope: string) {
  // Update is essentially the same as store for most implementations
  await storeData(key, value, scope);
}

async function deleteData(key: string, scope: string) {
  // TODO: Implement actual deletion based on scope
  
  const storageKey = \`\${scope}:\${key}\`;
  
  // Example using Windmill's internal state (if available)
  // await Deno.env.delete(storageKey);
  
  console.log(\`Deleted data for key: \${storageKey}\`);
}
      `
    };
  }

  private generateIntegrationScript(node: WorkflowNode, scriptName: string): WindmillScript {
    const config = node.data.config;
    
    return {
      name: scriptName,
      language: 'typescript',
      description: `Integration: ${node.data.description || node.data.label}`,
      schema: {
        type: 'object',
        properties: {
          input: { type: 'object', description: 'Input data for the integration' }
        }
      },
      content: `
// Integration Script: ${node.data.label}
export async function main(input: any) {
  const integrationId = "${config.integrationId || ''}";
  const endpoint = "${config.endpoint || ''}";
  const method = "${config.method || 'GET'}";
  const headers = ${JSON.stringify(config.headers || {}, null, 2)};
  let body = ${JSON.stringify(config.body || null, null, 2)};
  
  console.log(\`Calling integration \${integrationId} at endpoint: \${endpoint}\`);
  
  try {
    // Get integration credentials (implement based on your credential storage)
    const credentials = await getIntegrationCredentials(integrationId);
    
    // Prepare request headers with authentication
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...getAuthHeaders(credentials)
    };
    
    // Substitute input data in body
    if (body && input && typeof input === 'object') {
      let bodyStr = JSON.stringify(body);
      Object.keys(input).forEach(key => {
        const regex = new RegExp(\`"{{\\s*\${key}\\s*}}"\`, 'g');
        bodyStr = bodyStr.replace(regex, JSON.stringify(input[key]));
      });
      body = JSON.parse(bodyStr);
    }
    
    const requestOptions: RequestInit = {
      method: method,
      headers: requestHeaders
    };
    
    if (method !== 'GET' && body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    // Construct full URL (base URL from integration + endpoint)
    const baseUrl = getIntegrationBaseUrl(integrationId);
    const fullUrl = \`\${baseUrl}\${endpoint}\`;
    
    const response = await fetch(fullUrl, requestOptions);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Apply response mapping if configured
    const mappedResponse = applyResponseMapping(responseData, ${JSON.stringify(config.responseMapping || {})});
    
    return {
      success: response.ok,
      integration_id: integrationId,
      endpoint: endpoint,
      status: response.status,
      data: mappedResponse,
      raw_response: responseData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Integration call failed:', error);
    throw new Error(\`Integration call failed: \${error.message}\`);
  }
}

async function getIntegrationCredentials(integrationId: string): Promise<any> {
  // TODO: Implement credential retrieval from secure storage
  // This should fetch encrypted credentials for the integration
  
  console.log(\`Getting credentials for integration: \${integrationId}\`);
  return {}; // Placeholder
}

function getAuthHeaders(credentials: any): Record<string, string> {
  // TODO: Implement authentication header generation based on credential type
  // This could be API key, OAuth token, basic auth, etc.
  
  if (credentials.api_key) {
    return { 'Authorization': \`Bearer \${credentials.api_key}\` };
  }
  
  if (credentials.username && credentials.password) {
    const encoded = btoa(\`\${credentials.username}:\${credentials.password}\`);
    return { 'Authorization': \`Basic \${encoded}\` };
  }
  
  return {};
}

function getIntegrationBaseUrl(integrationId: string): string {
  // TODO: Implement base URL lookup for different integrations
  // This should return the appropriate API base URL for the service
  
  const baseUrls: Record<string, string> = {
    'slack': 'https://slack.com/api',
    'notion': 'https://api.notion.com/v1',
    'github': 'https://api.github.com',
    // Add more as needed
  };
  
  return baseUrls[integrationId] || 'https://api.example.com';
}

function applyResponseMapping(response: any, mapping: Record<string, string>): any {
  if (!mapping || Object.keys(mapping).length === 0) {
    return response;
  }
  
  const mapped: any = {};
  
  Object.entries(mapping).forEach(([outputKey, responsePath]) => {
    mapped[outputKey] = getNestedValue(response, responsePath);
  });
  
  return mapped;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
      `
    };
  }

  private generateFlow(nodes: WorkflowNode[], edges: WorkflowEdge[], scripts: WindmillScript[]): WindmillFlow {
    const modules: WindmillModule[] = [];
    
    // Create modules for each script
    scripts.forEach((script, index) => {
      const node = nodes[index];
      const module: WindmillModule = {
        id: node.id,
        value: {
          type: 'script',
          path: `${this.workspaceName}/${script.name}`,
          input_transforms: this.generateInputTransforms(node, edges)
        },
        summary: node.data.label
      };
      
      modules.push(module);
    });
    
    return {
      summary: `${this.agentName} - AI Agent Workflow`,
      description: `Generated workflow for ${this.agentName} agent`,
      value: {
        modules,
        failure_module: {
          id: 'failure_handler',
          value: {
            type: 'rawscript',
            content: `
console.error('Workflow failed:', error);
return {
  success: false,
  error: error.message,
  timestamp: new Date().toISOString(),
  workflow: "${this.agentName}"
};
            `,
            language: 'typescript'
          }
        }
      },
      schema: this.generateFlowSchema(nodes)
    };
  }

  private generateInputTransforms(node: WorkflowNode, edges: WorkflowEdge[]): Record<string, any> {
    const transforms: Record<string, any> = {};
    
    // Find incoming edges to this node
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    if (incomingEdges.length === 0) {
      // Entry node - use flow input
      transforms.input = { expr: 'flow_input' };
    } else {
      // Use output from previous steps
      incomingEdges.forEach((edge, index) => {
        const inputKey = index === 0 ? 'input' : `input_${index}`;
        transforms[inputKey] = { expr: `results.${edge.source}` };
      });
    }
    
    return transforms;
  }

  private generateFlowSchema(nodes: WorkflowNode[]): any {
    return {
      type: 'object',
      properties: {
        flow_input: {
          type: 'object',
          description: 'Input data for the workflow',
          properties: {
            data: { type: 'object', description: 'Main input data' },
            context: { type: 'object', description: 'Additional context' }
          }
        }
      },
      required: ['flow_input']
    };
  }

  private addBestPracticeWarnings(nodes: WorkflowNode[], edges: WorkflowEdge[], warnings: string[]): void {
    // Check for long linear chains
    const maxChainLength = 10;
    if (nodes.length > maxChainLength) {
      warnings.push(`Workflow has ${nodes.length} nodes. Consider breaking into smaller workflows for better maintainability.`);
    }
    
    // Check for nodes without error handling
    nodes.forEach(node => {
      if (node.type === 'tool' || node.type === 'integration') {
        warnings.push(`Consider adding error handling for ${node.type} node "${node.data.label}"`);
      }
    });
    
    // Check for missing descriptions
    const noDescriptionNodes = nodes.filter(node => !node.data.description?.trim());
    if (noDescriptionNodes.length > 0) {
      warnings.push(`${noDescriptionNodes.length} nodes are missing descriptions. Add descriptions for better documentation.`);
    }
  }

  private getEmptyFlow(): WindmillFlow {
    return {
      summary: 'Empty Workflow',
      description: 'Failed to generate workflow',
      value: { modules: [] },
      schema: { type: 'object', properties: {} }
    };
  }
}