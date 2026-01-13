import React from 'react';
import { Send, Sparkles, Wand2 } from 'lucide-react';

const BottomPanel = () => {
    return (
        <div className="h-auto bg-white border-t border-gray-200 p-3 pb-4 absolute bottom-0 w-full z-30 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.04)]">
            <div className="max-w-2xl mx-auto flex flex-col gap-2">

                <div className="flex items-center gap-1.5 justify-center mb-0.5">
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium font-sans transition-colors duration-150">
                        <Sparkles size={12} />
                        Generate logo
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium font-sans transition-colors duration-150">
                        <Wand2 size={12} />
                        Create mockup
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium font-sans transition-colors duration-150">
                        Vectorize image
                    </button>
                </div>

                <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                        <Sparkles size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Describe what you want to create..."
                        className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-150 text-sm text-gray-800 placeholder-gray-400 font-sans"
                    />
                    <button className="absolute right-2 p-1.5 bg-brand-primary hover:bg-red-600 text-white rounded-lg transition-colors duration-150">
                        <Send size={16} />
                    </button>
                </div>

                <p className="text-center text-[9px] text-gray-400 font-medium font-sans">
                    AI can make mistakes. Design requires human touch.
                </p>
            </div>
        </div>
    );
};

export default BottomPanel;
