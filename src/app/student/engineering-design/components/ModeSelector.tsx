"use client";
import React from 'react';
import { ProductIcon, HomeIcon, AutomotiveIcon } from './icons';

interface ModeSelectorProps {
    setDesignMode: (mode: string) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ setDesignMode }) => {
    const modes = [
        { id: 'product', name: 'Product & Industrial Design', icon: ProductIcon, description: 'Generate specs, concepts, and 3D models for physical products.' },
        { id: 'architecture', name: 'Architecture', icon: HomeIcon, description: 'Create architectural plans, renderings, and schedules for buildings.' },
        { id: 'autonomous', name: 'Autonomous Systems', icon: AutomotiveIcon, description: 'Design autonomous vehicles, drones, and robots with sensor layouts.' },
    ];
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">AI Engineering Design Assistant</h1>
                <p className="text-slate-400 text-lg">Your intelligent partner for creating, analyzing, and visualizing complex designs.</p>
            </div>
            <div className="w-full max-w-4xl">
                <h2 className="text-2xl font-semibold text-slate-200 mb-6 text-center">Select a Design Mode to Begin</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {modes.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setDesignMode(mode.id)}
                            className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-sky-500 hover:bg-slate-700/50 transition-all duration-300 text-left flex flex-col items-start"
                        >
                            <mode.icon className="w-10 h-10 mb-4 text-sky-400" />
                            <h3 className="text-xl font-bold text-slate-100 mb-2">{mode.name}</h3>
                            <p className="text-slate-400 text-sm flex-grow">{mode.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
