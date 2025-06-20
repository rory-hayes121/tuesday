import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Zap,
  AlertCircle
} from 'lucide-react';
import { generateAgentFromPrompt } from '../../services/openai';
import ActivepiecesConnectionTest from '../ActivepiecesConnectionTest';

interface HomeProps {
  onCreateAgent: (prompt: string, generatedAgent?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onCreateAgent }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectionTest, setShowConnectionTest] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Generating agent from prompt:', prompt);
      
      // Generate agent using OpenAI
      const generatedAgent = await generateAgentFromPrompt({
        prompt: prompt.trim(),
        context: 'User wants to create an AI agent workflow'
      });

      console.log('Generated agent:', generatedAgent);

      // Pass the generated agent data to the parent
      onCreateAgent(prompt, generatedAgent);
    } catch (err) {
      console.error('Failed to generate agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate agent. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Development Tools - Temporary */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setShowConnectionTest(!showConnectionTest)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
          >
            {showConnectionTest ? 'Hide' : 'Show'} Activepieces Connection Test
          </button>
        </div>

        {/* Connection Test Panel */}
        {showConnectionTest && (
          <div className="mb-12">
            <ActivepiecesConnectionTest />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Build Your AI Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Describe what you want your AI agent to do, and we'll create the perfect workflow for you using advanced AI.
          </p>
        </div>

        {/* Main Prompt Input */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 mb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                What would you like your AI agent to do?
              </label>
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your agent... For example: 'Create an agent that monitors our support inbox, categorizes tickets by urgency, and assigns them to the right team members'"
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
                  rows={4}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Failed to generate agent</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating your agent with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Agent with AI</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Example Prompts */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Need inspiration? Try these examples:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Create a customer support email responder that analyzes sentiment and generates appropriate replies",
              "Build a content moderator that reviews social media posts and flags inappropriate content",
              "Make an agent that summarizes long documents and extracts key insights",
              "Create a lead qualification agent that scores prospects based on their responses",
              "Build a code reviewer that analyzes pull requests and suggests improvements",
              "Make a meeting scheduler that finds optimal times for multiple participants"
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => handleTryExample(example)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left text-sm text-gray-700 hover:text-blue-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">AI-Generated Workflows</h3>
              <p className="text-sm text-gray-600">
                Our AI understands your requirements and builds the perfect workflow automatically
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Smart Block Selection</h3>
              <p className="text-sm text-gray-600">
                Advanced AI chooses the right combination of blocks for your specific use case
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Instant Customization</h3>
              <p className="text-sm text-gray-600">
                Generated workflows are fully editable - tweak and customize as needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;