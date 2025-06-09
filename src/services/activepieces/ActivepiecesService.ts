import { ActivepiecesClient, ActivepiecesConfig, ActivepiecesFlow, ActivepiecesFlowRun, ActivepiecesApp } from './ActivepiecesClient';
import { ActivepiecesTranslator, TranslationResult } from './ActivepiecesTranslator';
import { WorkflowNode, WorkflowEdge } from '../../types/workflow';

export interface ActivepiecesDeployment {
  id: string;
  agentId: string;
  agentName: string;
  flowId: string;
  projectId: string;
  deployedAt: string;
  status: 'active' | 'inactive' | 'failed';
  version: string;
}

export interface ExecutionResult {
  success: boolean;
  runId?: string;
  status?: string;
  result?: any;
  error?: string;
  logs?: string[];
}

export class ActivepiecesService {
  private client: ActivepiecesClient;
  private translator: ActivepiecesTranslator;

  constructor(config: ActivepiecesConfig) {
    this.client = new ActivepiecesClient(config);
    this.translator = new ActivepiecesTranslator('');
  }

  // Workflow Management
  async deployAgent(
    agentId: string,
    agentName: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    projectId: string
  ): Promise<{ deployment?: ActivepiecesDeployment; errors: string[] }> {
    try {
      // Update translator with agent name
      this.translator = new ActivepiecesTranslator(agentName);

      // Translate workflow to Activepieces format
      const translation: TranslationResult = this.translator.translateWorkflow(nodes, edges);

      if (translation.errors.length > 0) {
        return { errors: translation.errors };
      }

      // Create flow in Activepieces
      const flow = await this.client.createFlow({
        displayName: agentName,
        projectId
      });

      // Update flow with the translated workflow
      const updatedFlow = await this.client.updateFlow(flow.id, {
        version: {
          ...flow.version,
          ...translation.flowVersion
        }
      });

      // Create deployment record
      const deployment: ActivepiecesDeployment = {
        id: `deploy_${Date.now()}`,
        agentId,
        agentName,
        flowId: updatedFlow.id,
        projectId,
        deployedAt: new Date().toISOString(),
        status: 'active',
        version: '1.0'
      };

      return { deployment, errors: translation.warnings };
    } catch (error) {
      return { errors: [`Deployment failed: ${error}`] };
    }
  }

  async triggerWorkflow(flowId: string, projectId: string, input: any = {}): Promise<ExecutionResult> {
    try {
      const flowRun = await this.client.triggerFlow({
        flowId,
        projectId,
        payload: input
      });

      return {
        success: true,
        runId: flowRun.id,
        status: flowRun.status
      };
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error}`
      };
    }
  }

  async getExecutionStatus(runId: string): Promise<ActivepiecesFlowRun> {
    return await this.client.getFlowRun(runId);
  }

  async getExecutionLogs(runId: string): Promise<string[]> {
    return await this.client.getFlowRunLogs(runId);
  }

  async getExecutionResult(runId: string): Promise<ExecutionResult> {
    try {
      const flowRun = await this.client.getFlowRun(runId);
      const logs = await this.client.getFlowRunLogs(runId);

      return {
        success: flowRun.status === 'SUCCEEDED',
        runId: flowRun.id,
        status: flowRun.status,
        logs
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get execution result: ${error}`
      };
    }
  }

  // Flow Management
  async listFlows(projectId: string): Promise<ActivepiecesFlow[]> {
    return await this.client.listFlows(projectId);
  }

  async getFlow(flowId: string): Promise<ActivepiecesFlow> {
    return await this.client.getFlow(flowId);
  }

  async deleteFlow(flowId: string): Promise<void> {
    await this.client.deleteFlow(flowId);
  }

  async updateDeployment(
    deployment: ActivepiecesDeployment,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<{ deployment?: ActivepiecesDeployment; errors: string[] }> {
    try {
      // Delete old flow
      await this.deleteFlow(deployment.flowId);

      // Create new deployment
      return await this.deployAgent(
        deployment.agentId,
        deployment.agentName,
        nodes,
        edges,
        deployment.projectId
      );
    } catch (error) {
      return { errors: [`Update failed: ${error}`] };
    }
  }

  // Integration Management
  async getAvailableIntegrations(): Promise<ActivepiecesApp[]> {
    return await this.client.getAvailableApps();
  }

  async getIntegration(appName: string): Promise<ActivepiecesApp> {
    return await this.client.getApp(appName);
  }

  // Project Management
  async createProject(name: string): Promise<{ id: string; displayName: string }> {
    return await this.client.createProject(name);
  }

  async getProject(projectId: string): Promise<{ id: string; displayName: string }> {
    return await this.client.getProject(projectId);
  }

  // Validation
  async validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<TranslationResult> {
    const tempTranslator = new ActivepiecesTranslator('validation');
    return tempTranslator.translateWorkflow(nodes, edges);
  }

  // Preview
  generatePreview(nodes: WorkflowNode[], edges: WorkflowEdge[]): TranslationResult {
    const tempTranslator = new ActivepiecesTranslator('preview_agent');
    return tempTranslator.translateWorkflow(nodes, edges);
  }
}