import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TopNav from '../components/TopNav';
import ToolPalette from '../components/ToolPalette';
import RightPanel from '../components/RightPanel';
import CanvasArea from '../components/CanvasArea';
import AIChatPanel from '../components/AIChatPanel';
import EmptyStateGuidance from '../components/EmptyStateGuidance';
import ProcessingOverlay from '../components/ProcessingOverlay';
import MascotPicker from '../components/MascotPicker';
import Button from '../components/ui/Button';
import useStore from '../store/useStore';
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const ProjectPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedObject, 
    setProjectIntent, 
    setSuggestedPrompts, 
    canvas,
    setExportDialogOpen,
    handleDuplicate,
    isMascotPickerOpen,
    setMascotPickerOpen,
    addMascot,
    activeTool,
    setActiveTool
  } = useStore();
  const { isEnabled } = useFeatureFlagStore();

  useEffect(() => {
    if (location.state?.intent) {
      const intent = location.state.intent;
      setProjectIntent(intent);
      
      if (intent.canvasSetup?.suggestedPrompts) {
        setSuggestedPrompts(intent.canvasSetup.suggestedPrompts);
      }
    }
  }, [location.state, setProjectIntent, setSuggestedPrompts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedObject) {
          setExportDialogOpen(true);
        } else {
          alert('Please select an object to export');
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedObject) {
          handleDuplicate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, setExportDialogOpen, handleDuplicate]);

  // Open mascot picker when activeTool is set to 'mascot'
  useEffect(() => {
    if (activeTool === 'mascot') {
      setMascotPickerOpen(true);
      setActiveTool(null); // Reset tool after opening picker
    }
  }, [activeTool, setMascotPickerOpen, setActiveTool]);

  const isTextSelected = selectedObject?.type === 'i-text';
  const isImageSelected = selectedObject?.type === 'image';
  const isShapeSelected = ['rect', 'circle', 'line', 'path', 'polygon', 'polyline', 'triangle', 'group'].includes(selectedObject?.type);
  const showImagePropertiesPanel = isImageSelected || isShapeSelected;
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

        <ToolPalette hasCanvasObjects={hasCanvasObjects} />
        <RightPanel />

        {isEnabled(FEATURES.AI_IMAGE_GENERATION) && <AIChatPanel />}

        <EmptyStateGuidance hasCanvasObjects={hasCanvasObjects} />

        <MascotPicker
          isOpen={isMascotPickerOpen}
          onClose={() => setMascotPickerOpen(false)}
          onSelect={(mascot) => addMascot(mascot)}
        />

        <main className="absolute inset-0 z-0">
          <CanvasArea projectId={uuid} />
        </main>
      </div>
    </div>
  );
};

export default ProjectPage;
