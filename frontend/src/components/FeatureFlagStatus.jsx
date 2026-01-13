import React, { useState } from 'react';
import { Settings, CheckCircle, XCircle, Info } from 'lucide-react';
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const FeatureFlagStatus = () => {
  const { getAllFlags, isEnabled } = useFeatureFlagStore();
  const [showDetails, setShowDetails] = useState(false);

  const flags = getAllFlags();
  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all"
      >
        <Settings size={16} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">
          Features: {enabledCount}/{totalCount}
        </span>
      </button>

      {showDetails && (
        <div className="absolute bottom-14 left-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Feature Status</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(FEATURES).map(([key, feature]) => {
              const enabled = isEnabled(feature);
              return (
                <div
                  key={feature}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-xs font-medium text-gray-700">
                    {key.replace(/_/g, ' ')}
                  </span>
                  {enabled ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
              <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                Click the Settings icon (⚙️) in the top-right corner to manage features
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagStatus;


