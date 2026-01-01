import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TopNav from '../components/TopNav';
import Sidebar from '../components/Sidebar';
import CanvasArea from '../components/CanvasArea';
import TextPropertiesPanel from '../components/TextPropertiesPanel';
import ImagePropertiesPanel from '../components/ImagePropertiesPanel';
import ShapePropertiesPanel from '../components/ShapePropertiesPanel';
import AIChatPanel from '../components/AIChatPanel';
import LayersPanel from '../components/LayersPanel';
import EmptyStateGuidance from '../components/EmptyStateGuidance';
import ProcessingOverlay from '../components/ProcessingOverlay';
import Button from '../components/ui/Button';
import useStore from '../store/useStore';
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const ProjectPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedObject, setProjectIntent, setSuggestedPrompts, canvas } = useStore();
  const { isEnabled } = useFeatureFlagStore();

  console.log('ProjectPage loaded');
  console.log('UUID:', uuid);
  console.log('Location state:', location.state);

  useEffect(() => {
    console.log('ProjectPage useEffect triggered');
    console.log('Location state in effect:', location.state);
    
    if (location.state?.intent) {
      const intent = location.state.intent;
      console.log('Setting intent:', intent);
      setProjectIntent(intent);
      
      if (intent.canvasSetup?.suggestedPrompts) {
        console.log('Setting prompts:', intent.canvasSetup.suggestedPrompts);
        setSuggestedPrompts(intent.canvasSetup.suggestedPrompts);
      }
    } else {
      console.log('No intent in location state');
    }
  }, [location.state, setProjectIntent, setSuggestedPrompts]);

  const isTextSelected = selectedObject?.type === 'i-text';
  const isImageSelected = selectedObject?.type === 'image';
  const isShapeSelected = ['rect', 'circle', 'line', 'path', 'polygon', 'polyline', 'triangle', 'group'].includes(selectedObject?.type);

  const hasCanvasObjects = canvas?.getObjects().length > 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TopNav />

      <ProcessingOverlay />

      <div className="flex-1 relative overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/projects')}
          className="absolute top-4 left-4 z-20 bg-white shadow-md hover:shadow-lg"
        >
          Back to Projects
        </Button>

        {!isTextSelected && !isImageSelected && !isShapeSelected && <Sidebar />}

        {isTextSelected && isEnabled(FEATURES.TEXT_PROPERTIES) && <TextPropertiesPanel />}
        {isImageSelected && isEnabled(FEATURES.IMAGE_PROPERTIES) && <ImagePropertiesPanel />}
        {isShapeSelected && isEnabled(FEATURES.SHAPE_PROPERTIES) && <ShapePropertiesPanel />}

        {isEnabled(FEATURES.LAYERS_PANEL) && <LayersPanel />}

        {isEnabled(FEATURES.AI_IMAGE_GENERATION) && <AIChatPanel />}

        {!hasCanvasObjects && <EmptyStateGuidance />}

        <main className="absolute inset-0 z-0">
          <CanvasArea projectId={uuid} />
        </main>
      </div>
    </div>
  );
};

export default ProjectPage;
