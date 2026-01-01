import React, { useState } from "react";
import { ArrowUp, X, Image as ImageIcon } from "lucide-react";
import useStore from "../store/useStore";

const AIChatPanel = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { selectedObject, canvas, addAIImage, suggestedPrompts, setProcessing } = useStore();
  const isImageSelected = selectedObject?.type === "image";
  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    console.log("AI Prompt:", prompt);
    setIsLoading(true);
    setProcessing(true, "Generating AI image...");

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Recraft Response:", data);

      const imageUrl =
        data?.data?.[0]?.url ||
        data?.data?.url ||
        data?.url ||
        data?.image_url ||
        data?.result?.url;

      console.log("Image URL:", imageUrl);
      console.log("Full response data:", JSON.stringify(data, null, 2));

      if (imageUrl) {
        await addAIImage(imageUrl);
        setPrompt(""); // Clear input only on success
      } else {
        console.error("No image URL found in response:", data);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert(`Error generating image: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-48px)] max-w-4xl">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200 p-4">
        {/* Suggested Prompts */}
        {suggestedPrompts.length > 0 && !prompt && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Suggested Prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((suggested, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggested)}
                  className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-brand-primary hover:text-white border border-gray-200 hover:border-brand-primary rounded-full transition-all"
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Image Indicator */}
        {isImageSelected && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="relative group">
              {/* Image Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-brand-primary shadow-sm">
                <img
                  src={selectedObject.getSrc()}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Remove Button - Overlay on hover */}
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

        {/* Input Area */}
        <div className="flex items-end gap-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to generate"
              className="w-full resize-none bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-base font-normal min-h-[24px] max-h-[120px] py-1"
              rows={1}
              style={{
                height: "auto",
                overflowY: prompt.split("\n").length > 4 ? "auto" : "hidden",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-1">
            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className={`p-2.5 rounded-lg transition-all ${
                prompt.trim() && !isLoading
                  ? "bg-brand-primary text-white hover:bg-brand-accent shadow-md hover:shadow-lg"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
