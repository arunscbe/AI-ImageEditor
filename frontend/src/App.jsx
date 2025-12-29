import React from 'react';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import CanvasArea from './components/CanvasArea';
import TextPropertiesPanel from './components/TextPropertiesPanel';
import ImagePropertiesPanel from './components/ImagePropertiesPanel';
import ShapePropertiesPanel from './components/ShapePropertiesPanel';
import AIChatPanel from './components/AIChatPanel';
import LayersPanel from './components/LayersPanel';
import useStore from './store/useStore';
// import BottomPanel from './components/BottomPanel'; // Temporarily hiding BottomPanel if not in screenshot, but user might still want it. I'll comment it out or leave it based on "I need UI like this AND [cut off]". 
// The screenshot is very clean. I will hide the bottom panel for now to match the "like this" request exactly.

function App() {
  const { selectedObject } = useStore();
  const isTextSelected = selectedObject?.type === 'i-text';
  const isImageSelected = selectedObject?.type === 'image';
  const isShapeSelected = ['rect', 'circle', 'line', 'path', 'polygon', 'polyline', 'triangle', 'group'].includes(selectedObject?.type);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f3f4f6]"> {/* Matched light gray background */}
      {/* Top Navigation */}
      <TopNav />

      {/* Main Workspace - Relative for overlaying elements */}
      <div className="flex-1 relative overflow-hidden">

        {/* Floating Sidebar - Hide when anything is selected */}
        {!isTextSelected && !isImageSelected && !isShapeSelected && <Sidebar />}

        {/* Properties Panels - Show based on object type */}
        {isTextSelected && <TextPropertiesPanel />}
        {isImageSelected && <ImagePropertiesPanel />}
        {isShapeSelected && <ShapePropertiesPanel />}

        {/* Layers Panel - Always present if layers exist */}
        <LayersPanel />

        {/* AI Chat Panel - Always visible */}
        <AIChatPanel />

        {/* Canvas - Full width behind everything */}
        <main className="absolute inset-0 z-0">
          <CanvasArea />
        </main>

        {/* We could re-enable BottomPanel here if user asks, but prioritizing screenshot match */}
      </div>
    </div>
  );
}

export default App;
