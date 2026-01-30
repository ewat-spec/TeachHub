"use client";

import React from 'react';
import { DesignSpec, ArchitecturalSpec, AutonomousVehicleSpec, BasicGeometrySpec } from '../types';
import {
    MagicWandIcon, LoaderIcon, CubeIcon, SparklesIcon, ExplodedViewIcon, RulerIcon,
    FileJsonIcon, BuildingIcon, LayersIcon, TableIcon, PaletteIcon, FilmIcon,
    Share2Icon, CpuIcon, ShapesIcon
} from './icons';

interface ActionButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onClick, isLoading, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm bg-slate-900 hover:bg-slate-700 disabled:bg-slate-900/50 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md transition-colors border border-slate-700"
    >
        {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
        <span className="flex-grow">{label}</span>
        {disabled && !isLoading && <span className="text-xs text-slate-500">Generated</span>}
    </button>
);

interface DesignInputPanelProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    isLoading: boolean;
    error: string | null;
    designSpec: DesignSpec | ArchitecturalSpec | AutonomousVehicleSpec | BasicGeometrySpec | null;
    designMode: string;
    handleSubmit: () => void;
    // Handlers for generation actions
    actions: {
        generate3dSketch: () => void;
        generateLifestyleImage: () => void;
        generateExplodedView: () => void;
        generateTechnicalDrawing: () => void;
        generateModel: () => void;
        generateElevation: () => void;
        generateSection: () => void;
        generateSchedule: () => void;
        generateFinishSchedule: () => void;
        generateVirtualTour: () => void;
        generateSensorLayout: () => void;
        generateSystemArchitecture: () => void;
        // Basic Geometry Actions
        generateOrthographic: () => void;
        generateIsometric: () => void;
    };
    // Status flags
    loadingStatus: {
        isGenerating3dSketch: boolean;
        isGeneratingLifestyleImage: boolean;
        isGeneratingExplodedView: boolean;
        isGeneratingTechnicalDrawing: boolean;
        isGeneratingModel: boolean;
        isGeneratingElevation: boolean;
        isGeneratingSection: boolean;
        isGeneratingSchedule: boolean;
        isGeneratingFinishSchedule: boolean;
        isGeneratingVirtualTour: boolean;
        isGeneratingSensorLayout: boolean;
        isGeneratingSystemArchitecture: boolean;
        isGeneratingOrthographic?: boolean;
        isGeneratingIsometric?: boolean;
    };
    // Data availability flags (to disable buttons)
    hasData: {
        threeDSketch: boolean;
        lifestyle: boolean;
        exploded: boolean;
        technicalDrawing: boolean;
        gltf: boolean;
        elevation: boolean;
        section: boolean;
        schedule: boolean;
        finishSchedule: boolean;
        virtualTour: boolean;
        sensorLayout: boolean;
        systemArchitecture: boolean;
        orthographic?: boolean;
        isometric?: boolean;
    };
}

export const DesignInputPanel: React.FC<DesignInputPanelProps> = ({
    prompt, setPrompt, isLoading, error, designSpec, designMode, handleSubmit, actions, loadingStatus, hasData
}) => {
    return (
        <div className="lg:col-span-3 bg-slate-800/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white">Design Input</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                <textarea
                    className="w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-2 text-sm placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    placeholder={designMode === 'basic-geometry' ? "Describe shape (e.g., 'Red cube 20x20x20')" : "Describe your design..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <MagicWandIcon className="w-5 h-5" />}
                    {isLoading ? 'Generating...' : 'Generate Design'}
                </button>
                {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-md">{error}</div>}

                {designSpec && (
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <h3 className="text-md font-semibold text-white mb-3">Actions & Analysis</h3>
                        <div className="space-y-2">
                            {designMode === 'product' && (
                                <>
                                    <ActionButton icon={CubeIcon} label="Generate 3D Sketch" onClick={actions.generate3dSketch} isLoading={loadingStatus.isGenerating3dSketch} disabled={hasData.threeDSketch} />
                                    <ActionButton icon={SparklesIcon} label="Generate Lifestyle Image" onClick={actions.generateLifestyleImage} isLoading={loadingStatus.isGeneratingLifestyleImage} disabled={hasData.lifestyle} />
                                    <ActionButton icon={ExplodedViewIcon} label="Generate Exploded View" onClick={actions.generateExplodedView} isLoading={loadingStatus.isGeneratingExplodedView} disabled={hasData.exploded} />
                                    <ActionButton icon={RulerIcon} label="Generate Technical Drawing" onClick={actions.generateTechnicalDrawing} isLoading={loadingStatus.isGeneratingTechnicalDrawing} disabled={hasData.technicalDrawing} />
                                    <ActionButton icon={FileJsonIcon} label="Generate 3D Model (GLTF)" onClick={actions.generateModel} isLoading={loadingStatus.isGeneratingModel} disabled={hasData.gltf} />
                                </>
                            )}
                            {designMode === 'architecture' && (
                                <>
                                    <ActionButton icon={BuildingIcon} label="Generate Elevation" onClick={actions.generateElevation} isLoading={loadingStatus.isGeneratingElevation} disabled={hasData.elevation} />
                                    <ActionButton icon={LayersIcon} label="Generate Section" onClick={actions.generateSection} isLoading={loadingStatus.isGeneratingSection} disabled={hasData.section} />
                                    <ActionButton icon={TableIcon} label="Generate Door/Window Schedule" onClick={actions.generateSchedule} isLoading={loadingStatus.isGeneratingSchedule} disabled={hasData.schedule} />
                                    <ActionButton icon={PaletteIcon} label="Generate Finish Schedule" onClick={actions.generateFinishSchedule} isLoading={loadingStatus.isGeneratingFinishSchedule} disabled={hasData.finishSchedule} />
                                    <ActionButton icon={FilmIcon} label="Generate Virtual Tour Video" onClick={actions.generateVirtualTour} isLoading={loadingStatus.isGeneratingVirtualTour} disabled={hasData.virtualTour} />
                                </>
                            )}
                            {designMode === 'autonomous' && (
                                <>
                                     <ActionButton icon={Share2Icon} label="Generate Sensor Layout" onClick={actions.generateSensorLayout} isLoading={loadingStatus.isGeneratingSensorLayout} disabled={hasData.sensorLayout} />
                                     <ActionButton icon={CpuIcon} label="Generate System Architecture" onClick={actions.generateSystemArchitecture} isLoading={loadingStatus.isGeneratingSystemArchitecture} disabled={hasData.systemArchitecture} />
                                </>
                            )}
                            {designMode === 'basic-geometry' && (
                                <>
                                    <ActionButton icon={ShapesIcon} label="Generate Orthographic Views" onClick={actions.generateOrthographic} isLoading={!!loadingStatus.isGeneratingOrthographic} disabled={hasData.orthographic} />
                                    <ActionButton icon={CubeIcon} label="Generate Isometric View" onClick={actions.generateIsometric} isLoading={!!loadingStatus.isGeneratingIsometric} disabled={hasData.isometric} />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
