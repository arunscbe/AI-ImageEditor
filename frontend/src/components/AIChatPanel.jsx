import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, X, ChevronDown, Zap, Sparkles, Layers } from "lucide-react";
import useStore from "../store/useStore";
import { getApiUrl } from "../config/api";

const STYLE_PRESETS = {
  embroidery: {
    name: "Embroidery",
    description: "Stitched thread texture",
    color: "bg-purple-500",
    icon: "🧵"
  },
  leather: {
    name: "Leather",
    description: "Debossed/embossed grain",
    color: "bg-amber-700",
    icon: "◉"
  },
  screen_print: {
    name: "Screen Print",
    description: "Flat colors, high contrast",
    color: "bg-pink-400",
    icon: "✦"
  },
  woven: {
    name: "Woven",
    description: "Interlaced thread pattern",
    color: "bg-blue-500",
    icon: "◆"
  },
  sublimation: {
    name: "Sublimation",
    description: "Full color print",
    color: "bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400",
    icon: "🌈"
  },
  pvc: {
    name: "PVC/Rubber",
    description: "3D raised texture",
    color: "bg-blue-600",
    icon: "◇"
  }
};

const PROVIDERS = {
  gemini: {
    name: "Gemini",
    description: "Google AI Studio quality",
    color: "bg-gradient-to-br from-orange-400 to-yellow-400",
    textColor: "text-orange-600",
    icon: Sparkles
  },
  recraft: {
    name: "Recraft",
    description: "Fast generation",
    color: "bg-gradient-to-br from-orange-500 to-red-500",
    textColor: "text-orange-600",
    icon: Zap
  },
  openai: {
    name: "OpenAI",
    description: "DALL-E 3",
    color: "bg-gradient-to-br from-emerald-400 to-teal-500",
    textColor: "text-emerald-600",
    icon: Layers
  }
};

const LEATHER_COLORS = [
  { value: "", label: "Auto (from prompt)" },
  { value: "tan", label: "Tan" },
  { value: "cognac brown", label: "Cognac Brown" },
  { value: "dark brown", label: "Dark Brown" },
  { value: "black", label: "Black" },
  { value: "saddle brown", label: "Saddle Brown" },
  { value: "burgundy", label: "Burgundy" },
  { value: "natural beige", label: "Natural Beige" }
];

const INK_COLORS = [
  { value: "", label: "Auto (from prompt)" },
  { value: "black debossed", label: "Black Debossed" },
  { value: "gold embossed", label: "Gold Embossed" },
  { value: "silver embossed", label: "Silver Embossed" },
  { value: "white", label: "White" },
  { value: "copper embossed", label: "Copper Embossed" },
  { value: "blind debossed", label: "Blind Debossed (no ink)" }
];

const FONT_STYLES = [
  { value: "", label: "Auto (from prompt)" },
  { value: "serif classic", label: "Serif Classic" },
  { value: "sans-serif modern", label: "Sans-Serif Modern" },
  { value: "bold uppercase", label: "Bold Uppercase" },
  { value: "script elegant", label: "Script Elegant" },
  { value: "vintage retro", label: "Vintage Retro" },
  { value: "stencil military", label: "Stencil Military" },
  { value: "gothic blackletter", label: "Gothic Blackletter" },
  { value: "handwritten casual", label: "Handwritten Casual" }
];

