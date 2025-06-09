import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import OnboardingFlow from './components/Auth/OnboardingFlow';
import Sidebar from './components/Layout/Sidebar';
import AgentBuilder from './components/AgentBuilder/AgentBuilder';
import Integrations from './components/Integrations/Integrations';
import Templates from './components/Templates/Templates';
import Team from './components/Team/Team';
import Home from './components/Home/Home';
import Agents from './components/Agents/Agents';
import { AgentBlock } from './types';

type AppView = 'landing' | 'login' | 'signup' | 'onboarding' | 'app';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeSection, setActiveSection] = useState('agents'); // Changed default to 'agents'
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If authenticated, check if we need onboarding
  if (isAuthenticated && user) {
    // For new users (just signed up), show onboarding
    if (showOnboarding) {
      return (
        <OnboardingFlow 
          onComplete={() => setShowOnboarding(false)}
        />
      );
    }

    // Show main app
    return <MainApp />;
  }

  // Show auth flows for non-authenticated users
  switch (currentView) {
    case 'login':
      return (
        <LoginPage 
          onBack={() => setCurrentView('landing')}
          onSignUp={() => setCurrentView('signup')}
        />
      );
    case 'signup':
      return (
        <SignupPage 
          onBack={() => setCurrentView('landing')}
          onSignIn={() => setCurrentView('login')}
        />
      );
    default:
      return (
        <LandingPage 
          onSignIn={() => setCurrentView('login')}
          onSignUp={() => setCurrentView('signup')}
        />
      );
  }
}

function MainApp() {
  const [activeSection, setActiveSection] = useState('agents'); // Changed default to 'agents'
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [generatedAgentData, setGeneratedAgentData] = useState<any>(null);

  const handleCreateAgent = (prompt?: string, generatedAgent?: any) => {
    setActiveSection('builder');
    setEditingAgent(null);
    
    if (generatedAgent) {
      console.log('Creating agent from AI generation:', generatedAgent);
      setGeneratedAgentData(generatedAgent);
    } else {
      setGeneratedAgentData(null);
      if (prompt) {
        console.log('Creating agent from prompt:', prompt);
      }
    }
  };

  const handleEditAgent = (agentId: string) => {
    setActiveSection('builder');
    setEditingAgent(agentId);
    setGeneratedAgentData(null); // Clear any generated data when editing existing agent
  };

  const handleSaveAgent = async (workflow: any) => {
    try {
      console.log('Saving agent workflow:', workflow);
      
      // Here you would save to the agents table
      // For now, just log and redirect
      setActiveSection('agents');
      setEditingAgent(null);
      setGeneratedAgentData(null); // Clear generated data after saving
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleTestAgent = () => {
    console.log('Testing agent...');
  };

  const handleUseTemplate = (templateId: string) => {
    console.log('Using template:', templateId);
    setActiveSection('builder');
    setEditingAgent(null);
    setGeneratedAgentData(null);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <Home onCreateAgent={handleCreateAgent} />;
      case 'agents':
        return (
          <Agents 
            onCreateAgent={handleCreateAgent}
            onEditAgent={handleEditAgent}
          />
        );
      case 'builder':
        return (
          <AgentBuilder
            agentId={editingAgent}
            generatedAgent={generatedAgentData}
            onSave={handleSaveAgent}
            onTest={handleTestAgent}
          />
        );
      case 'integrations':
        return <Integrations />;
      case 'templates':
        return <Templates onUseTemplate={handleUseTemplate} />;
      case 'team':
        return <Team />;
      case 'settings':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and workspace settings</p>
          </div>
        );
      default:
        return (
          <Agents 
            onCreateAgent={handleCreateAgent}
            onEditAgent={handleEditAgent}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <main className="flex-1 overflow-hidden">
        {activeSection === 'builder' || activeSection === 'home' ? (
          renderContent()
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              {renderContent()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;