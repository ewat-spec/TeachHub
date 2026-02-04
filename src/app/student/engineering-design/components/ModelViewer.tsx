import React, { useState } from 'react';

interface ModelViewerProps {
    gltfJson: string | null;
    simulationVerdict?: string;
    designMode?: string;
    basicGeometrySpec?: any;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ gltfJson, simulationVerdict, designMode, basicGeometrySpec }) => {
    const [rotation, setRotation] = useState({ x: -20, y: 45 });

    // Simple CSS 3D Cube for Basic Geometry mode
    if (designMode === 'basic-geometry' && basicGeometrySpec) {
        const { dimensions, color } = basicGeometrySpec;
        // Scale down for view
        const scale = 2;
        const w = (dimensions?.width || 10) * scale;
        const h = (dimensions?.height || 10) * scale;
        const d = (dimensions?.depth || 10) * scale;

        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 perspective-1000" style={{ perspective: '1000px' }}>
                <div
                    className="relative transform-style-3d transition-transform duration-100 ease-linear cursor-grab active:cursor-grabbing"
                    style={{
                        width: w, height: h,
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                    onMouseMove={(e) => {
                        if (e.buttons === 1) {
                            setRotation(prev => ({ x: prev.x - e.movementY, y: prev.y + e.movementX }));
                        }
                    }}
                >
                    {/* Front */}
                    <div className="absolute border border-white/20 flex items-center justify-center text-white/50 text-xs" style={{ width: w, height: h, transform: `translateZ(${d/2}px)`, background: color, opacity: 0.8 }}>Front</div>
                    {/* Back */}
                    <div className="absolute border border-white/20 flex items-center justify-center text-white/50 text-xs" style={{ width: w, height: h, transform: `rotateY(180deg) translateZ(${d/2}px)`, background: color, opacity: 0.8 }}>Back</div>
                    {/* Right */}
                    <div className="absolute border border-white/20 flex items-center justify-center text-white/50 text-xs" style={{ width: d, height: h, transform: `rotateY(90deg) translateZ(${w/2}px)`, background: color, opacity: 0.7 }}>Right</div>
                    {/* Left */}
                    <div className="absolute border border-white/20 flex items-center justify-center text-white/50 text-xs" style={{ width: d, height: h, transform: `rotateY(-90deg) translateZ(${w/2}px)`, background: color, opacity: 0.7 }}>Left</div>
                    {/* Top */}
                    <div className="absolute border border-white/20 flex items-center justify-center text-white/50 text-xs" style={{ width: w, height: d, transform: `rotateX(90deg) translateZ(${h/2}px)`, background: color, opacity: 0.9 }}>Top</div>
                    {/* Bottom */}
                    <div className="absolute border border-white/20 flex items-center justify-center text-white/50 text-xs" style={{ width: w, height: d, transform: `rotateX(-90deg) translateZ(${h/2}px)`, background: color, opacity: 0.9 }}>Bottom</div>
                </div>
                <div className="absolute bottom-4 left-4 text-white text-xs bg-black/50 p-2 rounded pointer-events-none">
                    Drag to rotate<br/>
                    Dimensions: {dimensions?.width}x{dimensions?.height}x{dimensions?.depth}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-black text-white">
            <div>
                <h3 className="text-xl">3D Model Viewer Placeholder</h3>
                {simulationVerdict && <p>Simulation Verdict: {simulationVerdict}</p>}
                <p className="text-xs text-gray-500">GLTF Data length: {gltfJson?.length || 0}</p>
            </div>
        </div>
    );
};

export default ModelViewer;
