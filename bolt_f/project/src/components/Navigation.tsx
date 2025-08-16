import React from 'react';
import { DivideIcon as LucideIcon, Check } from 'lucide-react';
import { Step } from '../App';

interface NavigationProps {
  steps: Array<{
    id: Step;
    label: string;
    icon: LucideIcon;
    completed: boolean;
  }>;
  currentStep: Step;
  onStepClick: (step: Step) => void;
}

const Navigation: React.FC<NavigationProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <nav className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.completed;
          const isAccessible = index === 0 || steps[index - 1].completed;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isAccessible && onStepClick(step.id as Step)}
                disabled={!isAccessible}
                className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 min-w-[120px] ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : isCompleted
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : isAccessible
                    ? 'hover:bg-slate-50 text-slate-600'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isActive
                    ? 'bg-white/20'
                    : isCompleted
                    ? 'bg-green-100'
                    : 'bg-slate-100'
                }`}>
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <Icon className={`w-6 h-6 ${
                      isActive ? 'text-white' : isAccessible ? 'text-slate-600' : 'text-slate-400'
                    }`} />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-white' : isCompleted ? 'text-green-700' : 'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </button>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-300' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;