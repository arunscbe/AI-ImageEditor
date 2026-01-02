import React, { useState } from 'react';
import { X, Download, FileImage, FileType } from 'lucide-react';
import Button from './ui/Button';

const ExportDialog = ({ isOpen, onClose, onExport, objectName = 'object' }) => {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(1);
  const [scale, setScale] = useState(2);

  if (!isOpen) return null;

  const formats = [
    { value: 'png', label: 'PNG', icon: FileImage, description: 'Best for transparency' },
    { value: 'jpg', label: 'JPG', icon: FileImage, description: 'Smaller file size' },
    { value: 'svg', label: 'SVG', icon: FileType, description: 'Vector format (shapes only)', disabled: true },
    { value: 'webp', label: 'WebP', icon: FileImage, description: 'Modern web format' },
  ];

  const handleExport = () => {
    onExport({ format, quality, scale });
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Download size={18} className="text-brand-primary" />
              <h2 className="text-base font-heading font-semibold text-gray-900">Export Object</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 font-sans">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.value}
                      onClick={() => !fmt.disabled && setFormat(fmt.value)}
                      disabled={fmt.disabled}
                      className={`flex flex-col gap-1.5 p-3 rounded-lg border-2 transition-all duration-150 text-left ${
                        format === fmt.value
                          ? 'border-brand-primary bg-red-50'
                          : fmt.disabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon 
                          size={16} 
                          className={format === fmt.value ? 'text-brand-primary' : 'text-gray-500'} 
                        />
                        <span className={`text-sm font-semibold font-heading ${
                          format === fmt.value ? 'text-brand-primary' : 'text-gray-900'
                        }`}>
                          {fmt.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-sans">
                        {fmt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(format === 'jpg' || format === 'webp') && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 font-sans">
                    Quality
                  </label>
                  <span className="text-xs font-semibold text-gray-900 font-sans">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-sans">
                  <span>Lower size</span>
                  <span>Higher quality</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 font-sans">
                  Resolution Scale
                </label>
                <span className="text-xs font-semibold text-gray-900 font-sans">
                  {scale}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-primary"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-sans">
                <span>1x (Standard)</span>
                <span>4x (Ultra HD)</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-brand-primary mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-sans leading-relaxed">
                    <span className="font-semibold">File:</span> {objectName}-{new Date().toISOString().slice(0, 10)}.{format}
                  </p>
                  <p className="text-[10px] text-gray-500 font-sans mt-1">
                    Export will include only the selected object with transparent background {format !== 'jpg' ? '(PNG/WebP)' : 'with white background (JPG)'}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExport}
              className="flex-1"
            >
              Export {format.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportDialog;

