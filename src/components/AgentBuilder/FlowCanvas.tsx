import React, { forwardRef, useState, useCallback } from 'react';
import { MessageSquare, Puzzle, GitBranch, Database, MoreHorizontal, Trash2, Settings, GripVertical } from 'lucide-react';
import { AgentBlock } from '../../types';

interface FlowCanvasProps {
  blocks: AgentBlock[];
  selectedBlock: string | null;
  onBlockSelect: (blockId: string) => void;
  onBlockUpdate: (blockId: string, updates: Partial<AgentBlock>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockMove: (blockId: string, position: { x: number; y: number }) => void;
  onClick: (e: React.MouseEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const FlowCanvas = forwardRef<HTMLDivElement, FlowCanvasProps>(({ 
  blocks, 
  selectedBlock, 
  onBlockSelect, 
  onBlockUpdate,
  onBlockDelete,
  onBlockMove,
  onClick,
  onDrop,
  onDragOver
}, ref) => {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const blockIcons = {
    prompt: MessageSquare,
    tool: Puzzle,
    logic: GitBranch,
    memory: Database
  };

  const blockColors = {
    prompt: 'from-blue-500 to-blue-600',
    tool: 'from-green-500 to-green-600',
    logic: 'from-purple-500 to-purple-600',
    memory: 'from-orange-500 to-orange-600'
  };

  const getBlockTitle = (block: AgentBlock) => {
    switch (block.type) {
      case 'prompt':
        return block.data.instruction?.slice(0, 30) + '...' || 'AI Prompt';
      case 'tool':
        return block.data.service || 'Tool Call';
      case 'logic':
        return block.data.condition || 'Logic Branch';
      case 'memory':
        return block.data.key || 'Memory Store';
      default:
        return 'Unknown Block';
    }
  };

  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    if (e.button !== 0) return; // Only handle left click
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - block.position.x,
      y: e.clientY - block.position.y
    });
    setDraggedBlock(blockId);
    onBlockSelect(blockId);
    
    e.preventDefault();
  }, [blocks, onBlockSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedBlock || !ref || typeof ref === 'function') return;

    const canvasRect = (ref as React.RefObject<HTMLDivElement>).current?.getBoundingClientRect();
    if (!canvasRect) return;

    const newPosition = {
      x: e.clientX - canvasRect.left - dragOffset.x,
      y: e.clientY - canvasRect.top - dragOffset.y
    };

    onBlockMove(draggedBlock, newPosition);
  }, [draggedBlock, dragOffset, onBlockMove, ref]);

  const handleMouseUp = useCallback(() => {
    setDraggedBlock(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    if (draggedBlock) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedBlock, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={ref}
      className="relative w-full h-full bg-gray-50 overflow-hidden"
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Canvas Content */}
      <div className="relative w-full h-full">
        {blocks.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Puzzle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Start Building Your Agent</h3>
              <p className="text-gray-600 max-w-md mb-6">
                Click the + button to add your first block and start creating your AI agent workflow.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
                <p className="text-sm text-blue-700">
                  💡 Tip: Start with a Prompt block to define your AI's behavior
                </p>
              </div>
            </div>
          </div>
        )}

        {blocks.map((block) => {
          const Icon = blockIcons[block.type];
          const isSelected = selectedBlock === block.id;
          const isDragging = draggedBlock === block.id;
          
          return (
            <div
              key={block.id}
              className={`absolute cursor-move transition-all duration-200 ${
                isSelected ? 'z-20' : 'z-10'
              } ${isDragging ? 'scale-105' : 'hover:scale-102'}`}
              style={{
                left: block.position.x,
                top: block.position.y,
                transform: isDragging ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
            >
              <div className={`w-72 bg-white rounded-xl border-2 shadow-lg transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 shadow-xl' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
              }`}>
                {/* Block Header */}
                <div className={`p-4 bg-gradient-to-r ${blockColors[block.type]} rounded-t-xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-white" />
                      <span className="font-medium text-white capitalize">{block.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockSelect(block.id);
                        }}
                        className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockDelete(block.id);
                        }}
                        className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-1 text-white/70 cursor-move">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Block Content */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {getBlockTitle(block)}
                  </h4>
                  
                  {block.type === 'prompt' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {block.data.instruction || 'No instruction set'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {block.data.model || 'gpt-4'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {block.type === 'tool' && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Service:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {block.data.service || 'Not configured'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Action:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {block.data.action || 'Not configured'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {block.type === 'logic' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Condition: {block.data.condition || 'No condition set'}
                      </p>
                    </div>
                  )}
                  
                  {block.type === 'memory' && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Operation:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {block.data.operation || 'store'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Key:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {block.data.key || 'Not set'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Points */}
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full shadow-sm hover:border-blue-500 transition-colors duration-200"></div>
                </div>
                <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full shadow-sm hover:border-blue-500 transition-colors duration-200"></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {blocks.map((block, index) => {
            if (index === 0) return null;
            const prevBlock = blocks[index - 1];
            return (
              <line
                key={`connection-${block.id}`}
                x1={prevBlock.position.x + 288}
                y1={prevBlock.position.y + 80}
                x2={block.position.x}
                y2={block.position.y + 80}
                stroke="#E5E7EB"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
});

FlowCanvas.displayName = 'FlowCanvas';

export default FlowCanvas;