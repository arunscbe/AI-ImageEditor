import React from 'react';

const MenuItem = ({ icon: Icon, label, shortcut, className = "", onClick }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-1.5 hover:bg-gray-100 rounded-lg group transition-colors duration-150 text-left">
        <div className="flex items-center gap-2 text-gray-700 group-hover:text-black">
            <Icon size={16} strokeWidth={1.5} className={className} />
            <span className="text-xs font-medium font-sans">{label}</span>
        </div>
        {shortcut && (
            <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-600 min-w-[20px] text-right font-sans">
                {shortcut}
            </span>
        )}
    </button>
);

export default MenuItem;
