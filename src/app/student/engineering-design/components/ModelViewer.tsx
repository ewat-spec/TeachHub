import React from 'react';

interface ModelViewerProps {
    gltfJson: string | null;
    simulationVerdict?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ gltfJson, simulationVerdict }) => {
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
