# Windmill Translation Layer

This directory contains the complete translation layer for converting AgentFlow visual workflows into executable Windmill scripts and flows.

## Overview

The translation layer consists of three main components:

1. **WindmillTranslator** - Converts workflow nodes and edges into Windmill-compatible scripts and flow definitions
2. **WindmillClient** - Handles API communication with Windmill for deployment and execution
3. **WindmillService** - High-level service that orchestrates translation and deployment

## Features

### Supported Block Types

- **Prompt Blocks** → AI API integration scripts with variable substitution
- **Tool Blocks** → HTTP request scripts with authentication and parameter mapping
- **Logic Blocks** → Conditional evaluation scripts with safe expression parsing
- **Memory Blocks** → Data storage and retrieval scripts with scope management
- **Integration Blocks** → Service-specific API scripts with credential management

### Generated Output

For each workflow, the translator generates:

- **Individual Scripts** - TypeScript scripts for each workflow node
- **Flow Definition** - YAML/JSON flow connecting all scripts with proper input/output mapping
- **Validation Report** - Errors and warnings for workflow issues
- **Deployment Metadata** - Tracking information for deployed workflows

### Security Features

- **Safe Expression Evaluation** - Prevents code injection in logic blocks
- **Credential Management** - Secure handling of API keys and tokens
- **Input Validation** - Validates all node configurations before deployment
- **Error Handling** - Comprehensive error handling in generated scripts

## Usage

### Basic Translation

```typescript
import { WindmillTranslator } from './WindmillTranslator';

const translator = new WindmillTranslator('workspace', 'agent-name');
const result = translator.translateWorkflow(nodes, edges);

if (result.errors.length === 0) {
  // Deploy scripts and flow
  console.log('Generated scripts:', result.scripts);
  console.log('Generated flow:', result.flow);
}
```

### Full Deployment

```typescript
import { WindmillService } from './WindmillService';

const service = new WindmillService({
  baseUrl: 'https://app.windmill.dev',
  token: 'your-api-token',
  workspace: 'your-workspace'
});

const { deployment, errors } = await service.deployAgent(
  'agent-id',
  'agent-name',
  nodes,
  edges
);

if (deployment) {
  // Execute the deployed workflow
  const result = await service.executeAgent(deployment, inputData);
}
```

## Script Templates

### Prompt Block Template

```typescript
export async function main(input: any, context: any = {}) {
  const instruction = `Your AI instruction with {{variables}}`;
  const model = "gpt-4";
  
  // Process instruction with variable substitution
  let processedInstruction = instruction;
  
  // Replace variables from input and context
  // ... variable substitution logic
  
  // Call AI service
  const response = await callAIService(processedInstruction, {
    model,
    temperature: 0.7,
    max_tokens: 1000
  });
  
  return {
    success: true,
    response: response.text,
    model: model,
    tokens_used: response.usage?.total_tokens || 0
  };
}
```

### HTTP Tool Template

```typescript
export async function main(input: any, url_params: any = {}) {
  let url = "https://api.example.com/endpoint";
  const method = "POST";
  const headers = { "Content-Type": "application/json" };
  
  // Substitute URL parameters and input data
  // ... parameter substitution logic
  
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(processedBody)
  });
  
  return {
    success: response.ok,
    status: response.status,
    data: await response.json(),
    url: url,
    method: method
  };
}
```

### Logic Block Template

```typescript
export async function main(input: any) {
  const condition = `input.status === 'urgent'`;
  
  const result = evaluateCondition(condition, input);
  
  return {
    success: true,
    condition: condition,
    result: result,
    input: input
  };
}

function evaluateCondition(condition: string, context: any): boolean {
  // Safe condition evaluation logic
  // Supports ===, ==, !=, >, <, etc.
}
```

## Flow Definition Structure

```json
{
  "summary": "Agent Name - AI Agent Workflow",
  "description": "Generated workflow for agent",
  "value": {
    "modules": [
      {
        "id": "node-id",
        "value": {
          "type": "script",
          "path": "workspace/script-name",
          "input_transforms": {
            "input": { "expr": "flow_input.data" }
          }
        },
        "summary": "Node Label"
      }
    ],
    "failure_module": {
      "id": "failure_handler",
      "value": {
        "type": "rawscript",
        "content": "console.error('Workflow failed:', error);",
        "language": "typescript"
      }
    }
  },
  "schema": {
    "type": "object",
    "properties": {
      "flow_input": {
        "type": "object",
        "properties": {
          "data": { "type": "object" },
          "context": { "type": "object" }
        }
      }
    }
  }
}
```

## Validation Rules

The translator validates workflows against these rules:

1. **Structure Validation**
   - No empty workflows
   - No disconnected nodes (warnings)
   - No circular dependencies

2. **Node Validation**
   - Prompt blocks must have instructions
   - Tool blocks must have service configuration
   - Logic blocks must have conditions
   - Memory blocks must have keys
   - Integration blocks must have integration IDs

3. **Best Practices**
   - Workflows with >10 nodes get warnings
   - Missing descriptions generate warnings
   - Tool/integration blocks should have error handling

## Error Handling

Generated scripts include comprehensive error handling:

- **Network Errors** - Retry logic and timeout handling
- **API Errors** - Proper error response parsing
- **Validation Errors** - Input validation with clear messages
- **Runtime Errors** - Graceful failure with detailed logging

## Deployment Tracking

The service tracks deployments with:

- **Deployment ID** - Unique identifier for each deployment
- **Version Control** - Track workflow versions
- **Status Monitoring** - Active/inactive/failed status
- **Execution History** - Job IDs and results

## Integration with AgentFlow

The translation layer integrates seamlessly with the AgentFlow interface:

1. **Builder Integration** - Deploy button in agent builder
2. **Preview Mode** - Generate scripts without deployment
3. **Validation Feedback** - Real-time validation in the UI
4. **Execution Monitoring** - Track deployed workflow status

## Configuration

Configure the Windmill connection in the deployment modal:

- **Windmill URL** - Your Windmill instance URL
- **API Token** - Your Windmill API token
- **Workspace** - Target Windmill workspace

## Extending the Translator

To add support for new block types:

1. Add the block type to the `generateScript` method
2. Create a new script generation method (e.g., `generateCustomScript`)
3. Add validation rules in `validateNode`
4. Update the flow generation logic if needed

The translator is designed to be extensible and maintainable, with clear separation of concerns and comprehensive error handling.