const AIChatPanel = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedStyle, setSelectedStyle] = useState("embroidery");
  const [versioningEnabled, setVersioningEnabled] = useState(true);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [leatherColor, setLeatherColor] = useState("");
  const [inkColor, setInkColor] = useState("");
  const [fontStyle, setFontStyle] = useState("");
  const styleMenuRef = useRef(null);
  const providerMenuRef = useRef(null);
  const textareaRef = useRef(null);
  const { selectedObject, canvas, addAIImage } = useStore();
  const isImageSelected = selectedObject && selectedObject.type === 'image' && typeof selectedObject.getSrc === 'function';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target)) {
        setShowStyleMenu(false);
      }
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target)) {
        setShowProviderMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setConversationId(`user-${Date.now()}`);
  }, []);

  const clearHistory = async () => {
    try {
      await fetch(getApiUrl(`/conversation/${conversationId}`), {
        method: "DELETE",
      });
      setConversationId(`user-${Date.now()}`);
    } catch (error) {
      // Error clearing history
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let messageToSend = prompt;
      
      if (isImageSelected) {
        let imageUrl = null;
        
        if (selectedObject.type === 'image' && selectedObject.getSrc && selectedObject.getSrc().startsWith('http')) {
          imageUrl = selectedObject.getSrc();
        } else {
          const dataURL = selectedObject.toDataURL({
            format: "png",
            quality: 1,
          });
          
          const blob = await (await fetch(dataURL)).blob();
          const formData = new FormData();
          formData.append("image", blob, "canvas-image.png");
          
          const uploadResponse = await fetch(getApiUrl("/upload-canvas-image"), {
            method: "POST",
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload canvas image");
          }
          
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        }
        
        messageToSend = `${prompt} [Image URL: ${imageUrl}] [Provider: ${selectedProvider}] [Style: ${selectedStyle}]`;
        
        if (selectedStyle === "leather" && (leatherColor || inkColor)) {
          if (leatherColor) messageToSend += ` [LeatherColor: ${leatherColor}]`;
          if (inkColor) messageToSend += ` [InkColor: ${inkColor}]`;
        }
        
        if (fontStyle) {
          messageToSend += ` [Font: ${fontStyle}]`;
        }
      } else {
        messageToSend = `${prompt} [Provider: ${selectedProvider}] [Style: ${selectedStyle}]`;
        
        if (selectedStyle === "leather" && (leatherColor || inkColor)) {
          if (leatherColor) messageToSend += ` [LeatherColor: ${leatherColor}]`;
          if (inkColor) messageToSend += ` [InkColor: ${inkColor}]`;
        }
        
        if (fontStyle) {
          messageToSend += ` [Font: ${fontStyle}]`;
        }
      }

      const response = await fetch(getApiUrl("/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();

      if (data.images && data.images.length > 0) {
        if (!versioningEnabled && isImageSelected) {
          for (const imageUrl of data.images) {
            if (imageUrl && selectedObject) {
              const currentLeft = selectedObject.left;
              const currentTop = selectedObject.top;
              const currentScaleX = selectedObject.scaleX;
              const currentScaleY = selectedObject.scaleY;

              selectedObject.setSrc(imageUrl, () => {
                selectedObject.set({
                  left: currentLeft,
                  top: currentTop,
                  scaleX: currentScaleX,
                  scaleY: currentScaleY,
                });
                canvas.renderAll();
              });
            }
          }
        } else {
          for (const imageUrl of data.images) {
            if (imageUrl) {
              await addAIImage(imageUrl);
            }
          }
        }
      }
      
      setPrompt("");
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter allows new lines in textarea
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-48px)] max-w-4xl">
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-200 p-3">

        {isImageSelected && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="relative group">
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-indigo-200 shadow-sm">
                <img
                  src={selectedObject.getSrc()}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => {
                  if (canvas) {
                    canvas.discardActiveObject();
                    canvas.renderAll();
                  }
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg transition-all hover:bg-red-600 hover:scale-110"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-2 w-full">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  // Auto-resize textarea
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create..."
                rows={1}
                className="w-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-[15px] font-normal leading-6 py-2 px-3 resize-none overflow-hidden break-words whitespace-pre-wrap"
                style={{
                  minHeight: 'auto',
                  maxHeight: '120px',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className={`p-2 rounded-full transition-all flex-shrink-0 ${
                prompt.trim() && !isLoading
                  ? "bg-gray-800 text-white hover:bg-gray-900"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <ArrowUp size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="relative" ref={styleMenuRef}>
                <button
                  onClick={() => setShowStyleMenu(!showStyleMenu)}
                  className="pl-2 pr-2.5 py-1.5 bg-transparent hover:bg-gray-50 rounded-full transition-all flex items-center gap-2 text-sm font-normal text-gray-700 border-0 whitespace-nowrap"
                >
                  <div className={`w-6 h-6 rounded-full ${STYLE_PRESETS[selectedStyle].color} flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
                    {STYLE_PRESETS[selectedStyle].icon}
                  </div>
                  <span>{STYLE_PRESETS[selectedStyle].name}</span>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform ${showStyleMenu ? "rotate-180" : ""}`} />
                </button>

                {showStyleMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 py-1 z-50">
                    {Object.entries(STYLE_PRESETS).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedStyle(key);
                          setShowStyleMenu(false);
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                          selectedStyle === key ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${style.color} flex items-center justify-center text-white font-semibold shadow-sm flex-shrink-0`}>
                          {style.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-normal text-gray-900 text-sm">{style.name}</div>
                          <div className="text-xs text-gray-500">{style.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedStyle === "leather" && (
                <>
                  <select
                    value={leatherColor}
                    onChange={(e) => setLeatherColor(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700"
                  >
                    {LEATHER_COLORS.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={inkColor}
                    onChange={(e) => setInkColor(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700"
                  >
                    {INK_COLORS.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700"
              >
                {FONT_STYLES.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Commented out - cosmetic cleanup */}
            {/* <label className="flex items-center gap-1.5 px-2 py-1.5 bg-transparent hover:bg-gray-50 rounded-full cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={versioningEnabled}
                onChange={(e) => setVersioningEnabled(e.target.checked)}
                className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:ring-offset-0"
              />
              <span className="text-sm font-normal text-gray-700">New</span>
            </label> */}

            {/* <div className="relative" ref={providerMenuRef}>
              <button
                onClick={() => setShowProviderMenu(!showProviderMenu)}
                className="pl-2 pr-2.5 py-1.5 bg-transparent hover:bg-gray-50 rounded-full transition-all flex items-center gap-2 text-sm font-normal text-gray-700 border-0 whitespace-nowrap"
              >
                <div className={`w-6 h-6 rounded-full ${PROVIDERS[selectedProvider].color} flex items-center justify-center text-white shadow-sm`}>
                  {React.createElement(PROVIDERS[selectedProvider].icon, { size: 14, strokeWidth: 2.5 })}
                </div>
                <span>{PROVIDERS[selectedProvider].name}</span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${showProviderMenu ? "rotate-180" : ""}`} />
              </button>

              {showProviderMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 py-1 z-50">
                  {Object.entries(PROVIDERS).map(([key, provider]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedProvider(key);
                        setShowProviderMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                        selectedProvider === key ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${provider.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        {React.createElement(provider.icon, { size: 16, strokeWidth: 2.5 })}
                      </div>
                      <div className="flex-1">
                        <div className="font-normal text-gray-900 text-sm">{provider.name}</div>
                        <div className="text-xs text-gray-500">{provider.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
