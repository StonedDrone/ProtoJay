
import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    onCommit?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const Slider: React.FC<SliderProps> = ({ label, value, onChange, onCommit, min = 0, max = 100, step = 1 }) => {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium text-gray-400">{label}</label>
                <span className="text-xs font-mono bg-gray-700 px-1.5 py-0.5 rounded">{value.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                onMouseUp={() => onCommit?.(value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>
    );
};

export default Slider;