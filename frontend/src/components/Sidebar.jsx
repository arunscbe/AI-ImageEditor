import React from 'react';
import useStore from '../store/useStore';
import Button from './ui/Button';
import {
    Image as ImageIcon,
    Frame,
    Layers,
    Monitor,
    Upload,
    Palette
} from 'lucide-react';
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const Sidebar = () => {
    const { activeTool, setActiveTool, handleCanvasAction } = useStore();
    const { isEnabled } = useFeatureFlagStore();

    const allTools = [
        { icon: ImageIcon, label: 'Image', id: 'image', feature: FEATURES.AI_IMAGE_GENERATION },
        { icon: Upload, label: 'Upload Image', id: 'upload', feature: FEATURES.UPLOAD_IMAGE },
    ];

    const tools = allTools.filter(tool => isEnabled(tool.feature));

    if (tools.length === 0) {
        return null;
    }

    return (
        <div className="absolute top-3 left-6 z-10 w-[240px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 border border-gray-100/50">
            <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Create New</h3>
            <div className="grid grid-cols-2 gap-2">
                {tools.map((Tool) => (
                    <Button
                        key={Tool.id}
                        variant={activeTool === Tool.id ? 'secondary' : 'outline'}
                        className={`aspect-square flex-col gap-3 p-3 h-auto ${activeTool === Tool.id ? 'border-gray-300 ring-1 ring-gray-200' : 'bg-gray-50 border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}
                        onClick={() => {
                            if (Tool.id === 'image') {
                                handleCanvasAction('Image');
                            } else {
                                setActiveTool(Tool.id);
                            }
                        }}
                    >
                        <div className={activeTool === Tool.id ? 'text-black' : 'text-gray-500 group-hover:text-black'}>
                            <Tool.icon size={26} strokeWidth={1.5} />
                        </div>
                        <span className={`text-[11px] font-medium ${activeTool === Tool.id ? 'text-black' : 'text-gray-600 group-hover:text-black'}`}>
                            {Tool.label}
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
