import React from 'react';
import { Send, Sparkles, Wand2 } from 'lucide-react';

const BottomPanel = () => {
    return (
        <div className="h-auto bg-white border-t border-gray-200 p-4 pb-6 absolute bottom-0 w-full z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-3xl mx-auto flex flex-col gap-3">

                {/* Quick Chips */}
                <div className="flex items-center gap-2 justify-center mb-1">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-xs font-medium transition-colors border border-purple-100">
                        <Sparkles size={12} />
                        Generate logo
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-medium transition-colors border border-blue-100">
                        <Wand2 size={12} />
                        Create mockup
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full text-xs font-medium transition-colors border border-gray-200">
                        Vectorize image
                    </button>
                </div>

                {/* Input Area */}
                <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400">
                        <Sparkles size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Describe what you want to create..."
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-gray-800 placeholder-gray-400 transition-all font-medium"
                    />
                    <button className="absolute right-3 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                        <Send size={18} />
                    </button>
                </div>

                <p className="text-center text-[10px] text-gray-400 font-medium">
                    AI can make mistakes. Design requires human touch.
                </p>
            </div>
        </div>
    );
};

export default BottomPanel;
