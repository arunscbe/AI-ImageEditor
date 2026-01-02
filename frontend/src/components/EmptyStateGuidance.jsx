import React from 'react';
import { Sparkles, Upload, Type, Square } from 'lucide-react';
import useStore from '../store/useStore';

const EmptyStateGuidance = () => {
  const { projectIntent, addText, addRectangle, handleCanvasAction } = useStore();

  const quickActions = [
    {
      icon: Upload,
      label: 'Upload Logo',
      description: 'Start with customer file',
      color: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => handleCanvasAction('UPLOAD_IMAGE'),
    },
    {
      icon: Sparkles,
      label: 'Generate Mockup',
      description: 'AI product photography',
      color: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: Square,
      label: 'Add Product',
      description: 'Select from catalog',
      color: 'from-green-50 to-green-100',
      iconColor: 'text-green-600',
      onClick: () => addRectangle(),
    },
    {
      icon: Type,
      label: 'Add Text',
      description: 'Product information',
      color: 'from-orange-50 to-orange-100',
      iconColor: 'text-orange-600',
      onClick: () => addText(),
    },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center max-w-2xl px-4 pointer-events-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            {projectIntent?.title
              ? `Ready to: ${projectIntent.title}`
              : 'Start your production workflow'}
          </h2>
          <p className="text-base text-gray-600 font-sans">
            {projectIntent?.description ||
              'Upload a file or generate assets to begin'}
          </p>
          {projectIntent?.workflow && (
            <div className="mt-3 inline-block bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 font-sans">
                Workflow Steps
              </p>
              <ol className="text-xs text-gray-700 space-y-0.5 font-sans text-left">
                {projectIntent.workflow.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-brand-primary font-semibold">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="bg-white rounded-lg p-3 border-2 border-gray-200 hover:border-brand-primary hover:shadow-lg transition-all duration-150 text-center group"
              >
                <div
                  className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <IconComponent className={action.iconColor} size={18} />
                </div>
                <div className="text-xs font-semibold text-gray-900 mb-0.5 font-heading">
                  {action.label}
                </div>
                <div className="text-xs text-gray-500 font-sans">
                  {action.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-500 font-sans">
          <p>
            💡 Tip: Upload customer files or use AI to generate product mockups
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateGuidance;

