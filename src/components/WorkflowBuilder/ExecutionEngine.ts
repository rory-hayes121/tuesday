import { WorkflowNode, WorkflowEdge, WorkflowExecution, ExecutionStep } from '../../types/workflow';

export class ExecutionEngine {
  private execution: WorkflowExecution;
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];

  constructor(nodes: WorkflowNode[], edges: WorkflowEdge[], input: any = {}) {
    this.nodes = nodes;
    this.edges = edges;
    this.execution = {
      id: `exec-${Date.now()}`,
      workflowId: 'current',
      status: 'running',
      startedAt: new Date().toISOString(),
      input,
      steps: []
    };
  }

  async execute(): Promise<WorkflowExecution> {
    try {
      // Find entry points (nodes with no incoming edges)
      const entryNodes = this.nodes.filter(node => 
        !this.edges.some(edge => edge.target === node.id)
      );

      if (entryNodes.length === 0) {
        throw new Error('No entry point found in workflow');
      }

      // Execute from each entry point
      for (const entryNode of entryNodes) {
        await this.executeNode(entryNode, this.execution.input);
      }

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      
    } catch (error) {
      this.execution.status = 'failed';
      this.execution.error = error instanceof Error ? error.message : 'Unknown error';
      this.execution.completedAt = new Date().toISOString();
    }

    return this.execution;
  }

  private async executeNode(node: WorkflowNode, input: any): Promise<any> {
    const step: ExecutionStep = {
      nodeId: node.id,
      status: 'running',
      startedAt: new Date().toISOString(),
      input
    };

    this.execution.steps.push(step);

    try {
      let output: any;

      switch (node.type) {
        case 'prompt':
          output = await this.executePromptNode(node, input);
          break;
        case 'tool':
          output = await this.executeToolNode(node, input);
          break;
        case 'logic':
          output = await this.executeLogicNode(node, input);
          break;
        case 'memory':
          output = await this.executeMemoryNode(node, input);
          break;
        case 'integration':
          output = await this.executeIntegrationNode(node, input);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.output = output;
      step.duration = Date.now() - new Date(step.startedAt!).getTime();

      // Execute connected nodes
      const outgoingEdges = this.edges.filter(edge => edge.source === node.id);
      for (const edge of outgoingEdges) {
        const nextNode = this.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(nextNode, output);
        }
      }

      return output;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.completedAt = new Date().toISOString();
      step.duration = Date.now() - new Date(step.startedAt!).getTime();
      throw error;
    }
  }

  private async executePromptNode(node: WorkflowNode, input: any): Promise<any> {
    const config = node.data.config;
    
    // Simulate AI API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Replace variables in instruction
    let instruction = config.instruction || '';
    if (typeof input === 'object' && input !== null) {
      Object.keys(input).forEach(key => {
        instruction = instruction.replace(new RegExp(`{{${key}}}`, 'g'), input[key]);
      });
    }

    return {
      response: `AI response to: ${instruction}`,
      model: config.model,
      tokens: Math.floor(Math.random() * 500) + 100
    };
  }

  private async executeToolNode(node: WorkflowNode, input: any): Promise<any> {
    const config = node.data.config;
    
    if (config.service === 'http') {
      // Simulate HTTP request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        status: 200,
        data: { message: 'HTTP request successful', input },
        headers: { 'content-type': 'application/json' }
      };
    }

    return { result: 'Tool execution completed', input };
  }

  private async executeLogicNode(node: WorkflowNode, input: any): Promise<any> {
    const config = node.data.config;
    
    // Simple condition evaluation
    const condition = config.condition || '';
    let result = false;

    try {
      // Basic condition evaluation (in production, use a safe expression evaluator)
      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map(s => s.trim());
        result = this.evaluateExpression(left, input) === this.evaluateExpression(right, input);
      } else if (condition.includes('==')) {
        const [left, right] = condition.split('==').map(s => s.trim());
        result = this.evaluateExpression(left, input) == this.evaluateExpression(right, input);
      }
    } catch (error) {
      console.error('Condition evaluation error:', error);
    }

    return { condition: result, input };
  }

  private async executeMemoryNode(node: WorkflowNode, input: any): Promise<any> {
    const config = node.data.config;
    
    // Simulate memory operations
    switch (config.operation) {
      case 'store':
        // Store data in memory (would use actual storage in production)
        return { stored: true, key: config.key, value: input };
      case 'retrieve':
        // Retrieve data from memory
        return { retrieved: `data for ${config.key}` };
      default:
        return { operation: config.operation, input };
    }
  }

  private async executeIntegrationNode(node: WorkflowNode, input: any): Promise<any> {
    const config = node.data.config;
    
    // Simulate integration API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      integration: config.integrationId,
      endpoint: config.endpoint,
      method: config.method,
      response: { success: true, data: input }
    };
  }

  private evaluateExpression(expr: string, context: any): any {
    // Simple expression evaluator for demo purposes
    // In production, use a proper expression parser/evaluator
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }
    
    if (expr.includes('.')) {
      const parts = expr.split('.');
      let value = context;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }
    
    return context[expr] || expr;
  }

  getExecution(): WorkflowExecution {
    return this.execution;
  }
}