import OpenAI from 'openai';
import { AgentBlock } from '../types';

// Initialize OpenAI with environment variable
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.');
}

const openai = new OpenAI({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true // Enable for client-side usage
});

export interface AgentGenerationRequest {
  prompt: string;
  context?: string;
}

export interface AgentGenerationResponse {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
}

// Define available block types for the AI to use
const AVAILABLE_BLOCKS = {
  prompt: {
    type: 'prompt',
    description: 'AI prompt block for text generation and processing',
    defaultData: {
      prompt: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  tool: {
    type: 'tool',
    description: 'External tool integration (API calls, webhooks, etc.)',
    defaultData: {
      toolType: 'api',
      endpoint: '',
      method: 'GET',
      headers: {},
      body: ''
    }
  },
  logic: {
    type: 'logic',
    description: 'Conditional logic and decision making',
    defaultData: {
      condition: '',
      operator: 'equals',
      value: '',
      truePath: '',
      falsePath: ''
    }
  },
  memory: {
    type: 'memory',
    description: 'Store and retrieve information across agent runs',
    defaultData: {
      action: 'store',
      key: '',
      value: '',
      scope: 'session'
    }
  },
  input: {
    type: 'input',
    description: 'Collect input from users',
    defaultData: {
      inputType: 'text',
      label: '',
      placeholder: '',
      required: true
    }
  },
  output: {
    type: 'output',
    description: 'Display results to users',
    defaultData: {
      outputType: 'text',
      template: '',
      format: 'plain'
    }
  }
};

export async function generateAgentFromPrompt(request: AgentGenerationRequest): Promise<AgentGenerationResponse> {
  try {
    // Check if API key is configured
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set the VITE_OPENAI_API_KEY environment variable.');
    }

    const systemPrompt = `You are an AI agent workflow designer. Your task is to convert user prompts into structured agent workflows.

Available block types:
${Object.entries(AVAILABLE_BLOCKS).map(([key, block]) => 
  `- ${key}: ${block.description}`
).join('\n')}

Create a workflow with the following structure:
1. Always start with an "input" block to collect user input
2. Add relevant processing blocks (prompt, tool, logic, memory)
3. End with an "output" block to show results
4. Connect blocks logically with edges

Respond with valid JSON in this exact format:
{
  "name": "Agent Name",
  "description": "Brief description of what the agent does",
  "nodes": [
    {
      "id": "unique-id",
      "type": "block-type",
      "position": {"x": number, "y": number},
      "data": {
        "label": "Block Label",
        "description": "What this block does",
        ...block-specific-data
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "default"
    }
  ]
}

Position nodes in a logical flow from left to right, spacing them 300 pixels apart horizontally.`;

    const userPrompt = `Create an agent workflow for: "${request.prompt}"
    
${request.context ? `Additional context: ${request.context}` : ''}

Make sure the workflow is practical and can actually accomplish the requested task.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let agentData: AgentGenerationResponse;
    try {
      agentData = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error('Invalid JSON in OpenAI response');
    }

    // Validate and enhance the generated data
    agentData = validateAndEnhanceAgent(agentData);

    return agentData;
  } catch (error) {
    console.error('Error generating agent from prompt:', error);
    throw error;
  }
}

function validateAndEnhanceAgent(agent: AgentGenerationResponse): AgentGenerationResponse {
  // Ensure all nodes have required properties
  const enhancedNodes = agent.nodes.map((node, index) => {
    const blockConfig = AVAILABLE_BLOCKS[node.type as keyof typeof AVAILABLE_BLOCKS];
    
    return {
      id: node.id || `node-${index}`,
      type: node.type,
      position: node.position || { x: index * 300, y: 100 },
      data: {
        label: node.data?.label || `${node.type} Block`,
        description: node.data?.description || blockConfig?.description || '',
        ...blockConfig?.defaultData,
        ...node.data
      }
    };
  });

  // Ensure edges have required properties
  const enhancedEdges = agent.edges.map((edge, index) => ({
    id: edge.id || `edge-${index}`,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'default'
  }));

  return {
    name: agent.name || 'Generated Agent',
    description: agent.description || 'AI-generated workflow',
    nodes: enhancedNodes,
    edges: enhancedEdges
  };
}

// Helper function to generate example workflows for testing
export function getExampleWorkflows() {
  return [
    {
      prompt: "Create a customer support email responder",
      expected: "Should create a workflow that reads emails, analyzes sentiment, and generates appropriate responses"
    },
    {
      prompt: "Build a data analysis agent that processes CSV files",
      expected: "Should create a workflow that accepts file uploads, processes data, and generates insights"
    },
    {
      prompt: "Make an agent that summarizes web articles",
      expected: "Should create a workflow that accepts URLs, fetches content, and generates summaries"
    }
  ];
} 