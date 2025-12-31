import React, { useState } from 'react';
import { X, RotateCcw, Search, ChevronDown } from 'lucide-react';
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES, FEATURE_DESCRIPTIONS } from '../features/featureFlags';
import Button from './ui/Button';

const FeatureFlagsPanel = ({ onClose }) => {
  const { flags, toggleFeature, resetAllFlags } = useFeatureFlagStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    ai: true,
    tools: true,
    panels: true,
    ui: true,
  });

  const categories = {
    ai: {
      label: 'AI Features',
      features: [
        FEATURES.AI_IMAGE_GENERATION,
        FEATURES.REMOVE_BACKGROUND,
        FEATURES.VECTORIZE_IMAGE,
        FEATURES.CRISP_UPSCALE,
      ],
    },
    tools: {
      label: 'Tools',
      features: [
        FEATURES.BRUSH_TOOL,
        FEATURES.TEXT_TOOL,
        FEATURES.SHAPES_TOOLS,
        FEATURES.UPLOAD_IMAGE,
      ],
    },
    panels: {
      label: 'Panels',
      features: [
        FEATURES.LAYERS_PANEL,
        FEATURES.IMAGE_PROPERTIES,
        FEATURES.TEXT_PROPERTIES,
        FEATURES.SHAPE_PROPERTIES,
      ],
    },
    ui: {
      label: 'UI Elements',
      features: [
        FEATURES.TEMPLATES_MENU,
        FEATURES.FILTERS_MENU,
        FEATURES.SHARE_BUTTON,
      ],
    },
  };

  const formatFeatureName = (feature) => {
    return feature
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredCategories = Object.entries(categories).reduce(
    (acc, [key, category]) => {
      const filteredFeatures = category.features.filter((feature) => {
        const name = formatFeatureName(feature).toLowerCase();
        const description = FEATURE_DESCRIPTIONS[feature].toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || description.includes(search);
      });

      if (filteredFeatures.length > 0) {
        acc[key] = { ...category, features: filteredFeatures };
      }
      return acc;
    },
    {}
  );

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[65vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold font-heading text-gray-900">
              Feature Flags
            </h2>
            <span className="text-xs text-brand-primary font-semibold bg-red-50 px-2 py-0.5 rounded-full">
              {enabledCount}/{totalCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search features..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm bg-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFlags}
              className="gap-1.5 whitespace-nowrap"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {Object.entries(filteredCategories).map(([key, category]) => (
              <div
                key={key}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {category.label}
                  </h3>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      expandedCategories[key] ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedCategories[key] && (
                  <div className="p-3 space-y-2 bg-white">
                    {category.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {formatFeatureName(feature)}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {FEATURE_DESCRIPTIONS[feature]}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFeature(feature)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                            flags[feature]
                              ? 'bg-brand-primary'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              flags[feature]
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {Object.keys(filteredCategories).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  No features found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Auto-saved • Persists across sessions
            </p>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagsPanel;

