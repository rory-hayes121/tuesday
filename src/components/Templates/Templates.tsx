import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Clock, 
  MessageSquare,
  Slack,
  FileText,
  Users,
  TrendingUp,
  Mail,
  Calendar,
  X
} from 'lucide-react';
import { Template } from '../../types';

interface TemplatesProps {
  onUseTemplate?: (templateId: string) => void;
}

const Templates: React.FC<TemplatesProps> = ({ onUseTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPreviewModal, setShowPreviewModal] = useState<Template | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'communication', label: 'Communication' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'sales', label: 'Sales & CRM' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'support', label: 'Customer Support' }
  ];

  const templates: Template[] = [
    {
      id: '1',
      name: 'Daily Slack Summary',
      description: 'Automatically summarizes important Slack messages and sends a daily digest to your team',
      category: 'communication',
      blocks: [
        { id: '1', type: 'tool', name: 'Slack - Get Messages', description: 'Fetches messages from specified channels' },
        { id: '2', type: 'prompt', name: 'AI Summarizer', description: 'Analyzes and summarizes important content' },
        { id: '3', type: 'tool', name: 'Slack - Send Message', description: 'Sends formatted summary to team channel' }
      ],
      preview: 'Collects messages from specified channels, analyzes importance using AI, and sends formatted summary'
    },
    {
      id: '2',
      name: 'Lead Qualification Bot',
      description: 'Qualifies new leads from your CRM and automatically assigns them to the right sales rep',
      category: 'sales',
      blocks: [
        { id: '1', type: 'tool', name: 'CRM - Get New Leads', description: 'Monitors CRM for new lead entries' },
        { id: '2', type: 'prompt', name: 'Lead Scorer', description: 'Evaluates lead quality and fit' },
        { id: '3', type: 'logic', name: 'Assignment Logic', description: 'Routes leads based on criteria' },
        { id: '4', type: 'tool', name: 'CRM - Assign Lead', description: 'Updates lead assignment in CRM' }
      ],
      preview: 'Analyzes lead data, scores qualification, and routes to appropriate team member'
    },
    {
      id: '3',
      name: 'Content Research Assistant',
      description: 'Researches topics and creates comprehensive content briefs for your marketing team',
      category: 'marketing',
      blocks: [
        { id: '1', type: 'prompt', name: 'Topic Researcher', description: 'Researches given topics comprehensively' },
        { id: '2', type: 'tool', name: 'Web Search', description: 'Gathers information from multiple sources' },
        { id: '3', type: 'prompt', name: 'Brief Creator', description: 'Creates structured content outlines' },
        { id: '4', type: 'tool', name: 'Notion - Create Page', description: 'Saves brief to Notion workspace' }
      ],
      preview: 'Gathers information from multiple sources and creates structured content outlines'
    },
    {
      id: '4',
      name: 'Meeting Notes Generator',
      description: 'Automatically generates and distributes meeting notes from calendar events',
      category: 'productivity',
      blocks: [
        { id: '1', type: 'tool', name: 'Calendar - Get Events', description: 'Monitors calendar for meetings' },
        { id: '2', type: 'prompt', name: 'Notes Extractor', description: 'Extracts key points from recordings' },
        { id: '3', type: 'tool', name: 'Email - Send Notes', description: 'Distributes notes to attendees' }
      ],
      preview: 'Extracts key points from meeting recordings and creates actionable summaries'
    },
    {
      id: '5',
      name: 'Customer Support Triage',
      description: 'Automatically categorizes and prioritizes incoming support tickets',
      category: 'support',
      blocks: [
        { id: '1', type: 'tool', name: 'Support - Get Tickets', description: 'Monitors incoming support requests' },
        { id: '2', type: 'prompt', name: 'Ticket Analyzer', description: 'Categorizes and prioritizes tickets' },
        { id: '3', type: 'logic', name: 'Routing Logic', description: 'Routes based on urgency and type' },
        { id: '4', type: 'tool', name: 'Support - Assign Ticket', description: 'Assigns to appropriate agent' }
      ],
      preview: 'Analyzes ticket content, assigns urgency levels, and routes to appropriate agents'
    },
    {
      id: '6',
      name: 'Social Media Scheduler',
      description: 'Creates and schedules social media content based on trending topics',
      category: 'marketing',
      blocks: [
        { id: '1', type: 'tool', name: 'Trends Monitor', description: 'Monitors trending topics and hashtags' },
        { id: '2', type: 'prompt', name: 'Content Creator', description: 'Generates relevant social content' },
        { id: '3', type: 'tool', name: 'Social - Schedule Post', description: 'Schedules across platforms' }
      ],
      preview: 'Monitors trends, generates relevant content, and schedules across platforms'
    }
  ];

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'communication': return MessageSquare;
      case 'productivity': return FileText;
      case 'sales': return TrendingUp;
      case 'marketing': return Mail;
      case 'support': return Users;
      default: return FileText;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (templateId: string) => {
    if (onUseTemplate) {
      onUseTemplate(templateId);
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    setShowPreviewModal(template);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Start with pre-built agent templates and customize them for your needs</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{filteredTemplates.length} templates found</span>
          </div>
        </div>
      </div>

      {/* Featured Templates */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Featured Templates</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.slice(0, 2).map((template) => {
              const Icon = getTemplateIcon(template.category);
              return (
                <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  </div>
                  
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="bg-white/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">{template.preview}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>1.2k uses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>5 min setup</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePreviewTemplate(template)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      <button 
                        onClick={() => handleUseTemplate(template.id)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* All Templates */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Templates</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const Icon = getTemplateIcon(template.category);
              return (
                <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>245</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>3 min</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePreviewTemplate(template)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUseTemplate(template.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  {React.createElement(getTemplateIcon(showPreviewModal.category), { className: "w-6 h-6 text-white" })}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{showPreviewModal.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{showPreviewModal.category}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreviewModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{showPreviewModal.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Workflow Steps</h4>
                <div className="space-y-3">
                  {showPreviewModal.blocks.map((block, index) => (
                    <div key={block.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{block.name}</h5>
                        <p className="text-sm text-gray-600">{block.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        block.type === 'prompt' ? 'text-blue-600 bg-blue-100' :
                        block.type === 'tool' ? 'text-green-600 bg-green-100' :
                        block.type === 'logic' ? 'text-purple-600 bg-purple-100' :
                        'text-orange-600 bg-orange-100'
                      }`}>
                        {block.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-8">
              <button 
                onClick={() => setShowPreviewModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  handleUseTemplate(showPreviewModal.id);
                  setShowPreviewModal(null);
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;