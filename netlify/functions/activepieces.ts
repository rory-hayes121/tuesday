import { Handler } from '@netlify/functions';
import { Pool } from 'pg';

interface CreateFlowRequest {
  displayName: string;
  trigger: any;
  steps: any[];
  status?: 'ENABLED' | 'DISABLED';
}

interface ActivepiecesFlow {
  id: string;
  displayName: string;
  status: 'ENABLED' | 'DISABLED';
  projectId: string;
  trigger: any;
  steps: any[];
  created: string;
  updated: string;
}

// Database connection pool
const pool = new Pool({
  host: 'yamanote.proxy.rlwy.net',
  port: 29615,
  database: 'railway',
  user: 'postgres',
  password: 'LtOVybVUGQnWYjrzSDJjunnNQkBvBLQn',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const PROJECT_ID = 'C8NIVPDXRrRamepemIuFV';

// Generate Activepieces-compatible 21-character ID
function generateId(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 21; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Create flow in database
async function createFlow(data: CreateFlowRequest): Promise<ActivepiecesFlow> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const flowId = generateId();
    const versionId = generateId();
    const now = new Date().toISOString();
    const externalId = `tuesday-${Date.now()}`;

    console.log('Creating flow in database:', {
      flowId,
      versionId,
      displayName: data.displayName
    });

    // 1. Insert into flow table
    await client.query(`
      INSERT INTO flow (
        id, 
        "projectId", 
        status, 
        "publishedVersionId",
        "externalId",
        created,
        updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      flowId,
      PROJECT_ID,
      data.status || 'ENABLED',
      versionId,
      externalId,
      now,
      now
    ]);

    // 2. Insert into flow_version table
    await client.query(`
      INSERT INTO flow_version (
        id,
        "flowId",
        "displayName",
        trigger,
        valid,
        state,
        "schemaVersion",
        "connectionIds",
        created,
        updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      versionId,
      flowId,
      data.displayName,
      JSON.stringify(data.trigger),
      true,
      'LOCKED',
      '0.30.0',
      [],
      now,
      now
    ]);

    await client.query('COMMIT');

    const createdFlow: ActivepiecesFlow = {
      id: flowId,
      displayName: data.displayName,
      status: (data.status || 'ENABLED') as 'ENABLED' | 'DISABLED',
      projectId: PROJECT_ID,
      trigger: data.trigger,
      steps: data.steps || [],
      created: now,
      updated: now
    };

    console.log('Flow created successfully in database:', createdFlow);
    return createdFlow;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database flow creation failed:', error);
    throw new Error(`Failed to create flow in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    client.release();
  }
}

// List flows from database
async function listFlows(): Promise<ActivepiecesFlow[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        f.id,
        f.status,
        f.created,
        f.updated,
        fv."displayName",
        fv.trigger
      FROM flow f
      LEFT JOIN flow_version fv ON f."publishedVersionId" = fv.id
      WHERE f."projectId" = $1
      AND f.status IS NOT NULL
      ORDER BY f.created DESC
    `, [PROJECT_ID]);

    return result.rows.map(row => ({
      id: row.id,
      displayName: row.displayName || 'Untitled Flow',
      status: row.status as 'ENABLED' | 'DISABLED',
      projectId: PROJECT_ID,
      trigger: row.trigger || {},
      steps: [],
      created: row.created,
      updated: row.updated
    }));

  } catch (error) {
    console.error('Failed to list flows:', error);
    return [];
  } finally {
    client.release();
  }
}

// Test database connection
async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM project WHERE id = $1', [PROJECT_ID]);
    client.release();
    
    return { success: result.rows[0].count > 0 };
  } catch (error) {
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/activepieces', '');
    const method = event.httpMethod;

    console.log('Activepieces API called:', { method, path });

    // Route handling
    if (method === 'POST' && path === '/flows') {
      const data: CreateFlowRequest = JSON.parse(event.body || '{}');
      const flow = await createFlow(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(flow),
      };
    }

    if (method === 'GET' && path === '/flows') {
      const flows = await listFlows();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(flows),
      };
    }

    if (method === 'GET' && path === '/health') {
      const result = await testConnection();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: result.success ? 'healthy' : 'error',
          authRequired: false,
          error: result.error 
        }),
      };
    }

    // Unknown endpoint
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error) {
    console.error('Activepieces API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
    };
  }
}; 