import React from 'react';
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';
import Button from './ui/Button';

const FeatureFlagExamples = () => {
  const { isEnabled, toggleFeature, setFeature } = useFeatureFlagStore();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Feature Flag Usage Examples</h1>

      <div className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Conditional Rendering</h3>
          {isEnabled(FEATURES.AI_IMAGE_GENERATION) ? (
            <div className="text-green-600">
              ✓ AI Image Generation is enabled
            </div>
          ) : (
            <div className="text-red-600">
              ✗ AI Image Generation is disabled
            </div>
          )}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Conditional Component</h3>
          {isEnabled(FEATURES.BRUSH_TOOL) && (
            <div className="p-3 bg-blue-50 rounded">
              <p>This brush tool component only renders when the flag is enabled</p>
            </div>
          )}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Multiple Features</h3>
          <div className="space-y-2">
            {isEnabled(FEATURES.TEXT_TOOL) && (
              <Button>Add Text</Button>
            )}
            {isEnabled(FEATURES.SHAPES_TOOLS) && (
              <Button>Add Shape</Button>
            )}
            {isEnabled(FEATURES.UPLOAD_IMAGE) && (
              <Button>Upload Image</Button>
            )}
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Programmatic Control</h3>
          <div className="space-x-2">
            <Button onClick={() => toggleFeature(FEATURES.LAYERS_PANEL)}>
              Toggle Layers Panel
            </Button>
            <Button onClick={() => setFeature(FEATURES.SHARE_BUTTON, true)}>
              Enable Share
            </Button>
            <Button onClick={() => setFeature(FEATURES.SHARE_BUTTON, false)}>
              Disable Share
            </Button>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Nested Conditions</h3>
          {isEnabled(FEATURES.IMAGE_PROPERTIES) && (
            <div className="p-3 bg-purple-50 rounded">
              <p>Image properties panel is available</p>
              {isEnabled(FEATURES.REMOVE_BACKGROUND) && (
                <p className="mt-2 text-sm">
                  ↳ Background removal is also enabled
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Complex Logic</h3>
          {(() => {
            const hasAnyTool = 
              isEnabled(FEATURES.BRUSH_TOOL) ||
              isEnabled(FEATURES.TEXT_TOOL) ||
              isEnabled(FEATURES.SHAPES_TOOLS);

            const hasAllAIFeatures = 
              isEnabled(FEATURES.AI_IMAGE_GENERATION) &&
              isEnabled(FEATURES.REMOVE_BACKGROUND) &&
              isEnabled(FEATURES.VECTORIZE_IMAGE);

            return (
              <div className="space-y-2">
                <p>
                  Tools available: {hasAnyTool ? '✓ Yes' : '✗ No'}
                </p>
                <p>
                  Full AI suite: {hasAllAIFeatures ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagExamples;

