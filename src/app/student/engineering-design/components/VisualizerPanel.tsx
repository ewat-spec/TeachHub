"use client";
import React, { useRef, useEffect } from 'react';
import {
    PencilIcon, CubeIcon, ImageIcon, SparklesIcon, CameraIcon, ExplodedViewIcon,
    RulerIcon, BuildingIcon, LayersIcon, Share2Icon, CpuIcon, FilmIcon,
    LoaderIcon, AlertTriangleIcon, SendIcon, EraserIcon
} from './icons';
import ModelViewer from './ModelViewer';

interface VisualizerPanelProps {
    designMode: string;
    designSpec: any;
    isLoading: boolean;
    activeView: string;
    setActiveView: (view: string) => void;
    // Image URLs and Data
    images: {
        sketch: string | null;
        threeDSketch: string | null;
        concept: string | null;
        render: string | null;
        lifestyle: string | null;
        exploded: string | null;
        technicalDrawing: string | null;
        elevation: string | null;
        section: string | null;
        sensorLayout: string | null;
        systemArchitecture: string | null;
    };
    gltfData: string | null;
    virtualTourUrl: string | null;
    simulationResult: any;
    // Drawing Refinement Props
    drawingTools: {
        drawingTool: 'pen' | 'eraser' | null;
        setDrawingTool: React.Dispatch<React.SetStateAction<'pen' | 'eraser' | null>>;
        isRefiningDrawing: boolean;
        refineInstruction: string;
        setRefineInstruction: (val: string) => void;
        handleRefineDrawing: () => void;
        hasDrawing: boolean;
        setHasDrawing: (val: boolean) => void;
        drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
        imageRef: React.RefObject<HTMLImageElement>;
        startDrawing: (e: any) => void;
        draw: (e: any) => void;
        stopDrawing: () => void;
    };
}

