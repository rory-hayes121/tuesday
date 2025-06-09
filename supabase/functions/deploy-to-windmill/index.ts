import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeployToWindmillRequest {
  agentId: string;
  agentName: string;
  workflowData: {
    nodes: any[];
    edges: any[];
  };
}

interface WindmillScript {
  name: string;
  language: 'typescript' | 'python';
  content: string;
  schema: any;
  description: string;
}

interface WindmillFlow {
  summary: string;
  description: string;
  value: {
    modules: any[];
    failure_module?: any;
  };
  schema: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { agentId, agentName, workflowData }: DeployToWindmillRequest = await req.json();

    // Validate required fields
    if (!agentId || !agentName || !workflowData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Deploying agent to Windmill:', agentName);

    // Windmill configuration
    const WINDMILL_URL = Deno.env.get('WINDMILL_URL') || 'https://app.windmill.dev';
    const WINDMILL_WORKSPACE = Deno.env.get('WINDMILL_WORKSPACE') || 'demo';
    
    // Use the specific script path you mentioned: u/rory/nice_script
    const WINDMILL_SCRIPT_PATH = 'u/rory/nice_script';

    // Convert workflow to Windmill scripts and flow
    const { scripts, flow, errors } = convertWorkflowToWindmill(agentName, workflowData);

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Workflow conversion failed', details: errors }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Deploy scripts using the Windmill internal script
    const scriptPaths: string[] = [];
    for (const script of scripts) {
      try {
        const scriptPath = await deployScriptViaWindmillScript(
          script, 
          WINDMILL_URL, 
          WINDMILL_WORKSPACE, 
          WINDMILL_SCRIPT_PATH
        );
        scriptPaths.push(scriptPath);
        console.log('Deployed script:', scriptPath);
      } catch (error) {
        console.error('Failed to deploy script:', script.name, error);
        return new Response(
          JSON.stringify({ 
            error: `Failed to deploy script: ${script.name}`, 
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Deploy flow using the Windmill internal script
    let flowPath: string;
    try {
      flowPath = await deployFlowViaWindmillScript(
        flow, 
        WINDMILL_URL, 
        WINDMILL_WORKSPACE, 
        WINDMILL_SCRIPT_PATH
      );
      console.log('Deployed flow:', flowPath);
    } catch (error) {
      console.error('Failed to deploy flow:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to deploy flow to Windmill', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update agent status in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('agents')
      .update({ 
        status: 'active',
        last_run: new Date().toISOString()
      })
      .eq('id', agentId);

    return new Response(
      JSON.stringify({ 
        success: true,
        deployment: {
          flowPath,
          scriptPaths,
          deployedAt: new Date().toISOString()
        },
        message: 'Agent deployed to Windmill successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function convertWorkflowToWindmill(agentName: string, workflowData: any): { scripts: WindmillScript[], flow: WindmillFlow, errors: string[] } {
  const { nodes, edges } = workflowData;
  const scripts: WindmillScript[] = [];
  const errors: string[] = [];

  // Convert each node to a Windmill script
  for (const node of nodes) {
    try {
      const script = convertNodeToScript(node, agentName);
      scripts.push(script);
    } catch (error) {
      errors.push(`Failed to convert node ${node.id}: ${error.message}`);
    }
  }

  // Create flow definition
  const flow = createWindmillFlow(agentName, nodes, edges, scripts);

  return { scripts, flow, errors };
}

function convertNodeToScript(node: any, agentName: string): WindmillScript {
  const scriptName = `${agentName}_${node.type}_${node.id}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  switch (node.type) {
    case 'prompt':
      return {
        name: scriptName,
        language: 'typescript',
        description: `AI Prompt: ${node.data.label}`,
        schema: {
          type: 'object',
          properties: {
            input: { type: 'object' },
            context: { type: 'object' }
          }
        },
        content: generatePromptScript(node)
      };
    
    case 'tool':
      return {
        name: scriptName,
        language: 'typescript',
        description: `Tool: ${node.data.label}`,
        schema: {
          type: 'object',
          properties: {
            input: { type: 'object' }
          }
        },
        content: generateToolScript(node)
      };
    
    case 'logic':
      return {
        name: scriptName,
        language: 'typescript',
        description: `Logic: ${node.data.label}`,
        schema: {
          type: 'object',
          properties: {
            input: { type: 'object' }
          }
        },
        content: generateLogicScript(node)
      };
    
    case 'memory':
      return {
        name: scriptName,
        language: 'typescript',
        description: `Memory: ${node.data.label}`,
        schema: {
          type: 'object',
          properties: {
            input: { type: 'object' }
          }
        },
        content: generateMemoryScript(node)
      };
    
    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}

function generatePromptScript(node: any): string {
  const config = node.data.config || {};
  return `
// AI Prompt Script: ${node.data.label}
export async function main(input: any, context: any = {}) {
  const instruction = \`${config.instruction || 'No instruction provided'}\`;
  const model = "${config.model || 'gpt-4'}";
  
  // Process instruction with variable substitution
  let processedInstruction = instruction;
  
  // Replace variables from input
  if (input && typeof input === 'object') {
    Object.keys(input).forEach(key => {
      const regex = new RegExp(\`{{\\s*\${key}\\s*}}\`, 'g');
      processedInstruction = processedInstruction.replace(regex, String(input[key] || ''));
    });
  }
  
  try {
    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${openaiApiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: processedInstruction }],
        temperature: ${config.temperature || 0.7},
        max_tokens: ${config.maxTokens || 1000}
      })
    });
    
    if (!response.ok) {
      throw new Error(\`OpenAI API error: \${response.status}\`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      response: data.choices[0].message.content,
      model: model,
      tokens_used: data.usage?.total_tokens || 0,
      instruction: processedInstruction,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI processing failed:', error);
    throw new Error(\`AI processing failed: \${error.message}\`);
  }
}
  `;
}

function generateToolScript(node: any): string {
  const config = node.data.config || {};
  return `
// Tool Script: ${node.data.label}
export async function main(input: any) {
  const service = "${config.service || 'unknown'}";
  const action = "${config.action || 'unknown'}";
  
  console.log(\`Executing \${service} tool with action: \${action}\`);
  
  try {
    if (service === 'http') {
      const url = "${config.parameters?.url || ''}";
      const method = "${config.parameters?.method || 'GET'}";
      const headers = ${JSON.stringify(config.parameters?.headers || {})};
      const body = ${JSON.stringify(config.parameters?.body || null)};
      
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
      
      const response = await fetch(url, requestOptions);
      const responseData = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: responseData,
        service: service,
        action: action,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      success: true,
      service: service,
      action: action,
      result: "Tool execution completed",
      input: input,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Tool execution failed:', error);
    throw new Error(\`Tool execution failed: \${error.message}\`);
  }
}
  `;
}

function generateLogicScript(node: any): string {
  const config = node.data.config || {};
  return `
// Logic Script: ${node.data.label}
export async function main(input: any) {
  const condition = \`${config.condition || 'true'}\`;
  const logicType = "${config.type || 'if-else'}";
  
  console.log(\`Evaluating condition: \${condition}\`);
  
  try {
    const result = evaluateCondition(condition, input);
    
    return {
      success: true,
      type: logicType,
      condition: condition,
      result: result,
      input: input,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Logic evaluation failed:', error);
    throw new Error(\`Logic evaluation failed: \${error.message}\`);
  }
}

function evaluateCondition(condition: string, context: any): boolean {
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
    
    if (condition.includes('>')) {
      const [left, right] = condition.split('>').map(s => s.trim());
      return Number(getValue(left, context)) > Number(getValue(right, context));
    }
    
    if (condition.includes('<')) {
      const [left, right] = condition.split('<').map(s => s.trim());
      return Number(getValue(left, context)) < Number(getValue(right, context));
    }
    
    return true; // Default to true for simple conditions
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
}

function getValue(expression: string, context: any): any {
  if ((expression.startsWith('"') && expression.endsWith('"')) ||
      (expression.startsWith("'") && expression.endsWith("'"))) {
    return expression.slice(1, -1);
  }
  
  if (!isNaN(Number(expression))) {
    return Number(expression);
  }
  
  if (expression.includes('.')) {
    const parts = expression.split('.');
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }
  
  return context?.[expression];
}
  `;
}

function generateMemoryScript(node: any): string {
  const config = node.data.config || {};
  return `
// Memory Script: ${node.data.label}
export async function main(input: any) {
  const operation = "${config.operation || 'store'}";
  const key = "${config.key || 'default_key'}";
  
  console.log(\`Memory operation: \${operation} with key: \${key}\`);
  
  try {
    switch (operation) {
      case 'store':
        // Store in Windmill state
        await Deno.env.set(\`memory_\${key}\`, JSON.stringify(input));
        return {
          success: true,
          operation: 'store',
          key: key,
          stored: true,
          timestamp: new Date().toISOString()
        };
      
      case 'retrieve':
        // Retrieve from Windmill state
        const stored = await Deno.env.get(\`memory_\${key}\`);
        const data = stored ? JSON.parse(stored) : null;
        return {
          success: true,
          operation: 'retrieve',
          key: key,
          data: data,
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
  `;
}

function createWindmillFlow(agentName: string, nodes: any[], edges: any[], scripts: WindmillScript[]): WindmillFlow {
  const modules = scripts.map((script, index) => {
    const node = nodes[index];
    return {
      id: node.id,
      value: {
        type: 'script',
        path: `demo/${script.name}`, // Use demo workspace
        input_transforms: generateInputTransforms(node, edges)
      },
      summary: node.data.label
    };
  });

  return {
    summary: `${agentName}_workflow`,
    description: `Generated workflow for ${agentName} agent`,
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
  workflow: "${agentName}"
};
          `,
          language: 'typescript'
        }
      }
    },
    schema: {
      type: 'object',
      properties: {
        flow_input: {
          type: 'object',
          description: 'Input data for the workflow'
        }
      }
    }
  };
}

function generateInputTransforms(node: any, edges: any[]): Record<string, any> {
  const transforms: Record<string, any> = {};
  
  // Find incoming edges to this node
  const incomingEdges = edges.filter((edge: any) => edge.target === node.id);
  
  if (incomingEdges.length === 0) {
    // Entry node - use flow input
    transforms.input = { expr: 'flow_input' };
  } else {
    // Use output from previous steps
    incomingEdges.forEach((edge: any, index: number) => {
      const inputKey = index === 0 ? 'input' : `input_${index}`;
      transforms[inputKey] = { expr: `results.${edge.source}` };
    });
  }
  
  return transforms;
}

// Deploy script using Windmill's internal script (webhook approach)
async function deployScriptViaWindmillScript(
  script: WindmillScript, 
  baseUrl: string, 
  workspace: string, 
  scriptPath: string
): Promise<string> {
  const scriptUrl = `${baseUrl}/api/w/${workspace}/jobs/run/p/${scriptPath}`;
  const targetPath = `${workspace}/${script.name}`;
  
  const payload = {
    action: 'create_script',
    script_data: {
      path: targetPath,
      summary: script.description,
      description: script.description,
      content: script.content,
      language: script.language,
      schema: script.schema,
      is_template: false
    }
  };
  
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to deploy script via Windmill script: ${error}`);
  }

  const result = await response.json();
  console.log('Script deployment result:', result);
  
  return targetPath;
}

// Deploy flow using Windmill's internal script (webhook approach)
async function deployFlowViaWindmillScript(
  flow: WindmillFlow, 
  baseUrl: string, 
  workspace: string, 
  scriptPath: string
): Promise<string> {
  const scriptUrl = `${baseUrl}/api/w/${workspace}/jobs/run/p/${scriptPath}`;
  const targetPath = `${workspace}/${flow.summary}`;
  
  const payload = {
    action: 'create_flow',
    flow_data: {
      path: targetPath,
      summary: flow.summary,
      description: flow.description,
      value: flow.value,
      schema: flow.schema
    }
  };
  
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to deploy flow via Windmill script: ${error}`);
  }

  const result = await response.json();
  console.log('Flow deployment result:', result);
  
  return targetPath;
}