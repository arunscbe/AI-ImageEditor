import React from "react";
import useStore from "../store/useStore";
import Button from "./ui/Button";
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
} from "lucide-react";

import MenuItem from "./ui/MenuItem";

const TopNav = () => {
  const {
    isInsertOpen,
    toggleInsertMenu,
    closeInsertMenu,
    handleCanvasAction,
    selectedObject,
    forRemovingBG,
    vectorizeAPI,
  } = useStore();

  // Check if an image is selected
  const isImageSelected = selectedObject?.type === "image";

  return (
    <header className="h-14 bg-[#fcfcfe] flex items-center justify-between px-4 z-20 relative border-b border-gray-200">
      {/* Left: Logo & Menus */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1 cursor-pointer">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl italic font-serif">
            R
          </div>
          <ChevronDown size={14} className="text-gray-500" />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${
                isInsertOpen ? "bg-gray-100 text-black" : ""
              }`}
              onClick={toggleInsertMenu}
              endIcon={ChevronDown}
            >
              Insert
            </Button>

            {/* Dropdown Menu */}
            {isInsertOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                {/* Generation Section */}
                <div className="px-3 py-2">
                  <h3 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    Generation
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    <MenuItem
                      icon={ImageIcon}
                      label="Create new image"
                      shortcut="I"
                      onClick={() => handleCanvasAction("Image")}
                    />
                    {/* <MenuItem icon={Frame} label="Frame" shortcut="F" />
                                        <MenuItem icon={Shirt} label="Mockup" shortcut="M" />
                                        <MenuItem icon={Layers} label="Image set" shortcut="S" /> */}
                    <MenuItem
                      icon={Upload}
                      label="Upload image..."
                      onClick={() => handleCanvasAction("UPLOAD_IMAGE")}
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100 mx-3 my-1" />

                {/* Other Tools Section */}
                <div className="px-3 py-2">
                  <h3 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    Other tools
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    <MenuItem
                      icon={Type}
                      label="Text"
                      shortcut="T"
                      onClick={() => handleCanvasAction("ADD_TEXT")}
                    />
                    <MenuItem
                      icon={Brush}
                      label="Brush"
                      shortcut="B"
                      onClick={() => handleCanvasAction("TOGGLE_BRUSH")}
                    />
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
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            endIcon={ChevronDown}
            className="gap-1.5"
          >
            Templates
          </Button>

          <Button variant="ghost" size="sm" className="text-gray-500">
            <Filter size={16} />{" "}
            <ChevronDown size={12} className="text-gray-400 ml-1" />
          </Button>
        </div>
      </div>

      {/* Center: Image Editing Actions OR Project Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {isImageSelected ? (
          // Image Editing Actions when image selected
          <div className="flex items-center gap-1">
            {/* <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-0.5 h-auto py-1.5 px-3 text-gray-600 hover:text-gray-900"
              onClick={() => console.log("Edit Area")}
            >
              <Crop size={18} />
              <span className="text-[10px] font-medium text-gray-400">
                Edit area
              </span>
            </Button> */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-0.5 h-auto py-1.5 px-3 text-gray-600 hover:text-gray-900"
              onClick={() => forRemovingBG()}
            >
              <Eraser size={18} />
              <span className="text-[10px] font-medium text-gray-400">
                Remove bg
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-0.5 h-auto py-1.5 px-3 text-gray-600 hover:text-gray-900"
              onClick={() => vectorizeAPI()}
            >
              <Share2 size={18} />
              <span className="text-[10px] font-medium text-gray-400">
                Vectorize
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-0.5 h-auto py-1.5 px-3 text-gray-600 hover:text-gray-900"
              onClick={() => console.log("Crisp Upscale")}
            >
              <Wand2 size={18} />
              <span className="text-[10px] font-medium text-gray-400">
                Crisp upscale
              </span>
            </Button>
          </div>
        ) : (
          // Project Title when no image selected
          <Button
            variant="secondary"
            size="sm"
            className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 hover:text-gray-900 font-semibold gap-2"
            endIcon={ChevronDown}
          >
            Untitled
          </Button>
        )}
      </div>

      {/* Right: Credits & Actions */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" className="font-semibold">
          Share
        </Button>

        {/* Split Pill Button Group */}
        {/* <div className="flex items-center p-0.5 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-1.5 px-3 py-1 text-purple-600">
                        <Sparkles size={12} fill="currentColor" className="text-purple-500" />
                        <span className="text-xs font-bold">50</span>
                    </div>
                    <Button variant="purple" size="sm" className="rounded-md shadow-sm shadow-purple-200 font-semibold py-1">
                        Upgrade
                    </Button>
                </div> */}

        <Button
          variant="secondary"
          size="icon"
          className="rounded-lg text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200"
        >
          <User size={18} />
        </Button>
      </div>

      {/* Close dropdown overlay */}
      {isInsertOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={closeInsertMenu}
        />
      )}
    </header>
  );
};

export default TopNav;
