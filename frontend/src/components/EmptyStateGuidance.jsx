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
      <div className="text-center max-w-2xl px-6 pointer-events-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {projectIntent?.title
              ? `Ready to: ${projectIntent.title}`
              : 'Start your production workflow'}
          </h2>
          <p className="text-lg text-gray-600">
            {projectIntent?.description ||
              'Upload a file or generate assets to begin'}
          </p>
          {projectIntent?.workflow && (
            <div className="mt-4 inline-block bg-white rounded-lg px-4 py-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Workflow Steps
              </p>
              <ol className="text-sm text-gray-700 space-y-1">
                {projectIntent.workflow.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-brand-primary hover:shadow-lg transition-all text-center group"
              >
                <div
                  className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <IconComponent className={action.iconColor} size={20} />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {action.label}
                </div>
                <div className="text-xs text-gray-500">
                  {action.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            💡 Tip: Upload customer files or use AI to generate product mockups
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateGuidance;

