import React, { useState } from 'react';
import { X, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';

interface ActivepiecesAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSubmit: (token: string) => void;
  message: string;
}

const ActivepiecesAuthModal: React.FC<ActivepiecesAuthModalProps> = ({
  isOpen,
  onClose,
  onTokenSubmit,
  message
}) => {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [instructionsCopied, setInstructionsCopied] = useState(false);

  const handleSubmit = async () => {
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      onTokenSubmit(token.trim());
      setToken('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid token');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActivepieces = () => {
    window.open('https://activepieces-production-aa7c.up.railway.app', '_blank');
  };

  const copyInstructions = () => {
    const instructions = `1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh the page or navigate around
4. Find any API request (like /api/v1/flows)
5. Copy the Authorization header value (remove "Bearer " prefix)`;
    
    navigator.clipboard.writeText(instructions);
    setInstructionsCopied(true);
    setTimeout(() => setInstructionsCopied(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Authentication Required
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-4">
              To deploy flows to your Activepieces instance, we need a valid authentication token.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center justify-between">
                Quick Steps:
                <button
                  onClick={copyInstructions}
                  className="text-blue-600 hover:text-blue-700 text-xs flex items-center space-x-1"
                >
                  {instructionsCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Open your Activepieces instance</li>
                <li>2. Log in if not already logged in</li>
                <li>3. Open Developer Tools (F12)</li>
                <li>4. Go to Network tab</li>
                <li>5. Refresh the page or navigate around</li>
                <li>6. Find any API request (like /api/v1/flows)</li>
                <li>7. Copy the Authorization header value</li>
                <li>8. Remove "Bearer " prefix and paste below</li>
              </ol>
            </div>

            <button
              onClick={openActivepieces}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Activepieces</span>
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Token:
            </label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Paste your JWT token here (without 'Bearer ' prefix)..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !token.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivepiecesAuthModal; 