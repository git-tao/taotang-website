// Main wizard component
export { default as IntakeWizard } from './IntakeWizard';

// Types
export * from './types';

// Utilities
export * from './utils/emailValidation';
export * from './utils/gateLogic';

// Individual components (if needed for customization)
export { default as ProgressIndicator } from './components/ProgressIndicator';
export { default as BasicInfoStep } from './components/BasicInfoStep';
export { default as ProjectDetailsStep } from './components/ProjectDetailsStep';
export { default as QualificationStep } from './components/QualificationStep';
export { default as OutcomeScreen } from './components/OutcomeScreen';

// AI Clarification components
export { default as ClarificationFlow } from './components/ClarificationFlow';
export { default as QuestionCard } from './components/QuestionCard';
export { default as ProgressDots } from './components/ProgressDots';
