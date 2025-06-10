import type { Handler } from '@netlify/functions';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const client = await pool.connect();
    
    try {
      // Create workspace_connections table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workspace_connections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          piece_name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          connection_value JSONB NOT NULL,
          workspace_id VARCHAR(255) NOT NULL,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          status VARCHAR(50) DEFAULT 'ACTIVE',
          last_used TIMESTAMP WITH TIME ZONE,
          error_message TEXT
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workspace_connections_workspace_id 
        ON workspace_connections(workspace_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workspace_connections_piece_name 
        ON workspace_connections(piece_name);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workspace_connections_status 
        ON workspace_connections(status);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workspace_connections_active 
        ON workspace_connections(is_active);
      `);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true,
          message: 'workspace_connections table created successfully'
        })
      };

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Database error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 