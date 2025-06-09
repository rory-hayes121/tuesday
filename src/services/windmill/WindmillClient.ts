import { WindmillScript, WindmillFlow } from './WindmillTranslator';

export interface WindmillConfig {
  baseUrl: string;
  token: string;
  workspace: string;
}

export interface DeploymentResult {
  success: boolean;
  flowPath?: string;
  scriptPaths?: string[];
  errors?: string[];
  deploymentId?: string;
}

export interface ExecutionResult {
  success: boolean;
  jobId?: string;
  result?: any;
  error?: string;
  logs?: string[];
}

export class WindmillClient {
  private config: WindmillConfig;

  constructor(config: WindmillConfig) {
    this.config = config;
  }

  async deployWorkflow(scripts: WindmillScript[], flow: WindmillFlow): Promise<DeploymentResult> {
    try {
      const scriptPaths: string[] = [];
      const errors: string[] = [];

      // Deploy scripts first
      for (const script of scripts) {
        try {
          const scriptPath = await this.deployScript(script);
          scriptPaths.push(scriptPath);
        } catch (error) {
          errors.push(`Failed to deploy script ${script.name}: ${error}`);
        }
      }

      // Deploy flow if all scripts succeeded
      if (errors.length === 0) {
        const flowPath = await this.deployFlow(flow);
        
        return {
          success: true,
          flowPath,
          scriptPaths,
          deploymentId: `deploy_${Date.now()}`
        };
      } else {
        return {
          success: false,
          errors,
          scriptPaths
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Deployment failed: ${error}`]
      };
    }
  }

  async deployScript(script: WindmillScript): Promise<string> {
    const scriptPath = `${this.config.workspace}/${script.name}`;
    
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/scripts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: scriptPath,
        summary: script.description,
        description: script.description,
        content: script.content,
        language: script.language,
        schema: script.schema,
        is_template: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to deploy script: ${error}`);
    }

    return scriptPath;
  }

  async deployFlow(flow: WindmillFlow): Promise<string> {
    const flowPath = `${this.config.workspace}/${flow.summary.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/flows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: flowPath,
        summary: flow.summary,
        description: flow.description,
        value: flow.value,
        schema: flow.schema
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to deploy flow: ${error}`);
    }

    return flowPath;
  }

  async executeFlow(flowPath: string, input: any): Promise<ExecutionResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/jobs/run/f/${flowPath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to execute flow: ${error}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        jobId: result.id,
        result: result.result
      };
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error}`
      };
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${await response.text()}`);
    }

    return await response.json();
  }

  async getJobLogs(jobId: string): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/jobs/${jobId}/logs`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get job logs: ${await response.text()}`);
    }

    const logs = await response.text();
    return logs.split('\n').filter(line => line.trim());
  }

  async listScripts(): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/scripts`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list scripts: ${await response.text()}`);
    }

    return await response.json();
  }

  async listFlows(): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/flows`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list flows: ${await response.text()}`);
    }

    return await response.json();
  }

  async deleteScript(scriptPath: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/scripts/${scriptPath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete script: ${await response.text()}`);
    }
  }

  async deleteFlow(flowPath: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/w/${this.config.workspace}/flows/${flowPath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flow: ${await response.text()}`);
    }
  }
}