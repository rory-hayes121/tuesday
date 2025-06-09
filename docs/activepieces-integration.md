# Activepieces Integration Guide

## Overview

This application has been fully migrated from Windmill to Activepieces as the workflow execution engine. Activepieces provides a powerful, open-source automation platform with extensive integrations and a robust API.

## Activepieces Instance

We're using a self-hosted Activepieces instance at:
```
https://activepieces-production-aa7c.up.railway.app
```

This instance runs in development mode with no authentication required for API access.

## Architecture

### Core Components

1. **ActivepiecesClient** (`src/services/activepieces/ActivepiecesClient.ts`)
   - Low-level API client for Activepieces REST API
   - Handles flows, flow runs, apps, and projects
   - Direct HTTP communication with Activepieces instance

2. **ActivepiecesTranslator** (`src/services/activepieces/ActivepiecesTranslator.ts`)
   - Converts AgentFlow visual workflows to Activepieces flow definitions
   - Maps node types to Activepieces steps and pieces
   - Validates workflow structure and provides error reporting

3. **ActivepiecesService** (`src/services/activepieces/ActivepiecesService.ts`)
   - High-level service orchestrating translation and deployment
   - Manages workflow lifecycle (create, update, delete, execute)
   - Provides integration management and validation

### Workflow Translation

AgentFlow nodes are mapped to Activepieces components as follows:

- **Prompt Nodes** → Code steps with AI API integration
- **Tool Nodes** → HTTP piece or custom code steps
- **Logic Nodes** → Branch steps with condition evaluation
- **Memory Nodes** → Code steps with data storage operations
- **Integration Nodes** → Specific Activepieces pieces (Slack, Notion, etc.)

### Flow Structure

Activepieces flows consist of:
- **Trigger**: Webhook trigger for manual execution
- **Actions**: Sequential steps mapped from AgentFlow nodes
- **Connections**: Flow control between steps

## API Endpoints

### Flow Management
- `POST /api/v1/flows` - Create new flow
- `GET /api/v1/flows` - List flows
- `GET /api/v1/flows/:id` - Get specific flow
- `POST /api/v1/flows/:id` - Update flow
- `DELETE /api/v1/flows/:id` - Delete flow

### Flow Execution
- `POST /api/v1/flow-runs` - Trigger flow execution
- `GET /api/v1/flow-runs/:id` - Get execution status
- `GET /api/v1/flow-runs/:id/logs` - Get execution logs

### Integration Discovery
- `GET /api/v1/apps` - List available integrations
- `GET /api/v1/apps/:name` - Get specific app details

### Project Management
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details

## Available Integrations

Activepieces includes 100+ built-in integrations including:

### Communication
- Slack
- Discord
- Microsoft Teams
- Telegram

### Productivity
- Notion
- Google Sheets
- Airtable
- Trello

### Email & Calendar
- Gmail
- Outlook
- Google Calendar
- Calendly

### Development
- GitHub
- GitLab
- Jira
- Linear

### CRM & Sales
- HubSpot
- Salesforce
- Pipedrive
- Intercom

### Marketing
- Mailchimp
- ConvertKit
- Typeform
- Zapier

## Deployment Process

1. **Workflow Translation**: AgentFlow nodes → Activepieces flow definition
2. **Flow Creation**: Create flow in Activepieces via API
3. **Flow Update**: Apply translated workflow structure
4. **Validation**: Verify flow structure and connections
5. **Activation**: Enable flow for execution

## Testing & Execution

### Test Mode
- Simulated execution for development
- Validates workflow structure
- Provides step-by-step execution preview

### Production Execution
- Real execution via Activepieces engine
- Webhook-triggered flows
- Full integration with external services
- Comprehensive logging and monitoring

## Error Handling

### Translation Errors
- Missing node configurations
- Invalid connections
- Circular dependencies
- Unsupported node types

### Runtime Errors
- API connection failures
- Integration authentication issues
- Flow execution timeouts
- Invalid input data

## Security

### No Authentication Required
- Development instance runs without API keys
- Direct HTTP access to all endpoints
- Simplified integration for development

### Production Considerations
- Enable authentication for production deployments
- Implement proper API key management
- Set up workspace isolation
- Configure rate limiting

## Monitoring & Logging

### Execution Tracking
- Flow run status monitoring
- Step-by-step execution logs
- Performance metrics
- Error reporting

### Debug Information
- Detailed execution traces
- Input/output data for each step
- Timing information
- Resource usage

## Migration Benefits

### From Windmill to Activepieces
1. **Simplified Architecture**: No complex webhook-based deployment
2. **Better Integration Support**: 100+ built-in integrations
3. **Improved UI**: Modern, intuitive interface
4. **Enhanced Reliability**: Robust execution engine
5. **Better Documentation**: Comprehensive API docs
6. **Active Development**: Regular updates and improvements

### Development Experience
- Direct API access without authentication complexity
- Real-time flow testing and debugging
- Visual flow builder integration
- Comprehensive error reporting

## Future Enhancements

### Planned Features
1. **Real-time Collaboration**: Multi-user workflow editing
2. **Advanced Monitoring**: Performance analytics and alerting
3. **Custom Pieces**: Build custom integrations
4. **Workflow Templates**: Pre-built automation templates
5. **Enterprise Features**: SSO, audit logs, compliance

### Integration Roadmap
1. **Enhanced UI**: Improved visual workflow builder
2. **Advanced Logic**: Complex branching and loops
3. **Data Transformation**: Built-in data mapping tools
4. **Scheduling**: Cron-based workflow triggers
5. **Webhooks**: Custom webhook endpoints

This migration to Activepieces provides a solid foundation for building powerful, scalable automation workflows with excellent integration support and a modern development experience.