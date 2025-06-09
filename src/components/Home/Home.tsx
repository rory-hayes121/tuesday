import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Zap
} from 'lucide-react';

interface HomeProps {
  onCreateAgent: (prompt: string) => void;
}

const Home: React.FC<HomeProps> = ({ onCreateAgent }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    onCreateAgent(prompt);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
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
            Describe what you want your AI agent to do, and we'll create the perfect workflow for you.
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
            
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating your agent...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Agent</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">No-Code Builder</h3>
              <p className="text-sm text-gray-600">
                Create powerful AI workflows without writing a single line of code
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Leverage advanced AI models to automate complex business processes
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Easy Integration</h3>
              <p className="text-sm text-gray-600">
                Connect with your favorite tools like Slack, Notion, and more
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;