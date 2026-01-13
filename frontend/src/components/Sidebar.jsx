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
        <div className="absolute top-3 left-4 z-10 w-[200px] bg-white rounded-lg shadow-md p-3 border border-gray-200">
            <h3 className="text-[10px] font-bold text-gray-400 mb-2 tracking-widest uppercase font-sans">Create New</h3>
            <div className="grid grid-cols-2 gap-2">
                {tools.map((Tool) => (
                    <Button
                        key={Tool.id}
                        variant={activeTool === Tool.id ? 'secondary' : 'outline'}
                        className={`aspect-square flex-col gap-2 p-2.5 h-auto rounded-lg ${activeTool === Tool.id ? 'border-gray-300 bg-gray-50' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => {
                            if (Tool.id === 'image') {
                                handleCanvasAction('Image');
                            } else {
                                setActiveTool(Tool.id);
                            }
                        }}
                    >
                        <div className={activeTool === Tool.id ? 'text-brand-primary' : 'text-gray-500 group-hover:text-brand-primary'}>
                            <Tool.icon size={22} strokeWidth={1.5} />
                        </div>
                        <span className={`text-[10px] font-medium font-sans ${activeTool === Tool.id ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                            {Tool.label}
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
