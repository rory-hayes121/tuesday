import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Zap, Star, Clock, Filter, ChevronRight, Loader2 } from 'lucide-react';
import { activepiecesCatalog, PieceMetadata, ActionMetadata, TriggerMetadata } from '../../services/activepiecesCatalog';

interface IntegrationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (piece: PieceMetadata, action: ActionMetadata | TriggerMetadata, type: 'action' | 'trigger') => void;
  mode: 'trigger' | 'action';
}

interface SelectedPiece {
  piece: PieceMetadata;
  actions: ActionMetadata[];
  triggers: TriggerMetadata[];
}

const IntegrationSelectionModal: React.FC<IntegrationSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pieces, setPieces] = useState<PieceMetadata[]>([]);
  const [popularPieces, setPopularPieces] = useState<PieceMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<SelectedPiece | null>(null);
  const [view, setView] = useState<'pieces' | 'actions'>('pieces');

  // Load pieces on mount
  useEffect(() => {
    if (isOpen) {
      loadPieces();
    }
  }, [isOpen]);

  const loadPieces = async () => {
    setLoading(true);
    try {
      const [allPieces, popular] = await Promise.all([
        activepiecesCatalog.fetchPieces(),
        activepiecesCatalog.getPopularPieces()
      ]);
      
      setPieces(allPieces);
      setPopularPieces(popular);
    } catch (error) {
      console.error('Failed to load pieces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'popular', label: 'Popular', icon: Star },
    { id: 'Core', label: 'Core', icon: Zap },
    { id: 'Google', label: 'Google', icon: null },
    { id: 'Email', label: 'Email', icon: null },
    { id: 'Communication', label: 'Communication', icon: null },
    { id: 'Spreadsheets', label: 'Spreadsheets', icon: null },
    { id: 'AI', label: 'AI', icon: null },
  ];

  // Filter pieces based on search and category
  const filteredPieces = useMemo(() => {
    let filtered = pieces;

    // Apply category filter
    if (selectedCategory === 'popular') {
      filtered = popularPieces;
    } else if (selectedCategory !== 'all') {
      filtered = pieces.filter(piece => 
        piece.categories.some(cat => 
          cat.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      );
    }

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(piece =>
        piece.displayName.toLowerCase().includes(query) ||
        piece.description.toLowerCase().includes(query) ||
        piece.name.toLowerCase().includes(query)
      );
    }

    // Filter by mode (only show pieces that have triggers/actions)
    filtered = filtered.filter(piece => 
      mode === 'trigger' ? piece.triggers.length > 0 : piece.actions.length > 0
    );

    return filtered;
  }, [pieces, popularPieces, searchTerm, selectedCategory, mode]);

  const handlePieceSelect = (piece: PieceMetadata) => {
    const selected: SelectedPiece = {
      piece,
      actions: piece.actions,
      triggers: piece.triggers
    };
    setSelectedPiece(selected);
    setView('actions');
  };

  const handleActionSelect = (action: ActionMetadata | TriggerMetadata, type: 'action' | 'trigger') => {
    if (selectedPiece) {
      onSelect(selectedPiece.piece, action, type);
      onClose();
    }
  };

  const handleBack = () => {
    setView('pieces');
    setSelectedPiece(null);
  };

  const renderPieceCard = (piece: PieceMetadata) => (
    <div
      key={piece.name}
      onClick={() => handlePieceSelect(piece)}
      className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer p-4"
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors duration-200">
          {piece.logoUrl ? (
            <img 
              src={piece.logoUrl} 
              alt={piece.displayName}
              className="w-8 h-8 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://img.icons8.com/color/48/000000/puzzle.png';
              }}
            />
          ) : (
            <Zap className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {piece.displayName}
            </h3>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          </div>
          
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {piece.description}
          </p>
          
          <div className="flex items-center mt-2 space-x-2">
            {piece.auth?.required && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Auth Required
              </span>
            )}
            
            <span className="text-xs text-gray-400">
              {mode === 'trigger' 
                ? `${piece.triggers.length} trigger${piece.triggers.length !== 1 ? 's' : ''}`
                : `${piece.actions.length} action${piece.actions.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActionCard = (action: ActionMetadata | TriggerMetadata, type: 'action' | 'trigger') => (
    <div
      key={action.name}
      onClick={() => handleActionSelect(action, type)}
      className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {action.displayName}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {action.description}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {view === 'actions' && (
                  <button
                    onClick={handleBack}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                  </button>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {view === 'pieces' 
                      ? `Choose ${mode === 'trigger' ? 'Trigger' : 'Action'}`
                      : `${selectedPiece?.piece.displayName} ${mode === 'trigger' ? 'Triggers' : 'Actions'}`
                    }
                  </h3>
                  <p className="text-sm text-gray-500">
                    {view === 'pieces'
                      ? `Select an integration to ${mode === 'trigger' ? 'trigger' : 'perform an action in'} your workflow`
                      : `Choose what ${mode === 'trigger' ? 'triggers' : 'action'} this step`
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-6 py-4 max-h-96 overflow-y-auto">
            {view === 'pieces' ? (
              <>
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search integrations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category Tabs */}
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {category.icon && <category.icon className="w-4 h-4" />}
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pieces Grid */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-500">Loading integrations...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredPieces.map(renderPieceCard)}
                  </div>
                )}

                {!loading && filteredPieces.length === 0 && (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-sm font-medium text-gray-900 mb-2">No integrations found</h4>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search or category filter
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Actions View */
              <div className="space-y-3">
                {mode === 'trigger' && selectedPiece?.triggers.map(trigger => 
                  renderActionCard(trigger, 'trigger')
                )}
                {mode === 'action' && selectedPiece?.actions.map(action => 
                  renderActionCard(action, 'action')
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSelectionModal; 