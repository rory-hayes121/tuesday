import React, { useState } from 'react';
import { 
  Bot, 
  CheckCircle, 
  ArrowRight, 
  Puzzle, 
  Users, 
  Sparkles,
  Mail,
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { user, workspace } = useAuth();

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to AgentFlow',
      description: 'Let\'s get your workspace set up for success',
      component: WelcomeStep
    },
    {
      id: 'integration',
      title: 'Connect your first tool',
      description: 'Connect a service to start building powerful agents',
      component: IntegrationStep,
      optional: true
    },
    {
      id: 'team',
      title: 'Invite your team',
      description: 'Collaborate with your team members',
      component: TeamStep,
      optional: true
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Start building your first AI agent',
      component: CompleteStep
    }
  ];

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStep 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {completedSteps.includes(index) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
          <CurrentStepComponent 
            onComplete={() => handleStepComplete(currentStep)}
            onSkip={steps[currentStep].optional ? handleSkip : undefined}
            user={user!}
            workspace={workspace!}
          />
        </div>
      </div>
    </div>
  );
};

// Individual Step Components
const WelcomeStep: React.FC<{
  onComplete: () => void;
  user: any;
  workspace: any;
}> = ({ onComplete, user, workspace }) => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
      <Bot className="w-10 h-10 text-white" />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Welcome to {workspace.name}, {user.name}!
      </h2>
      <p className="text-gray-600">
        You're now the admin of your workspace. Let's set up everything you need to start building AI agents.
      </p>
    </div>
    <button
      onClick={onComplete}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
    >
      <span>Get started</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

const IntegrationStep: React.FC<{
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ onComplete, onSkip }) => {
  const integrations = [
    { name: 'Slack', icon: '💬', description: 'Team communication' },
    { name: 'Notion', icon: '📝', description: 'Documentation & notes' },
    { name: 'Gmail', icon: '📧', description: 'Email management' },
    { name: 'Salesforce', icon: '🏢', description: 'CRM & sales' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Puzzle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect your first integration</h2>
        <p className="text-gray-600">
          Choose a service to connect. You can always add more later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <button
            key={integration.name}
            onClick={onComplete}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="text-2xl mb-2">{integration.icon}</div>
            <h3 className="font-medium text-gray-900">{integration.name}</h3>
            <p className="text-sm text-gray-600">{integration.description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4">
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

const TeamStep: React.FC<{
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ onComplete, onSkip }) => {
  const [emails, setEmails] = useState(['']);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleInvite = () => {
    const validEmails = emails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length > 0) {
      // Send invitations
      console.log('Sending invitations to:', validEmails);
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invite your team</h2>
        <p className="text-gray-600">
          Add team members to collaborate on AI agents together.
        </p>
      </div>

      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
        
        <button
          onClick={addEmailField}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add another email</span>
        </button>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleInvite}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          Send invitations
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
      <Sparkles className="w-10 h-10 text-white" />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Your workspace is ready!
      </h2>
      <p className="text-gray-600">
        Everything is set up. You can now start building your first AI agent.
      </p>
    </div>
    <button
      onClick={onComplete}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
    >
      <span>Start building</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

export default OnboardingFlow;