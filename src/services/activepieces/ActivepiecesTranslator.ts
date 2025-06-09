import { WorkflowNode, WorkflowEdge } from '../../types/workflow';

export interface ActivepiecesStep {
  name: string;
  displayName: string;
  type: 'PIECE' | 'CODE' | 'BRANCH' | 'LOOP';
  settings: {
    pieceName?: string;
    pieceVersion?: string;
    actionName?: string;
    input?: any;
    inputUiInfo?: any;
  };
  nextAction?: {
    [key: string]: string;
  };
}

export interface ActivepiecesFlowVersion {
  displayName: string;
  trigger: {
    name: string;
    displayName: string;
    type: 'WEBHOOK' | 'SCHEDULE' | 'PIECE_TRIGGER';
    settings: any;
    nextAction?: string;
  };
  actions: {
    [key: string]: ActivepiecesStep;
  };
}

export interface TranslationResult {
  flowVersion: ActivepiecesFlowVersion;
  errors: string[];
  warnings: string[];
}

export class ActivepiecesTranslator {
  private agentName: string;

  constructor(agentName: string) {
    this.agentName = agentName;
  }

  translateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): TranslationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate workflow structure
      this.validateWorkflow(nodes, edges, errors);

      if (errors.length > 0) {
        return {
          flowVersion: this.getEmptyFlowVersion(),
          errors,
          warnings
        };
      }

      // Find entry point (trigger node)
      const entryNodes = nodes.filter(node => 
        !edges.some(edge => edge.target === node.id)
      );

      if (entryNodes.length === 0) {
        errors.push('No entry point found in workflow');
        return {
          flowVersion: this.getEmptyFlowVersion(),
          errors,
          warnings
        };
      }

      if (entryNodes.length > 1) {
        warnings.push('Multiple entry points found, using the first one');
      }

      // Create trigger from first entry node
      const triggerNode = entryNodes[0];
      const trigger = this.createTrigger(triggerNode);

      // Convert nodes to actions
      const actions: { [key: string]: ActivepiecesStep } = {};
      const actionNodes = nodes.filter(node => node.id !== triggerNode.id);

      for (const node of actionNodes) {
        try {
          const action = this.convertNodeToAction(node, edges);
          actions[node.id] = action;
        } catch (error) {
          errors.push(`Failed to convert node ${node.id}: ${error}`);
        }
      }

      // Set up flow connections
      this.setupFlowConnections(trigger, actions, edges, triggerNode.id);

      const flowVersion: ActivepiecesFlowVersion = {
        displayName: this.agentName,
        trigger,
        actions
      };

      // Add best practice warnings
      this.addBestPracticeWarnings(nodes, edges, warnings);

      return { flowVersion, errors, warnings };
    } catch (error) {
      errors.push(`Translation failed: ${error}`);
      return {
        flowVersion: this.getEmptyFlowVersion(),
        errors,
        warnings
      };
    }
  }

  private validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[], errors: string[]): void {
    if (nodes.length === 0) {
      errors.push('Workflow cannot be empty');
      return;
    }

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

  private createTrigger(node: WorkflowNode): any {
    return {
      name: 'webhook_trigger',
      displayName: 'Webhook Trigger',
      type: 'WEBHOOK',
      settings: {
        inputUiInfo: {},
        input: {}
      },
      nextAction: this.getNextActionId(node.id, [])
    };
  }

  private convertNodeToAction(node: WorkflowNode, edges: WorkflowEdge[]): ActivepiecesStep {
    const nextActionId = this.getNextActionId(node.id, edges);

    switch (node.type) {
      case 'prompt':
        return this.createPromptAction(node, nextActionId);
      case 'tool':
        return this.createToolAction(node, nextActionId);
      case 'logic':
        return this.createLogicAction(node, nextActionId);
      case 'memory':
        return this.createMemoryAction(node, nextActionId);
      case 'integration':
        return this.createIntegrationAction(node, nextActionId);
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  private createPromptAction(node: WorkflowNode, nextActionId?: string): ActivepiecesStep {
    const config = node.data.config;
    
    return {
      name: node.id,
      displayName: node.data.label,
      type: 'CODE',
      settings: {
        input: {
          instruction: config.instruction || '',
          model: config.model || 'gpt-4',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 1000
        },
        inputUiInfo: {}
      },
      nextAction: nextActionId ? { success: nextActionId } : undefined
    };
  }

  private createToolAction(node: WorkflowNode, nextActionId?: string): ActivepiecesStep {
    const config = node.data.config;
    
    if (config.service === 'http') {
      return {
        name: node.id,
        displayName: node.data.label,
        type: 'PIECE',
        settings: {
          pieceName: '@activepieces/piece-http',
          pieceVersion: '~0.3.0',
          actionName: 'send_request',
          input: {
            method: config.parameters?.method || 'GET',
            url: config.parameters?.url || '',
            headers: config.parameters?.headers || {},
            body: config.parameters?.body || null
          },
          inputUiInfo: {}
        },
        nextAction: nextActionId ? { success: nextActionId } : undefined
      };
    }

    // Generic tool action
    return {
      name: node.id,
      displayName: node.data.label,
      type: 'CODE',
      settings: {
        input: {
          service: config.service,
          action: config.action,
          parameters: config.parameters || {}
        },
        inputUiInfo: {}
      },
      nextAction: nextActionId ? { success: nextActionId } : undefined
    };
  }

  private createLogicAction(node: WorkflowNode, nextActionId?: string): ActivepiecesStep {
    const config = node.data.config;
    
    return {
      name: node.id,
      displayName: node.data.label,
      type: 'BRANCH',
      settings: {
        input: {
          condition: config.condition || '',
          type: config.type || 'if-else'
        },
        inputUiInfo: {}
      },
      nextAction: nextActionId ? { 
        true: nextActionId,
        false: nextActionId 
      } : undefined
    };
  }

  private createMemoryAction(node: WorkflowNode, nextActionId?: string): ActivepiecesStep {
    const config = node.data.config;
    
    return {
      name: node.id,
      displayName: node.data.label,
      type: 'CODE',
      settings: {
        input: {
          operation: config.operation || 'store',
          key: config.key || '',
          value: config.value || '',
          scope: config.scope || 'session'
        },
        inputUiInfo: {}
      },
      nextAction: nextActionId ? { success: nextActionId } : undefined
    };
  }

  private createIntegrationAction(node: WorkflowNode, nextActionId?: string): ActivepiecesStep {
    const config = node.data.config;
    
    return {
      name: node.id,
      displayName: node.data.label,
      type: 'PIECE',
      settings: {
        pieceName: this.mapIntegrationToPiece(config.integrationId),
        pieceVersion: '~0.1.0',
        actionName: 'send_request',
        input: {
          endpoint: config.endpoint || '',
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.body || null
        },
        inputUiInfo: {}
      },
      nextAction: nextActionId ? { success: nextActionId } : undefined
    };
  }

  private mapIntegrationToPiece(integrationId: string): string {
    const mapping: { [key: string]: string } = {
      'slack': '@activepieces/piece-slack',
      'notion': '@activepieces/piece-notion',
      'gmail': '@activepieces/piece-gmail',
      'github': '@activepieces/piece-github',
      'discord': '@activepieces/piece-discord',
      'airtable': '@activepieces/piece-airtable',
      'google-sheets': '@activepieces/piece-google-sheets'
    };
    
    return mapping[integrationId] || '@activepieces/piece-http';
  }

  private getNextActionId(currentNodeId: string, edges: WorkflowEdge[]): string | undefined {
    const outgoingEdge = edges.find(edge => edge.source === currentNodeId);
    return outgoingEdge?.target;
  }

  private setupFlowConnections(
    trigger: any, 
    actions: { [key: string]: ActivepiecesStep }, 
    edges: WorkflowEdge[], 
    triggerNodeId: string
  ): void {
    // Set trigger's next action
    const firstEdge = edges.find(edge => edge.source === triggerNodeId);
    if (firstEdge) {
      trigger.nextAction = firstEdge.target;
    }

    // Update all action connections
    Object.keys(actions).forEach(actionId => {
      const outgoingEdges = edges.filter(edge => edge.source === actionId);
      if (outgoingEdges.length > 0) {
        const nextActionId = outgoingEdges[0].target;
        if (actions[actionId].nextAction) {
          // For branch actions, update all branches
          if (typeof actions[actionId].nextAction === 'object') {
            Object.keys(actions[actionId].nextAction!).forEach(key => {
              actions[actionId].nextAction![key] = nextActionId;
            });
          } else {
            actions[actionId].nextAction = { success: nextActionId };
          }
        }
      }
    });
  }

  private addBestPracticeWarnings(nodes: WorkflowNode[], edges: WorkflowEdge[], warnings: string[]): void {
    if (nodes.length > 10) {
      warnings.push(`Workflow has ${nodes.length} nodes. Consider breaking into smaller workflows for better performance.`);
    }

    const noDescriptionNodes = nodes.filter(node => !node.data.description?.trim());
    if (noDescriptionNodes.length > 0) {
      warnings.push(`${noDescriptionNodes.length} nodes are missing descriptions.`);
    }
  }

  private getEmptyFlowVersion(): ActivepiecesFlowVersion {
    return {
      displayName: 'Empty Workflow',
      trigger: {
        name: 'webhook_trigger',
        displayName: 'Webhook Trigger',
        type: 'WEBHOOK',
        settings: {}
      },
      actions: {}
    };
  }
}