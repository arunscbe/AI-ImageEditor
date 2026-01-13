import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import Button from './ui/Button';

const MascotPicker = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mascots, setMascots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadMascots();
    }
  }, [isOpen]);

  const loadMascots = async () => {
    try {
      setLoading(true);
      const mascotModules = import.meta.glob('/src/assets/mascot/*.svg', { 
        eager: true,
        as: 'url'
      });
      
      const mascotList = Object.entries(mascotModules).map(([path, url]) => {
        const fileName = path.split('/').pop().replace('.svg', '');
        
        return {
          id: fileName,
          name: formatMascotName(fileName),
          url: url,
          path: path
        };
      });

      setMascots(mascotList.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const formatMascotName = (fileName) => {
    // Remove underscores/hyphens and capitalize
    return fileName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/\.(svg|SVG)$/, '');
  };

  const filteredMascots = mascots.filter(mascot =>
    mascot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mascot.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMascotClick = (mascot) => {
    onSelect(mascot);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-primary" />
            <h2 className="text-base font-heading font-semibold text-gray-900">
              Choose Mascot
            </h2>
            <span className="text-xs text-gray-500 font-sans">
              {filteredMascots.length} mascots
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search mascots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent font-sans"
            />
          </div>
        </div>

        {/* Mascot Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 font-sans">Loading mascots...</p>
              </div>
            </div>
          ) : filteredMascots.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Search size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-sans">No mascots found</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredMascots.map((mascot) => (
                <button
                  key={mascot.id}
                  onClick={() => handleMascotClick(mascot)}
                  className="group relative aspect-square bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-brand-primary hover:shadow-lg transition-all duration-150 overflow-hidden p-2"
                >
                  <img
                    src={mascot.url}
                    alt={mascot.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-150"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-2">
                    <p className="text-[10px] font-semibold text-white text-center font-sans truncate">
                      {mascot.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-sans">
              💡 Tip: Click a mascot to add it to your canvas
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MascotPicker;