const TabButton = ({ viewId, icon: Icon, label, activeView, setActiveView }: { viewId: string; icon: React.ElementType; label: string; activeView: string; setActiveView: (v: string) => void }) => (
    <button
        onClick={() => setActiveView(viewId)}
        aria-label={label}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors shrink-0 ${
            activeView === viewId
            ? 'bg-sky-600 text-white'
            : 'bg-slate-800 hover:bg-slate-700'
        }`}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </button>
);

const ImageViewer = ({ src, alt }: { src: string | null, alt: string }) => (
    src ? <img src={src} alt={alt} className="max-w-full max-h-full object-contain" /> : <p className="text-slate-400">{alt} not available.</p>
);

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
    designMode, designSpec, isLoading, activeView, setActiveView,
    images, gltfData, virtualTourUrl, simulationResult,
    drawingTools
}) => {

    // Resize canvas logic handled in parent or here?
    // Ideally here if refs are passed correctly or managed here.
    // The original code had a useEffect for canvas resizing.
    // We will assume the parent passes initialized refs or we add the effect here.

    useEffect(() => {
        const canvas = drawingTools.drawingCanvasRef.current;
        const image = drawingTools.imageRef.current;
        if (canvas && image && activeView === 'technical-drawing' && images.technicalDrawing) {
          const resizeCanvas = () => {
            if(image.naturalWidth > 0) {
              const { width, height } = image.getBoundingClientRect();
              canvas.width = width;
              canvas.height = height;
            }
          };
          if (image.complete) resizeCanvas();
          else image.onload = resizeCanvas;
          window.addEventListener('resize', resizeCanvas);
          return () => {
            window.removeEventListener('resize', resizeCanvas);
            image.onload = null;
          }
        }
      }, [images.technicalDrawing, activeView, drawingTools.drawingCanvasRef, drawingTools.imageRef]);


    return (
        <div className="lg:col-span-6 bg-slate-800/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
            <div className="p-2 border-b border-slate-800 shrink-0">
                <div className="flex space-x-1 overflow-x-auto custom-scrollbar pb-1">
                    {images.sketch && <TabButton viewId="sketch" icon={PencilIcon} label={designMode === 'architecture' ? 'Plan' : (designMode === 'autonomous' ? 'Concept' : 'Sketch')} activeView={activeView} setActiveView={setActiveView} />}
                    {images.threeDSketch && <TabButton viewId="3d-sketch" icon={CubeIcon} label="3D Sketch" activeView={activeView} setActiveView={setActiveView} />}
                    {images.concept && <TabButton viewId="concept" icon={ImageIcon} label={designMode === 'architecture' ? 'Exterior' : 'Concept'} activeView={activeView} setActiveView={setActiveView} />}
                    {images.render && <TabButton viewId="render" icon={SparklesIcon} label={designMode === 'architecture' ? 'Interior' : 'Render'} activeView={activeView} setActiveView={setActiveView} />}
                    {images.lifestyle && <TabButton viewId="lifestyle" icon={CameraIcon} label="Lifestyle" activeView={activeView} setActiveView={setActiveView} />}
                    {images.exploded && <TabButton viewId="exploded" icon={ExplodedViewIcon} label="Exploded" activeView={activeView} setActiveView={setActiveView} />}
                    {images.technicalDrawing && <TabButton viewId="technical-drawing" icon={RulerIcon} label="Drawing" activeView={activeView} setActiveView={setActiveView} />}
                    {images.elevation && <TabButton viewId="elevation" icon={BuildingIcon} label="Elevation" activeView={activeView} setActiveView={setActiveView} />}
                    {images.section && <TabButton viewId="section" icon={LayersIcon} label="Section" activeView={activeView} setActiveView={setActiveView} />}
                    {images.sensorLayout && <TabButton viewId="sensor-layout" icon={Share2Icon} label="Sensors" activeView={activeView} setActiveView={setActiveView} />}
                    {images.systemArchitecture && <TabButton viewId="system-architecture" icon={CpuIcon} label="Architecture" activeView={activeView} setActiveView={setActiveView} />}
                    {virtualTourUrl && <TabButton viewId="virtual-tour" icon={FilmIcon} label="Tour" activeView={activeView} setActiveView={setActiveView} />}
                    {gltfData && <TabButton viewId="3d-model" icon={CubeIcon} label="3D Model" activeView={activeView} setActiveView={setActiveView} />}
                </div>
            </div>
            <div className="flex-grow bg-slate-900/50 relative flex items-center justify-center p-2">
                {!designSpec && !isLoading && <div className="text-slate-500">Your design visualizations will appear here.</div>}
                {isLoading && !designSpec && <LoaderIcon className="w-8 h-8 animate-spin text-sky-500" />}

                {activeView === 'sketch' && <ImageViewer src={images.sketch} alt="Concept sketch" />}
                {activeView === '3d-sketch' && <ImageViewer src={images.threeDSketch} alt="3D sketch" />}
                {activeView === 'concept' && <ImageViewer src={images.concept} alt="Product concept" />}
                {activeView === 'render' && <ImageViewer src={images.render} alt="Product render" />}
                {activeView === 'lifestyle' && <ImageViewer src={images.lifestyle} alt="Lifestyle" />}
                {activeView === 'exploded' && <ImageViewer src={images.exploded} alt="Exploded view" />}
                {activeView === 'elevation' && <ImageViewer src={images.elevation} alt="Elevation drawing" />}
                {activeView === 'section' && <ImageViewer src={images.section} alt="Section drawing" />}
                {activeView === 'sensor-layout' && <ImageViewer src={images.sensorLayout} alt="Sensor layout" />}
                {activeView === 'system-architecture' && <ImageViewer src={images.systemArchitecture} alt="System architecture" />}

                {activeView === 'technical-drawing' && (
                    images.technicalDrawing ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                ref={drawingTools.imageRef}
                                src={images.technicalDrawing}
                                alt="Technical drawing"
                                className="max-w-full max-h-full object-contain"
                                crossOrigin="anonymous"
                            />
                            <canvas
                                ref={drawingTools.drawingCanvasRef}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{
                                  pointerEvents: drawingTools.drawingTool ? 'auto' : 'none',
                                  cursor: drawingTools.drawingTool ? 'crosshair' : 'default'
                                }}
                                onMouseDown={drawingTools.startDrawing}
                                onMouseMove={drawingTools.draw}
                                onMouseUp={drawingTools.stopDrawing}
                                onMouseLeave={drawingTools.stopDrawing}
                                onTouchStart={drawingTools.startDrawing}
                                onTouchMove={drawingTools.draw}
                                onTouchEnd={drawingTools.stopDrawing}
                            />
                        </div>
                        {designMode === 'product' && (
                            <div className="absolute bottom-2 left-2 right-2 p-2 bg-slate-900/80 backdrop-blur-sm rounded-md border border-slate-700 flex flex-col md:flex-row items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <button title="Pen Tool" onClick={() => drawingTools.setDrawingTool(prev => prev === 'pen' ? null : 'pen')} className={`p-2 rounded-md ${drawingTools.drawingTool === 'pen' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><PencilIcon className="w-5 h-5" /></button>
                                    <button title="Eraser Tool" onClick={() => drawingTools.setDrawingTool(prev => prev === 'eraser' ? null : 'eraser')} className={`p-2 rounded-md ${drawingTools.drawingTool === 'eraser' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><EraserIcon className="w-5 h-5" /></button>
                                    <button
                                        title="Clear Drawing"
                                        onClick={() => {
                                            const canvas = drawingTools.drawingCanvasRef.current;
                                            if (canvas) {
                                                const ctx = canvas.getContext('2d');
                                                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                                                drawingTools.setHasDrawing(false);
                                            }
                                        }}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"
                                        disabled={!drawingTools.hasDrawing}
                                    >Clear</button>
                                </div>
                                <div className="flex-grow flex items-center gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        value={drawingTools.refineInstruction}
                                        onChange={(e) => drawingTools.setRefineInstruction(e.target.value)}
                                        placeholder="e.g., 'Make this dimension 50mm instead of 45mm'"
                                        className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm placeholder-slate-500 focus:ring-1 focus:ring-sky-500 outline-none"
                                    />
                                    <button onClick={drawingTools.handleRefineDrawing} disabled={drawingTools.isRefiningDrawing || !drawingTools.refineInstruction.trim()} className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 rounded-md text-white">
                                        {drawingTools.isRefiningDrawing ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SendIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    ) : (
                    <p className="text-slate-400">Technical drawing not available.</p>
                    )
                )}

                {activeView === 'virtual-tour' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        {virtualTourUrl ? (
                            <>
                            <video key={virtualTourUrl} controls autoPlay loop className="max-w-full max-h-full">
                                <source src={virtualTourUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-yellow-900/80 backdrop-blur-sm border-t border-yellow-700">
                                <div className="flex items-center text-yellow-200 text-xs max-w-full mx-auto">
                                    <AlertTriangleIcon className="w-4 h-4 mr-2 shrink-0" />
                                    <p><strong className="font-bold">Security Warning:</strong> For video playback, your API key is appended to the URL and may be visible in your browser's network inspector.</p>
                                </div>
                            </div>
                            </>
                        ) : (
                            <p className="text-slate-400">Video not available.</p>
                        )}
                    </div>
                )}
                {activeView === '3d-model' && gltfData && <ModelViewer gltfJson={gltfData} simulationVerdict={simulationResult?.verdict} />}
            </div>
        </div>
    );
}
