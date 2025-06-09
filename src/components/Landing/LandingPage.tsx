import React from 'react';
import { 
  Bot, 
  Zap, 
  Users, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  MessageSquare,
  Calendar,
  Mail,
  Database,
  TrendingUp,
  Star,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AgentFlow</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={onSignIn}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={onSignUp}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Bot className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Build AI Agents
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Without Code
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create powerful AI workflows that automate your business processes. 
              Connect your tools, define your logic, and let AI handle the rest.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={onSignUp}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Start Building Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How AgentFlow Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to automate your workflows with AI
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Describe Your Workflow</h3>
              <p className="text-gray-600">
                Simply describe what you want to automate in plain English. Our AI understands your requirements and creates the initial workflow.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Connect Your Tools</h3>
              <p className="text-gray-600">
                Connect to your favorite apps like Slack, Notion, Gmail, and more. Our visual builder makes it easy to customize your workflow.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Deploy & Automate</h3>
              <p className="text-gray-600">
                Deploy your AI agent and watch it work. Monitor performance, make adjustments, and scale your automation across your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to build, deploy, and manage AI-powered workflows
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: 'Visual Workflow Builder',
                description: 'Drag-and-drop interface to build complex AI workflows without coding',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: Zap,
                title: 'Pre-built Integrations',
                description: 'Connect to 100+ apps including Slack, Notion, Gmail, Salesforce, and more',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Share workflows with your team and collaborate on automation projects',
                color: 'from-green-500 to-green-600'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'SOC 2 compliant with enterprise-grade security and data protection',
                color: 'from-orange-500 to-orange-600'
              },
              {
                icon: TrendingUp,
                title: 'Analytics & Monitoring',
                description: 'Track performance, monitor usage, and optimize your workflows',
                color: 'from-pink-500 to-pink-600'
              },
              {
                icon: MessageSquare,
                title: 'AI-Powered Logic',
                description: 'Advanced AI capabilities for natural language processing and decision making',
                color: 'from-indigo-500 to-indigo-600'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Use Cases</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how teams are using AgentFlow to automate their workflows
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Mail,
                title: 'Customer Support Automation',
                description: 'Automatically categorize support tickets, route to the right team, and send personalized responses.',
                tags: ['Support', 'Email', 'AI']
              },
              {
                icon: Calendar,
                title: 'Meeting Management',
                description: 'Schedule meetings, send reminders, generate summaries, and follow up on action items automatically.',
                tags: ['Productivity', 'Calendar', 'Slack']
              },
              {
                icon: Database,
                title: 'Lead Qualification',
                description: 'Score and qualify leads from your CRM, assign to sales reps, and trigger follow-up sequences.',
                tags: ['Sales', 'CRM', 'Automation']
              },
              {
                icon: TrendingUp,
                title: 'Content Creation',
                description: 'Generate social media posts, blog outlines, and marketing copy based on trending topics.',
                tags: ['Marketing', 'Content', 'Social']
              }
            ].map((useCase, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <useCase.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{useCase.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{useCase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Teams Worldwide</h2>
            <p className="text-xl text-gray-600">Join thousands of teams already automating with AgentFlow</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "AgentFlow transformed how we handle customer support. We've reduced response time by 80% and our team can focus on complex issues.",
                author: "Sarah Chen",
                role: "Head of Support",
                company: "TechCorp"
              },
              {
                quote: "The visual builder makes it so easy to create complex workflows. Our sales team is now 3x more efficient with lead qualification.",
                author: "Mike Rodriguez",
                role: "Sales Director",
                company: "GrowthCo"
              },
              {
                quote: "We automated our entire content pipeline with AgentFlow. From research to publishing, everything runs smoothly without manual intervention.",
                author: "Emily Watson",
                role: "Marketing Manager",
                company: "ContentPro"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Automate Your Workflows?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams using AgentFlow to build powerful AI automations
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={onSignUp}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onSignIn}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Sign In
            </button>
          </div>
          
          <p className="text-blue-100 text-sm mt-6">
            No credit card required • Free forever plan • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AgentFlow</span>
              </div>
              <p className="text-gray-400">
                Build powerful AI workflows without code. Automate your business processes with ease.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AgentFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;