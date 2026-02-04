"use client";

import React, { useState } from 'react';
import { PaletteIcon, SparklesIcon, LightbulbIcon, MagicWandIcon, LoaderIcon } from './icons';

interface PersonalizationPanelProps {
    onApply: (style: string, material: string, color: string) => void;
    onAiInsight: (type: string) => void;
    isProcessing: boolean;
}

const styles = ["Minimalist", "Industrial", "Organic", "Cyberpunk", "Vintage", "Futuristic", "Brutalist"];
const materials = ["Aluminum", "Carbon Fiber", "Wood", "Plastic", "Glass", "Concrete", "Titanium", "Leather"];
const colors = [
    { name: "Matte Black", value: "#1a1a1a" },
    { name: "Silver", value: "#c0c0c0" },
    { name: "White", value: "#ffffff" },
    { name: "Navy Blue", value: "#0f172a" },
    { name: "Racing Red", value: "#ef4444" },
    { name: "Forest Green", value: "#15803d" },
    { name: "Gold", value: "#eab308" },
    { name: "Neon Blue", value: "#06b6d4" },
];

export const PersonalizationPanel: React.FC<PersonalizationPanelProps> = ({ onApply, onAiInsight, isProcessing }) => {
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    const handleApply = () => {
        if (selectedStyle || selectedMaterial || selectedColor) {
            onApply(selectedStyle || '', selectedMaterial || '', selectedColor || '');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50">
            <div className="p-4 border-b border-slate-700 bg-slate-800/30">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <PaletteIcon className="w-4 h-4 text-sky-400" /> Design Personalization
                </h3>
                <p className="text-xs text-slate-400 mt-1">Customize aesthetics and materials.</p>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-6">

                {/* Styles */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Aesthetic Style</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {styles.map(style => (
                            <button
                                key={style}
                                onClick={() => setSelectedStyle(style === selectedStyle ? null : style)}
                                className={`px-3 py-2 text-xs rounded-md border transition-all ${
                                    selectedStyle === style
                                    ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Materials */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Primary Material</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {materials.map(mat => (
                            <button
                                key={mat}
                                onClick={() => setSelectedMaterial(mat === selectedMaterial ? null : mat)}
                                className={`px-3 py-2 text-xs rounded-md border transition-all ${
                                    selectedMaterial === mat
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                }`}
                            >
                                {mat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Colors */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Color Theme</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {colors.map(col => (
                            <button
                                key={col.name}
                                onClick={() => setSelectedColor(col.name === selectedColor ? null : col.name)}
                                title={col.name}
                                className={`w-full aspect-square rounded-full border-2 transition-all ${
                                    selectedColor === col.name ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: col.value }}
                            />
                        ))}
                    </div>
                    {selectedColor && <p className="text-center text-xs text-slate-400 mt-1">{selectedColor}</p>}
                </div>

                {/* Apply Button */}
                <button
                    onClick={handleApply}
                    disabled={isProcessing || (!selectedStyle && !selectedMaterial && !selectedColor)}
                    className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-md shadow-md transition-all flex items-center justify-center gap-2"
                >
                    {isProcessing ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <MagicWandIcon className="w-4 h-4" />}
                    Apply Personalization
                </button>

                <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <LightbulbIcon className="w-3 h-3 text-yellow-400" /> AI Design Insights
                    </h4>
                    <div className="space-y-2">
                        <button
                            onClick={() => onAiInsight("materials")}
                            disabled={isProcessing}
                            className="w-full p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-left flex items-center gap-2 transition-colors"
                        >
                            <SparklesIcon className="w-3 h-3 text-yellow-400" /> Suggest Material Optimizations
                        </button>
                        <button
                            onClick={() => onAiInsight("ergonomics")}
                            disabled={isProcessing}
                            className="w-full p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-left flex items-center gap-2 transition-colors"
                        >
                            <SparklesIcon className="w-3 h-3 text-green-400" /> Improve Ergonomics & Usability
                        </button>
                        <button
                            onClick={() => onAiInsight("sustainability")}
                            disabled={isProcessing}
                            className="w-full p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-left flex items-center gap-2 transition-colors"
                        >
                            <SparklesIcon className="w-3 h-3 text-emerald-400" /> Analyze Sustainability Impact
                        </button>
                        <button
                            onClick={() => onAiInsight("cost")}
                            disabled={isProcessing}
                            className="w-full p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-left flex items-center gap-2 transition-colors"
                        >
                            <SparklesIcon className="w-3 h-3 text-blue-400" /> Suggest Cost Reductions
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
