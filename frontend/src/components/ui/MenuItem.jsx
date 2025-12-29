import React from 'react';

const MenuItem = ({ icon: Icon, label, shortcut, className = "", onClick }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-lg group transition-colors text-left">
        <div className="flex items-center gap-3 text-gray-700 group-hover:text-black">
            <Icon size={18} strokeWidth={1.5} className={className} />
            <span className="text-[12px] font-medium">{label}</span>
        </div>
        {shortcut && (
            <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-600 min-w-[20px] text-right">
                {shortcut}
            </span>
        )}
    </button>
);

export default MenuItem;
