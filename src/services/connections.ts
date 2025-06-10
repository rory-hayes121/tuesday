/**
 * Workspace Connection Management Service
 * Handles admin-level connections that workspace members can use
 * Integrates with Supabase for storage and Activepieces for validation
 */

import { supabase } from '../lib/supabase';
import { activepiecesCatalog, PieceMetadata } from './activepiecesCatalog';

export interface WorkspaceConnection {
  id: string;
  name: string;                    // User-friendly name: "Company Gmail"
  piece_name: string;              // @activepieces/piece-gmail
  display_name: string;            // Gmail
  connection_value: any;           // Encrypted credentials (handled by Supabase)
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  status: 'ACTIVE' | 'ERROR' | 'INACTIVE' | 'TESTING';
  last_used?: string;
  error_message?: string;
}

export interface CreateConnectionRequest {
  name: string;
  piece_name: string;
  connection_value: any;
  workspace_id: string;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: any;
}

class WorkspaceConnectionService {
  
  /**
   * Create a new workspace connection (admin only)
   */
  async createConnection(data: CreateConnectionRequest, userId: string): Promise<WorkspaceConnection> {
    try {
      // Get piece metadata for display name
      const piece = await activepiecesCatalog.getPieceDetails(data.piece_name);
      const displayName = piece?.displayName || data.piece_name;

      const connectionData = {
        name: data.name,
        piece_name: data.piece_name,
        display_name: displayName,
        connection_value: data.connection_value,
        workspace_id: data.workspace_id,
        created_by: userId,
        is_active: true,
        status: 'TESTING' as const
      };

      const { data: connection, error } = await supabase
        .from('workspace_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create connection: ${error.message}`);
      }

      // Test the connection after creation
      const testResult = await this.testConnection(connection.id);
      
      // Update status based on test result
      await this.updateConnectionStatus(
        connection.id, 
        testResult.success ? 'ACTIVE' : 'ERROR',
        testResult.error
      );

      return {
        ...connection,
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        error_message: testResult.error
      };

    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  }

  /**
   * List all connections for a workspace
   */
  async listConnections(workspaceId: string): Promise<WorkspaceConnection[]> {
    try {
      const { data: connections, error } = await supabase
        .from('workspace_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch connections: ${error.message}`);
      }

      return connections || [];
    } catch (error) {
      console.error('Failed to list connections:', error);
      return [];
    }
  }

  /**
   * Get connections for a specific piece
   */
  async getConnectionsForPiece(workspaceId: string, pieceName: string): Promise<WorkspaceConnection[]> {
    try {
      const { data: connections, error } = await supabase
        .from('workspace_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('piece_name', pieceName)
        .eq('is_active', true)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch connections for piece: ${error.message}`);
      }

      return connections || [];
    } catch (error) {
      console.error('Failed to get connections for piece:', error);
      return [];
    }
  }

  /**
   * Get a specific connection by ID
   */
  async getConnection(connectionId: string): Promise<WorkspaceConnection | null> {
    try {
      const { data: connection, error } = await supabase
        .from('workspace_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch connection: ${error.message}`);
      }

      return connection;
    } catch (error) {
      console.error('Failed to get connection:', error);
      return null;
    }
  }

  /**
   * Test a connection's validity
   */
  async testConnection(connectionId: string): Promise<ConnectionTestResult> {
    try {
      const connection = await this.getConnection(connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      // For now, we'll do a basic validation
      // In a real implementation, this would test the actual connection
      // by making a test API call with the stored credentials
      
      const piece = await activepiecesCatalog.getPieceDetails(connection.piece_name);
      if (!piece) {
        return { success: false, error: 'Integration piece not found' };
      }

      // Basic validation: check if required fields are present
      if (!connection.connection_value || typeof connection.connection_value !== 'object') {
        return { success: false, error: 'Invalid connection configuration' };
      }

      // TODO: Implement actual connection testing
      // This would involve calling the Activepieces API to validate the connection
      // For now, we'll assume it's valid if basic checks pass
      
      return { 
        success: true, 
        details: { piece: piece.displayName, validated_at: new Date().toISOString() }
      };

    } catch (error) {
      console.error('Failed to test connection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    connectionId: string, 
    status: WorkspaceConnection['status'], 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      } else {
        updateData.error_message = null;
      }

      const { error } = await supabase
        .from('workspace_connections')
        .update(updateData)
        .eq('id', connectionId);

      if (error) {
        throw new Error(`Failed to update connection status: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to update connection status:', error);
      throw error;
    }
  }

  /**
   * Update connection usage timestamp
   */
  async markConnectionUsed(connectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspace_connections')
        .update({ last_used: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) {
        console.error('Failed to mark connection as used:', error);
      }
    } catch (error) {
      console.error('Failed to mark connection as used:', error);
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string, userId: string): Promise<void> {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('workspace_connections')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .eq('created_by', userId); // Only allow creator to delete

      if (error) {
        throw new Error(`Failed to delete connection: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    }
  }

  /**
   * Update connection details
   */
  async updateConnection(
    connectionId: string, 
    updates: Partial<Pick<WorkspaceConnection, 'name' | 'connection_value'>>,
    userId: string
  ): Promise<WorkspaceConnection> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        status: 'TESTING' as const // Reset to testing when updating
      };

      const { data: connection, error } = await supabase
        .from('workspace_connections')
        .update(updateData)
        .eq('id', connectionId)
        .eq('created_by', userId) // Only allow creator to update
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update connection: ${error.message}`);
      }

      // Test the updated connection
      if (updates.connection_value) {
        const testResult = await this.testConnection(connectionId);
        await this.updateConnectionStatus(
          connectionId, 
          testResult.success ? 'ACTIVE' : 'ERROR',
          testResult.error
        );
      }

      return connection;
    } catch (error) {
      console.error('Failed to update connection:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics for workspace
   */
  async getConnectionStats(workspaceId: string): Promise<{
    total: number;
    active: number;
    error: number;
    byPiece: Array<{ piece_name: string; display_name: string; count: number }>;
  }> {
    try {
      const connections = await this.listConnections(workspaceId);
      
      const stats = {
        total: connections.length,
        active: connections.filter(c => c.status === 'ACTIVE').length,
        error: connections.filter(c => c.status === 'ERROR').length,
        byPiece: [] as Array<{ piece_name: string; display_name: string; count: number }>
      };

      // Group by piece
      const pieceGroups = connections.reduce((acc, conn) => {
        const key = conn.piece_name;
        if (!acc[key]) {
          acc[key] = { piece_name: key, display_name: conn.display_name, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { piece_name: string; display_name: string; count: number }>);

      stats.byPiece = Object.values(pieceGroups);

      return stats;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return { total: 0, active: 0, error: 0, byPiece: [] };
    }
  }
}

// Export singleton instance
export const workspaceConnectionService = new WorkspaceConnectionService();

// Note: Types are already exported as interfaces above 