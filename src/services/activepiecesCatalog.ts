/**
 * Activepieces Catalog Service
 * Fetches and manages integration pieces from Activepieces API
 * Provides caching and real-time piece information
 */

export interface PieceMetadata {
  name: string;
  displayName: string;
  description: string;
  logoUrl?: string;
  version: string;
  categories: string[];
  auth?: {
    type: 'OAUTH2' | 'API_KEY' | 'BASIC' | 'CUSTOM';
    required: boolean;
  };
  actions: ActionMetadata[];
  triggers: TriggerMetadata[];
}

export interface ActionMetadata {
  name: string;
  displayName: string;
  description: string;
  props: PropertySchema;
  sampleData?: any;
}

export interface TriggerMetadata {
  name: string;
  displayName: string;
  description: string;
  props: PropertySchema;
  type: 'POLLING' | 'WEBHOOK';
  sampleData?: any;
}

export interface PropertySchema {
  [key: string]: {
    displayName: string;
    description?: string;
    required: boolean;
    type: 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMBER' | 'CHECKBOX' | 'DROPDOWN' | 'STATIC_DROPDOWN' | 'MULTI_SELECT_DROPDOWN' | 'DYNAMIC' | 'JSON' | 'FILE' | 'DATE_TIME' | 'ARRAY' | 'OBJECT';
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
  };
}

export interface ConnectionMetadata {
  id: string;
  name: string;
  pieceName: string;
  displayName: string;
  status: 'ACTIVE' | 'ERROR' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
}

class ActivepiecesCatalogService {
  private baseUrl: string;
  private projectId: string;
  private cache: Map<string, PieceMetadata> = new Map();
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private lastCacheUpdate: number = 0;

  constructor() {
    this.baseUrl = 'https://activepieces-production-aa7c.up.railway.app/api/v1';
    this.projectId = 'C8NIVPDXRrRamepemIuFV';
  }

