# Activepieces Integration Guide

This document explains how the **Tuesday/AgentFlow** platform integrates with Activepieces for robust workflow execution.

## Overview

We've replaced the legacy Windmill integration with Activepieces to provide:
- **100+ pre-built integrations** (OpenAI, Slack, Notion, Gmail, etc.)
- **Professional execution engine** with proper error handling and logging
- **Credential management** system with admin-only access
- **Scheduling and triggers** (manual, scheduled, webhook-based)
- **Multi-tenant architecture** with workspace isolation

## Architecture

### Database Schema
```sql
-- Enhanced integrations table for Activepieces credentials
ALTER TABLE integrations 
ADD COLUMN activepieces_credential_id TEXT,
ADD COLUMN metadata JSONB DEFAULT '{}',
ADD COLUMN status TEXT DEFAULT 'connected';

-- Enhanced agents table for Activepieces flows
ALTER TABLE agents 
ADD COLUMN activepieces_flow_id TEXT,
ADD COLUMN schedule JSONB DEFAULT NULL,
ADD COLUMN trigger_config JSONB DEFAULT '{}';

-- New agent_logs table for execution tracking
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    activepieces_flow_id TEXT,
    activepieces_run_id TEXT,
    status TEXT NOT NULL,
    input JSONB DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    triggered_by UUID REFERENCES users(id)
);
```

### API Client
- **Location**: `src/services/activepieces.ts`
- **Instance**: Self-hosted at `activepieces-production-aa7c.up.railway.app`
- **Features**: Full CRUD operations for flows, credentials, and executions

## Workflow Transformation

The system transforms visual workflows from the Tuesday builder into Activepieces-compatible flows:

### Node Type Mapping
```javascript
const mapping = {
  'prompt': 'openai',      // AI/LLM operations
  'tool': 'http',          // HTTP requests
  'logic': 'data-mapper',  // Conditional logic
  'memory': 'store',       // Data persistence
  'output': 'data-mapper'  // Output formatting
};
```

### Example Transformation
```javascript
// Tuesday workflow
{
  nodes: [
    { type: 'prompt', data: { config: { instruction: 'Summarize this text' } } },
    { type: 'tool', data: { config: { endpoint: '/api/send-email' } } }
  ],
  edges: [{ source: 'prompt_1', target: 'tool_1' }]
}

// Transformed to Activepieces
{
  displayName: 'Agent Workflow',
  trigger: { name: 'webhook', displayName: 'Manual Trigger' },
  steps: [
    {
      name: 'openai',
      displayName: 'Summarize Text',
      settings: {
        model: 'gpt-4',
        prompt: 'Summarize this text',
        temperature: 0.7
      }
    },
    {
      name: 'http',
      displayName: 'Send Email',
      settings: {
        url: '/api/send-email',
        method: 'POST'
      }
    }
  ]
}
```

## Deployment Process

### 1. Workflow Creation
- User creates workflow in visual builder
- System validates nodes and connections
- Agent is saved to database with `status: 'draft'`

### 2. Deployment
- User clicks "Deploy to Activepieces"
- System transforms workflow to Activepieces format
- Creates flow via Activepieces API
- Updates agent with `activepieces_flow_id` and `status: 'active'`

### 3. Execution
- Manual runs via test button
- Scheduled runs via cron triggers
- Webhook triggers for external events
- All executions logged to `agent_logs` table

## Environment Variables

Required environment variables for Activepieces integration:

```bash
# Activepieces Configuration
VITE_ACTIVEPIECES_API_KEY=your_api_key_here
VITE_ACTIVEPIECES_PROJECT_ID=your_project_id_here

# Self-hosted instance URL (already configured)
# https://activepieces-production-aa7c.up.railway.app
```

## Features

### ✅ Implemented
- **API Client**: Complete client with all CRUD operations
- **Database Schema**: Enhanced tables for Activepieces integration
- **Workflow Transformation**: Tuesday → Activepieces flow conversion
- **Deployment UI**: Rich deployment interface with status tracking
- **Execution Logging**: Complete run history and output tracking
- **Error Handling**: Proper error messages and recovery

### 🔄 In Progress
- **Credential Management**: Admin-only integration setup
- **Integration Catalog**: Dynamic loading of 100+ available integrations
- **Scheduling UI**: Cron and trigger configuration interface
- **Webhook Triggers**: External event-based execution

### 📋 Planned
- **Branch Testing**: Test workflows before deploying to production
- **Version Control**: Track and rollback workflow versions
- **Analytics Dashboard**: Execution metrics and performance monitoring
- **Collaboration**: Team-based workflow sharing and permissions

## API Reference

### Core Methods
```typescript
// Flow Management
await activepiecesClient.createFlow(flowData);
await activepiecesClient.updateFlow(flowId, updates);
await activepiecesClient.getFlow(flowId);
await activepiecesClient.deleteFlow(flowId);

// Execution
await activepiecesClient.executeFlow(flowId, input);
await activepiecesClient.getRun(runId);
await activepiecesClient.listRuns(flowId);

// Credentials
await activepiecesClient.createCredential(credentialData);
await activepiecesClient.testCredential(credentialId);
await activepiecesClient.listCredentials();
```

## Error Handling

The integration includes comprehensive error handling:

- **API Errors**: Proper HTTP error responses and user feedback
- **Validation**: Pre-deployment workflow validation
- **Execution Errors**: Detailed error logging and debugging info
- **Network Issues**: Retry logic and graceful degradation

## Security

- **Credential Storage**: Encrypted storage in Activepieces
- **API Authentication**: Bearer token authentication
- **Workspace Isolation**: Proper multi-tenant security
- **Admin Controls**: Credential management restricted to admins

## Monitoring

- **Execution Logs**: Real-time execution tracking
- **Performance Metrics**: Runtime and success rate monitoring
- **Error Analytics**: Error pattern analysis and alerting
- **Usage Statistics**: Workflow usage and optimization insights

## Getting Started

1. **Configure Environment**: Set up API keys and project ID
2. **Deploy Database**: Run migrations for Activepieces tables
3. **Create Workflow**: Use visual builder to create agent workflow
4. **Deploy**: Use deployment UI to push to Activepieces
5. **Test**: Execute workflow and monitor results
6. **Monitor**: Track execution logs and performance

## Support

For issues with the Activepieces integration:
1. Check execution logs in the deployment UI
2. Verify API connectivity and credentials
3. Review workflow transformation output
4. Contact support with specific error messages

---

**Note**: This integration provides a robust, production-ready workflow execution system that scales with your needs while maintaining the simplicity of the visual builder interface. 