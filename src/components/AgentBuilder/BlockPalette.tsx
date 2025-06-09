import React from 'react';
import { MessageSquare, Puzzle, GitBranch, Database, X } from 'lucide-react';
import { AgentBlock } from '../../types';

interface BlockPaletteProps {
  onAddBlock: (blockType: AgentBlock['type']) => void;
  onDragStart: (blockType: AgentBlock['type']) => void;
  onClose: () => void;
}

const BlockPalette: React.FC<BlockPaletteProps> = ({ onAddBlock, onDragStart, onClose }) => {
  const blockTypes = [
    {
      type: 'prompt' as const,
      label: 'AI Prompt',
      description: 'Natural language instructions for AI',
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600'
    },
    {
      type: 'tool' as const,
      label: 'Tool Call',
      description: 'Connect to external services',
      icon: Puzzle,
      color: 'from-green-500 to-green-600'
    },
    {
      type: 'logic' as const,
      label: 'Logic Branch',
      description: 'Conditional logic and branching',
      icon: GitBranch,
      color: 'from-purple-500 to-purple-600'
    },
    {
      type: 'memory' as const,
      label: 'Memory Store',
      description: 'Store and retrieve data',
      icon: Database,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleDragStart = (e: React.DragEvent, blockType: AgentBlock['type']) => {
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(blockType);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-72">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Add Block</h3>
        <button 
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {blockTypes.map((blockType) => {
          const Icon = blockType.icon;
          return (
            <div
              key={blockType.type}
              draggable
              onDragStart={(e) => handleDragStart(e, blockType.type)}
              onClick={() => onAddBlock(blockType.type)}
              className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${blockType.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">{blockType.label}</h4>
                  <p className="text-xs text-gray-600 truncate">{blockType.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Drag blocks onto the canvas or click to add at the default position
        </p>
      </div>
    </div>
  );
};

export default BlockPalette;