  /**
   * Fetch all available pieces from Activepieces
   */
  async fetchPieces(): Promise<PieceMetadata[]> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return Array.from(this.cache.values());
      }

      console.log('Fetching pieces from Activepieces...');
      
      const response = await fetch(`${this.baseUrl}/pieces`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pieces: ${response.status}`);
      }

      const data = await response.json();
      const pieces = this.transformPiecesResponse(data);
      
      // Update cache
      this.updateCache(pieces);
      
      return pieces;
    } catch (error) {
      console.error('Error fetching pieces:', error);
      // Return cached data if available, or fallback data
      return this.cache.size > 0 ? Array.from(this.cache.values()) : this.getFallbackPieces();
    }
  }

  /**
   * Get detailed information for a specific piece
   */
  async getPieceDetails(pieceName: string): Promise<PieceMetadata | null> {
    try {
      // Check cache first
      if (this.cache.has(pieceName)) {
        return this.cache.get(pieceName)!;
      }

      const response = await fetch(`${this.baseUrl}/pieces/${pieceName}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch piece details: ${response.status}`);
      }

      const data = await response.json();
      const piece = this.transformPieceResponse(data);
      
      // Cache the result
      this.cache.set(pieceName, piece);
      
      return piece;
    } catch (error) {
      console.error(`Error fetching piece details for ${pieceName}:`, error);
      return null;
    }
  }

  /**
   * Get pieces by category
   */
  async getPiecesByCategory(category: string): Promise<PieceMetadata[]> {
    const allPieces = await this.fetchPieces();
    return allPieces.filter(piece => 
      piece.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
    );
  }

  /**
   * Search pieces by name or description
   */
  async searchPieces(query: string): Promise<PieceMetadata[]> {
    const allPieces = await this.fetchPieces();
    const lowercaseQuery = query.toLowerCase();
    
    return allPieces.filter(piece =>
      piece.displayName.toLowerCase().includes(lowercaseQuery) ||
      piece.description.toLowerCase().includes(lowercaseQuery) ||
      piece.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get popular/featured pieces
   */
  async getPopularPieces(): Promise<PieceMetadata[]> {
    const popularPieceNames = [
      '@activepieces/piece-gmail',
      '@activepieces/piece-google-sheets',
      '@activepieces/piece-slack',
      '@activepieces/piece-http',
      '@activepieces/piece-openai',
      '@activepieces/piece-webhook',
      '@activepieces/piece-airtable',
      '@activepieces/piece-notion'
    ];

    const allPieces = await this.fetchPieces();
    return allPieces.filter(piece => popularPieceNames.includes(piece.name));
  }

  /**
   * Transform Activepieces API response to our format
   */
  private transformPiecesResponse(data: any): PieceMetadata[] {
    if (!data || !Array.isArray(data)) {
      console.warn('Invalid pieces response format');
      return [];
    }

    return data.map(piece => this.transformPieceResponse(piece));
  }

  /**
   * Transform single piece response
   */
  private transformPieceResponse(piece: any): PieceMetadata {
    return {
      name: piece.name || piece.pieceName || 'unknown',
      displayName: piece.displayName || piece.name || 'Unknown Integration',
      description: piece.description || 'No description available',
      logoUrl: piece.logoUrl || piece.logo || this.getDefaultLogo(piece.name),
      version: piece.version || '1.0.0',
      categories: this.extractCategories(piece),
      auth: piece.auth ? {
        type: piece.auth.type || 'CUSTOM',
        required: piece.auth.required !== false
      } : undefined,
      actions: this.transformActions(piece.actions || []),
      triggers: this.transformTriggers(piece.triggers || [])
    };
  }

  /**
   * Transform actions array
   */
  private transformActions(actions: any[]): ActionMetadata[] {
    return actions.map(action => ({
      name: action.name || 'unknown',
      displayName: action.displayName || action.name || 'Unknown Action',
      description: action.description || 'No description available',
      props: this.transformProps(action.props || {}),
      sampleData: action.sampleData
    }));
  }

  /**
   * Transform triggers array
   */
  private transformTriggers(triggers: any[]): TriggerMetadata[] {
    return triggers.map(trigger => ({
      name: trigger.name || 'unknown',
      displayName: trigger.displayName || trigger.name || 'Unknown Trigger',
      description: trigger.description || 'No description available',
      props: this.transformProps(trigger.props || {}),
      type: trigger.type || 'POLLING',
      sampleData: trigger.sampleData
    }));
  }

  /**
   * Transform properties schema
   */
  private transformProps(props: any): PropertySchema {
    const schema: PropertySchema = {};
    
    for (const [key, prop] of Object.entries(props || {})) {
      const p = prop as any;
      schema[key] = {
        displayName: p.displayName || key,
        description: p.description || '',
        required: p.required !== false,
        type: p.type || 'SHORT_TEXT',
        defaultValue: p.defaultValue,
        options: p.options || []
      };
    }
    
    return schema;
  }

  /**
   * Extract categories from piece data
   */
  private extractCategories(piece: any): string[] {
    const categories = [];
    
    if (piece.categories) {
      categories.push(...piece.categories);
    }
    
    // Infer categories from piece name
    const name = piece.name || '';
    if (name.includes('google')) categories.push('Google');
    if (name.includes('microsoft')) categories.push('Microsoft');
    if (name.includes('slack')) categories.push('Communication');
    if (name.includes('gmail') || name.includes('email')) categories.push('Email');
    if (name.includes('sheet') || name.includes('airtable')) categories.push('Spreadsheets');
    if (name.includes('openai') || name.includes('ai')) categories.push('AI');
    if (name.includes('http') || name.includes('webhook')) categories.push('Core');
    
    return categories.length > 0 ? categories : ['Other'];
  }

  /**
   * Get default logo for a piece
   */
  private getDefaultLogo(pieceName: string): string {
    const logoMap: { [key: string]: string } = {
      '@activepieces/piece-gmail': 'https://developers.google.com/gmail/images/gmail_logo.png',
      '@activepieces/piece-google-sheets': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
      '@activepieces/piece-slack': 'https://cdn.brandfolder.io/5H442O3W/as/pl546j-7le8zk-5guop3/Slack_RGB.png',
      '@activepieces/piece-openai': 'https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg',
      '@activepieces/piece-http': 'https://img.icons8.com/color/48/000000/api-settings.png',
      '@activepieces/piece-webhook': 'https://img.icons8.com/color/48/000000/webhook.png'
    };
    
    return logoMap[pieceName] || 'https://img.icons8.com/color/48/000000/puzzle.png';
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return (
      this.cache.size > 0 && 
      Date.now() - this.lastCacheUpdate < this.cacheExpiry
    );
  }

  /**
   * Update cache with new pieces
   */
  private updateCache(pieces: PieceMetadata[]): void {
    this.cache.clear();
    pieces.forEach(piece => {
      this.cache.set(piece.name, piece);
    });
    this.lastCacheUpdate = Date.now();
  }

  /**
   * Get fallback pieces when API is unavailable
   */
  private getFallbackPieces(): PieceMetadata[] {
    return [
      {
        name: '@activepieces/piece-webhook',
        displayName: 'Webhook',
        description: 'Receive HTTP requests',
        logoUrl: 'https://img.icons8.com/color/48/000000/webhook.png',
        version: '1.0.0',
        categories: ['Core'],
        actions: [],
        triggers: [{
          name: 'webhook',
          displayName: 'Webhook Trigger',
          description: 'Triggers when a webhook is received',
          props: {},
          type: 'WEBHOOK'
        }]
      },
      {
        name: '@activepieces/piece-http',
        displayName: 'HTTP',
        description: 'Make HTTP requests',
        logoUrl: 'https://img.icons8.com/color/48/000000/api-settings.png',
        version: '1.0.0',
        categories: ['Core'],
        actions: [{
          name: 'send_request',
          displayName: 'Send Request',
          description: 'Send an HTTP request',
          props: {
            url: {
              displayName: 'URL',
              description: 'The URL to send the request to',
              required: true,
              type: 'SHORT_TEXT'
            },
            method: {
              displayName: 'Method',
              description: 'HTTP method',
              required: true,
              type: 'STATIC_DROPDOWN',
              options: [
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'DELETE', value: 'DELETE' }
              ]
            }
          }
        }],
        triggers: []
      }
    ];
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }
}

// Export singleton instance
export const activepiecesCatalog = new ActivepiecesCatalogService(); 