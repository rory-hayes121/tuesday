import { WindmillTranslator, TranslationResult } from './WindmillTranslator';
import { WindmillClient, WindmillConfig, DeploymentResult, ExecutionResult } from './WindmillClient';
import { WorkflowNode, WorkflowEdge } from '../../types/workflow';

export interface WindmillDeployment {
  id: string;
  agentId: string;
  agentName: string;
  flowPath: string;
  scriptPaths: string[];
  deployedAt: string;
  status: 'active' | 'inactive' | 'failed';
  version: string;
}

export class WindmillService {
  private client: WindmillClient;
  private translator: WindmillTranslator;

  constructor(config: WindmillConfig) {
    this.client = new WindmillClient(config);
    this.translator = new WindmillTranslator(config.workspace, '');
  }

  async deployAgent(
    agentId: string,
    agentName: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<{ deployment?: WindmillDeployment; errors: string[] }> {
    try {
      // Update translator with agent name
      this.translator = new WindmillTranslator(this.client['config'].workspace, agentName);

      // Translate workflow to Windmill format
      const translation: TranslationResult = this.translator.translateWorkflow(nodes, edges);

      if (translation.errors.length > 0) {
        return { errors: translation.errors };
      }

      // Deploy to Windmill
      const deploymentResult: DeploymentResult = await this.client.deployWorkflow(
        translation.scripts,
        translation.flow
      );

      if (!deploymentResult.success) {
        return { errors: deploymentResult.errors || ['Deployment failed'] };
      }

      // Create deployment record
      const deployment: WindmillDeployment = {
        id: deploymentResult.deploymentId!,
        agentId,
        agentName,
        flowPath: deploymentResult.flowPath!,
        scriptPaths: deploymentResult.scriptPaths!,
        deployedAt: new Date().toISOString(),
        status: 'active',
        version: '1.0'
      };

      return { deployment, errors: translation.warnings };
    } catch (error) {
      return { errors: [`Deployment failed: ${error}`] };
    }
  }

  async executeAgent(
    deployment: WindmillDeployment,
    input: any
  ): Promise<ExecutionResult> {
    try {
      return await this.client.executeFlow(deployment.flowPath, {
        flow_input: {
          data: input,
          context: {
            agent_id: deployment.agentId,
            agent_name: deployment.agentName,
            execution_time: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error}`
      };
    }
  }

  async getExecutionStatus(jobId: string): Promise<any> {
    return await this.client.getJobStatus(jobId);
  }

  async getExecutionLogs(jobId: string): Promise<string[]> {
    return await this.client.getJobLogs(jobId);
  }

  async updateDeployment(
    deployment: WindmillDeployment,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<{ deployment?: WindmillDeployment; errors: string[] }> {
    try {
      // Delete old deployment
      await this.deleteDeployment(deployment);

      // Create new deployment
      return await this.deployAgent(
        deployment.agentId,
        deployment.agentName,
        nodes,
        edges
      );
    } catch (error) {
      return { errors: [`Update failed: ${error}`] };
    }
  }

  async deleteDeployment(deployment: WindmillDeployment): Promise<void> {
    try {
      // Delete flow
      await this.client.deleteFlow(deployment.flowPath);

      // Delete scripts
      for (const scriptPath of deployment.scriptPaths) {
        await this.client.deleteScript(scriptPath);
      }
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      throw error;
    }
  }

  async validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<TranslationResult> {
    // Create temporary translator for validation
    const tempTranslator = new WindmillTranslator('temp', 'validation');
    return tempTranslator.translateWorkflow(nodes, edges);
  }

  async listDeployments(): Promise<any[]> {
    try {
      const flows = await this.client.listFlows();
      return flows.filter(flow => flow.summary?.includes('AI Agent Workflow'));
    } catch (error) {
      console.error('Failed to list deployments:', error);
      return [];
    }
  }

  generatePreview(nodes: WorkflowNode[], edges: WorkflowEdge[]): TranslationResult {
    const tempTranslator = new WindmillTranslator('preview', 'preview_agent');
    return tempTranslator.translateWorkflow(nodes, edges);
  }
}