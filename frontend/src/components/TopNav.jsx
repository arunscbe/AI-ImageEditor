import React, { useState } from "react";
import useStore from "../store/useStore";
import Button from "./ui/Button";
import Logo from "./Logo";
import {
  ChevronDown,
  Sparkles,
  User,
  Filter,
  Image as ImageIcon,
  Frame,
  Shirt,
  Layers,
  Upload,
  Type,
  MessageSquare,
  Brush,
  Square,
  Circle,
  Slash,
  MoveUpRight,
  Crop,
  Eraser,
  Share2,
  Wand2,
  Settings,
  Download,
} from "lucide-react";

import MenuItem from "./ui/MenuItem";
import FeatureFlagsPanel from "./FeatureFlagsPanel";
import ExportDialog from "./ExportDialog";
import useFeatureFlagStore from "../features/useFeatureFlag";
import { FEATURES } from "../features/featureFlags";

const TopNav = () => {
  const {
    isInsertOpen,
    toggleInsertMenu,
    closeInsertMenu,
    handleCanvasAction,
    selectedObject,
    forRemovingBG,
    vectorizeAPI,
    upscaleImage,
    handleExport,
    isExportDialogOpen,
    setExportDialogOpen,
  } = useStore();

  const { isEnabled } = useFeatureFlagStore();
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);

  const isImageSelected = selectedObject?.type === "image";
  const hasSelection = selectedObject !== null;

  const handleExportClick = () => {
    if (!hasSelection) {
      alert('Please select an object to export');
      return;
    }
    setExportDialogOpen(true);
  };

  return (
    <header className="h-14 bg-white flex items-center justify-between px-4 z-20 relative border-b border-gray-200">
      <div className="flex items-center gap-4">
        <Logo height={28} />

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 font-sans font-medium ${
                isInsertOpen ? "bg-gray-100 text-brand-dark" : ""
              }`}
              onClick={toggleInsertMenu}
              endIcon={ChevronDown}
            >
              Insert
            </Button>

            {isInsertOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                <div className="px-2.5 py-1.5">
                  <h3 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider font-sans">
                    Generation
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    {isEnabled(FEATURES.AI_IMAGE_GENERATION) && (
                      <MenuItem
                        icon={ImageIcon}
                        label="Create new image"
                        shortcut="I"
                        onClick={() => handleCanvasAction("Image")}
                      />
                    )}
                    {isEnabled(FEATURES.UPLOAD_IMAGE) && (
                      <MenuItem
                        icon={Upload}
                        label="Upload image..."
                        onClick={() => handleCanvasAction("UPLOAD_IMAGE")}
                      />
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-200 mx-2.5 my-1" />

                <div className="px-2.5 py-1.5">
                  <h3 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider font-sans">
                    Other tools
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    {isEnabled(FEATURES.TEXT_TOOL) && (
                      <MenuItem
                        icon={Type}
                        label="Text"
                        shortcut="T"
                        onClick={() => handleCanvasAction("ADD_TEXT")}
                      />
                    )}
                    {isEnabled(FEATURES.BRUSH_TOOL) && (
                      <>
                        <MenuItem
                          icon={Brush}
                          label="Brush"
                          shortcut="B"
                          onClick={() => handleCanvasAction("TOGGLE_BRUSH")}
                        />
                        <MenuItem
                          icon={Eraser}
                          label="Eraser"
                          shortcut="E"
                          onClick={() => handleCanvasAction("TOGGLE_ERASER")}
                        />
                      </>
                    )}
                    {isEnabled(FEATURES.SHAPES_TOOLS) && (
                      <>
                        <MenuItem
                          icon={Square}
                          label="Rectangle"
                          shortcut="R"
                          onClick={() => handleCanvasAction("ADD_RECTANGLE")}
                        />
                        <MenuItem
                          icon={Circle}
                          label="Circle"
                          shortcut="O"
                          onClick={() => handleCanvasAction("ADD_CIRCLE")}
                        />
                        <MenuItem
                          icon={Slash}
                          label="Line"
                          shortcut="L"
                          className="rotate-90"
                          onClick={() => handleCanvasAction("ADD_LINE")}
                        />
                        <MenuItem
                          icon={MoveUpRight}
                          label="Arrow"
                          shortcut="⇧ L"
                          onClick={() => handleCanvasAction("ADD_ARROW")}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isEnabled(FEATURES.TEMPLATES_MENU) && (
            <Button
              variant="ghost"
              size="sm"
              endIcon={ChevronDown}
              className="gap-1"
            >
              Templates
            </Button>
          )}

          {isEnabled(FEATURES.FILTERS_MENU) && (
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Filter size={16} />{" "}
              <ChevronDown size={12} className="text-gray-400 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {isImageSelected ? (
          <div className="flex items-center gap-0.5">
            {isEnabled(FEATURES.REMOVE_BACKGROUND) && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-0.5 h-auto py-1 px-2.5 text-gray-600 hover:text-gray-900"
                onClick={() => forRemovingBG()}
              >
                <Eraser size={16} />
                <span className="text-[9px] font-medium text-gray-400 font-sans">
                  Remove bg
                </span>
              </Button>
            )}
            {isEnabled(FEATURES.VECTORIZE_IMAGE) && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-0.5 h-auto py-1 px-2.5 text-gray-600 hover:text-gray-900"
                onClick={() => vectorizeAPI()}
              >
                <Share2 size={16} />
                <span className="text-[9px] font-medium text-gray-400 font-sans">
                  Vectorize
                </span>
              </Button>
            )}
            {isEnabled(FEATURES.CRISP_UPSCALE) && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-0.5 h-auto py-1 px-2.5 text-gray-600 hover:text-gray-900"
                onClick={() => upscaleImage()}
              >
                <Wand2 size={16} />
                <span className="text-[9px] font-medium text-gray-400 font-sans">
                  Crisp upscale
                </span>
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 hover:text-gray-900 font-semibold gap-1.5 font-heading"
            endIcon={ChevronDown}
          >
            Untitled
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasSelection && (
          <Button 
            variant="outline" 
            size="sm" 
            icon={Download}
            className="font-sans font-semibold"
            onClick={handleExportClick}
          >
            Export
          </Button>
        )}

        {isEnabled(FEATURES.SHARE_BUTTON) && (
          <Button variant="primary" size="sm" className="font-sans font-semibold">
            Share
          </Button>
        )}

        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowFeatureFlags(true)}
          className="rounded-lg text-gray-500 hover:text-gray-700"
          title="Feature Flags"
        >
          <Settings size={16} />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-lg text-gray-500 hover:text-gray-700"
        >
          <User size={16} />
        </Button>
      </div>

      {isInsertOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={closeInsertMenu}
        />
      )}

      {showFeatureFlags && (
        <FeatureFlagsPanel onClose={() => setShowFeatureFlags(false)} />
      )}

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        objectName={selectedObject?.name || selectedObject?.type || 'object'}
      />
    </header>
  );
};

export default TopNav;
