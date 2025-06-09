# Windmill Deployment Setup Guide

## Overview

This application uses a webhook-based approach to deploy AI agent workflows to Windmill. Instead of calling Windmill's API directly, we use a Windmill script that has internal privileges to create other scripts and flows.

## Required Windmill Script

You need to create a script in your Windmill workspace at the path `u/rory/nice_script` with the following content:

### Script Path: `u/rory/nice_script`
### Language: TypeScript

```typescript
// Windmill Internal Script Deployer
// This script receives webhook calls from Supabase Edge Functions
// and creates scripts/flows using Windmill's internal API

export async function main(payload: any) {
  const { action, script_data, flow_data } = payload;
  
  console.log('Received deployment request:', action);
  
  try {
    if (action === 'create_script') {
      return await createScript(script_data);
    } else if (action === 'create_flow') {
      return await createFlow(flow_data);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

async function createScript(scriptData: any) {
  const { path, summary, description, content, language, schema, is_template } = scriptData;
  
  console.log('Creating script:', path);
  
  // Use Windmill's internal API to create the script
  // This requires admin privileges which this script should have
  const response = await fetch(`${Deno.env.get('WM_BASE_URL')}/api/w/${Deno.env.get('WM_WORKSPACE')}/scripts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('WM_TOKEN')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path,
      summary,
      description,
      content,
      language,
      schema,
      is_template: is_template || false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create script: ${error}`);
  }

  const result = await response.json();
  console.log('Script created successfully:', path);
  
  return {
    success: true,
    path: path,
    result: result
  };
}

async function createFlow(flowData: any) {
  const { path, summary, description, value, schema } = flowData;
  
  console.log('Creating flow:', path);
  
  // Use Windmill's internal API to create the flow
  const response = await fetch(`${Deno.env.get('WM_BASE_URL')}/api/w/${Deno.env.get('WM_WORKSPACE')}/flows`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('WM_TOKEN')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path,
      summary,
      description,
      value,
      schema
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create flow: ${error}`);
  }

  const result = await response.json();
  console.log('Flow created successfully:', path);
  
  return {
    success: true,
    path: path,
    result: result
  };
}
```

## Environment Variables

Make sure your Windmill script has access to these environment variables:

- `WM_BASE_URL`: Your Windmill instance URL (e.g., `https://app.windmill.dev`)
- `WM_TOKEN`: Your Windmill API token with admin privileges
- `WM_WORKSPACE`: Your Windmill workspace name (e.g., `demo`)

## Supabase Edge Function Configuration

The Supabase Edge Function needs these environment variables:

- `WINDMILL_URL`: Your Windmill instance URL
- `WINDMILL_WORKSPACE`: Your Windmill workspace name
- `OPENAI_API_KEY`: OpenAI API key for AI prompt blocks

## How It Works

1. **User clicks "Deploy" in AgentFlow**
2. **Frontend calls Supabase Edge Function** with workflow data
3. **Edge Function converts workflow** to Windmill scripts and flow definitions
4. **Edge Function calls Windmill script** at `u/rory/nice_script` via HTTP
5. **Windmill script uses internal API** to create scripts and flows
6. **Success response** is returned to the user

## Benefits of This Approach

- ✅ **Works with CORS restrictions** - Only HTTP calls, no direct API access needed
- ✅ **Uses Windmill's internal privileges** - The script can create other scripts
- ✅ **Secure** - API tokens stay within Windmill environment
- ✅ **Reliable** - Uses Windmill's own infrastructure for script creation
- ✅ **Scalable** - Can handle multiple deployments concurrently

## Testing the Setup

1. Create the Windmill script at `u/rory/nice_script`
2. Set the required environment variables in Windmill
3. Test by deploying a simple agent from AgentFlow
4. Check Windmill workspace for created scripts and flows

## Troubleshooting

- **Script not found**: Ensure the script path `u/rory/nice_script` is correct
- **Permission denied**: Make sure the script has admin privileges
- **API errors**: Check that environment variables are set correctly
- **Network issues**: Verify Windmill instance is accessible from Supabase