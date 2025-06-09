import React from 'react';
import { 
  Play, 
  Save, 
  Undo, 
  Redo, 
  RotateCcw, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Eye,
  Settings
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';

interface WorkflowToolbarProps {
  onSave: () => void;
  onTest: () => void;
  onPreview: () => void;
  isTestMode?: boolean;
  isSaving?: boolean;
}

const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onSave,
  onTest,
  onPreview,
  isTestMode = false,
  isSaving = false
}) => {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    autoLayout,
    validationResult,
    validateWorkflow
  } = useWorkflowStore();

  const handleValidate = () => {
    const result = validateWorkflow();
    console.log('Validation result:', result);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Main actions */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onTest}
              disabled={isTestMode}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isTestMode ? 'Testing...' : 'Test Run'}</span>
            </button>
            
            <button
              onClick={onPreview}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Layout */}
          <button
            onClick={autoLayout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Auto Layout"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right side - Status and validation */}
        <div className="flex items-center space-x-4">
          {/* Validation Status */}
          <div className="flex items-center space-x-2">
            {validationResult ? (
              validationResult.isValid ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Valid</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            ) : (
              <button
                onClick={handleValidate}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <Zap className="w-4 h-4" />
                <span>Validate</span>
              </button>
            )}
          </div>

          {/* Settings */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Workflow Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Details */}
      {validationResult && !validationResult.isValid && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="space-y-1">
            {validationResult.errors.slice(0, 3).map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                • {error.message}
              </div>
            ))}
            {validationResult.errors.length > 3 && (
              <div className="text-sm text-red-600">
                +{validationResult.errors.length - 3} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="space-y-1">
            {validationResult.warnings.slice(0, 2).map((warning, index) => (
              <div key={index} className="text-sm text-yellow-700">
                • {warning.message}
              </div>
            ))}
            {validationResult.warnings.length > 2 && (
              <div className="text-sm text-yellow-600">
                +{validationResult.warnings.length - 2} more warnings
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowToolbar;