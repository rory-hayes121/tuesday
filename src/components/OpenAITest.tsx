import React, { useState } from 'react';
import { generateAgentFromPrompt } from '../services/openai';

const OpenAITest: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const generatedAgent = await generateAgentFromPrompt({
        prompt: prompt.trim(),
        context: 'Test generation'
      });
      setResult(generatedAgent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">OpenAI Integration Test</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Test Prompt:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to test agent generation..."
          className="w-full p-3 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <button
        onClick={handleTest}
        disabled={!prompt.trim() || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Test Generation'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Generated Agent:</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {result.name}</p>
            <p><strong>Description:</strong> {result.description}</p>
            <p><strong>Nodes:</strong> {result.nodes?.length || 0}</p>
            <p><strong>Edges:</strong> {result.edges?.length || 0}</p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-green-700 font-medium">
              View Full JSON
            </summary>
            <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default OpenAITest; 