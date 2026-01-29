"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DesignSpec, ArchitecturalSpec, AutonomousVehicleSpec, SimulationResult, DoorAndWindowSchedule, FinishSchedule, GroundedSearchResult } from './types';
import {
    createChatSession,
    designSpecSchema,
    architecturalSpecSchema,
    autonomousVehicleSpecSchema,
    generateDesignSpec,
    generateArchitecturalSpec,
    generateAutonomousVehicleSpec,
    analyzeImageWithFlash,
    generateSketchImage,
    generate3dSketchImage,
    generateDesignImage,
    generateRenderImage,
    generateLifestyleImage,
    generateExplodedViewImage,
    generateTechnicalDrawingImage,
    generateFloorPlanImage,
    generateElevationImage,
    generateSectionImage,
    generateExteriorRenderImage,
    generateInteriorRenderImage,
    generateDoorAndWindowSchedule,
    generateFinishSchedule,
    generateVehicleConceptImage,
    generateSensorLayoutImage,
    generateSystemArchitectureImage,
    refineTechnicalDrawingImage,
    editImageWithText,
    generateManufacturingAndCostAnalysis,
    generateConstructionCostAnalysis,
    generateCadModel,
    generatePartAnalysis,
    generateSimulationAnalysis,
    findFabricationServices,
    FabricationService,
    generateAssemblyInstructions,
    getSourcingAndComplianceInfo,
    getComponentSourcingInfo,
    generatePdfSummaryHtmlBody,
    generateVirtualTourVideo,
    generateFusion360Script,
    cleanJson,
    Chat,
    GenerateContentParameters
} from './services/geminiService';
import {
    MagicWandIcon, LoaderIcon, AlertTriangleIcon, LayersIcon, DownloadIcon, RulerIcon, CameraIcon,
    CogIcon, Share2Icon, SendIcon, CubeIcon, FileUpIcon, CpuIcon, ShieldCheckIcon, PencilIcon,
    EraserIcon, ImageIcon, FactoryIcon, FileJsonIcon, WrenchIcon, FileTextIcon, SparklesIcon,
    HomeIcon, BuildingIcon, SofaIcon, DollarSignIcon, ExplodedViewIcon,
    ProductIcon, AutomotiveIcon, AerospaceIcon, JewelryIcon, SearchIcon, BrainCircuitIcon, FilmIcon,
    HistoryIcon, MessageSquareIcon, FileCodeIcon, TableIcon, PaletteIcon
} from './components/icons';
import ModelViewer from './components/ModelViewer';
import { gltfToStl } from './components/stlExporter';
import { initializeSecurityAgent, createSanitizedHtmlObject, reportSuspiciousActivity } from './services/securityService';


// --- Helper functions for sharing ---
const compressAndEncode = async (data: object): Promise<string> => {
  const jsonString = JSON.stringify(data);
  const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const compressed = new Blob(chunks);
  const buffer = await compressed.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  let binaryString = '';
  uint8Array.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });
  return btoa(binaryString);
};

const decodeAndDecompress = async (base64: string): Promise<any> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressedBlob = await new Response(stream).blob();
  const text = await decompressedBlob.text();
  return JSON.parse(text);
};


const SESSION_STORAGE_KEY = 'ai-design-assistant-session';

// Helper function to resize an image if it's too large
const resizeImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const MAX_DIMENSION = 1024;
            const { width, height } = image;

            let newWidth = width;
            let newHeight = height;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    newWidth = MAX_DIMENSION;
                    newHeight = Math.round((height * MAX_DIMENSION) / width);
                } else {
                    newHeight = MAX_DIMENSION;
                    newWidth = Math.round((width * MAX_DIMENSION) / height);
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const context = canvas.getContext('2d');

            if (!context) {
                return reject(new Error("Could not get canvas context for resizing."));
            }
            context.drawImage(image, 0, 0, newWidth, newHeight);
            const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(resizedImageUrl);
        };
        image.onerror = () => reject(new Error("Could not load image for resizing."));
        image.src = imageUrl;
    });
};

interface Comment {
    text: string;
    timestamp: string;
}

interface DesignVersion {
    name: string;
    timestamp: string;
    spec: DesignSpec | ArchitecturalSpec | AutonomousVehicleSpec;
}


const EngineeringDesignApp: React.FC = () => {
  const [designMode, setDesignMode] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [tolerance, setTolerance] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [designSpec, setDesignSpec] = useState<DesignSpec | ArchitecturalSpec | AutonomousVehicleSpec | null>(null);
  const [filename, setFilename] = useState<string>('');

  // Visualization State
  const [sketchImageUrl, setSketchImageUrl] = useState<string | null>(null); // Eng: Sketch, Arch: Floor Plan, Auto: Concept
  const [threeDSketchImageUrl, setThreeDSketchImageUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Eng: Concept, Arch: Exterior
  const [renderImageUrl, setRenderImageUrl] = useState<string | null>(null); // Eng: Render, Arch: Interior
  const [lifestyleImageUrl, setLifestyleImageUrl] = useState<string | null>(null);
  const [explodedImageUrl, setExplodedImageUrl] = useState<string | null>(null);
  const [technicalDrawingImageUrl, setTechnicalDrawingImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [gltfData, setGltfData] = useState<string | null>(null);
  const [assemblyInstructions, setAssemblyInstructions] = useState<string | null>(null);
  const [virtualTourUrl, setVirtualTourUrl] = useState<string | null>(null);
  const [elevationImageUrl, setElevationImageUrl] = useState<string | null>(null);
  const [sectionImageUrl, setSectionImageUrl] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<DoorAndWindowSchedule | null>(null);
  const [finishSchedule, setFinishSchedule] = useState<FinishSchedule | null>(null);
  const [sensorLayoutImageUrl, setSensorLayoutImageUrl] = useState<string | null>(null);
  const [systemArchitectureImageUrl, setSystemArchitectureImageUrl] = useState<string | null>(null);

  const [isGenerating3dSketch, setIsGenerating3dSketch] = useState<boolean>(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState<boolean>(false);
  const [isGeneratingRender, setIsGeneratingRender] = useState<boolean>(false);
  const [isGeneratingLifestyleImage, setIsGeneratingLifestyleImage] = useState<boolean>(false);
  const [isGeneratingExplodedView, setIsGeneratingExplodedView] = useState<boolean>(false);
  const [isGeneratingTechnicalDrawing, setIsGeneratingTechnicalDrawing] = useState<boolean>(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState<boolean>(false);
  const [isGeneratingModel, setIsGeneratingModel] = useState<boolean>(false);
  const [isGeneratingAssembly, setIsGeneratingAssembly] = useState<boolean>(false);
  const [isGeneratingVirtualTour, setIsGeneratingVirtualTour] = useState<boolean>(false);
  const [isGeneratingElevation, setIsGeneratingElevation] = useState<boolean>(false);
  const [isGeneratingSection, setIsGeneratingSection] = useState<boolean>(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState<boolean>(false);
  const [isGeneratingFinishSchedule, setIsGeneratingFinishSchedule] = useState<boolean>(false);
  const [isGeneratingSensorLayout, setIsGeneratingSensorLayout] = useState<boolean>(false);
  const [isGeneratingSystemArchitecture, setIsGeneratingSystemArchitecture] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<string>('sketch');

  // Drawing Refinement State
  const [refineInstruction, setRefineInstruction] = useState<string>('');
  const [isRefiningDrawing, setIsRefiningDrawing] = useState<boolean>(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser' | null>(null);

  // Part Analysis State
  const [partAnalysisData, setPartAnalysisData] = useState<Record<string, { result: string | null, isLoading: boolean }>>({});
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const [isAnalyzingAllParts, setIsAnalyzingAllParts] = useState(false);

  // Simulation State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationMaterial, setSimulationMaterial] = useState<string>('');
  const [simulationForce, setSimulationForce] = useState<string>('100');

  // Texture & Aspect Ratio State
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Architectural Interior State
  const [currentInteriorRoom, setCurrentInteriorRoom] = useState<string | null>(null);
  const [isGeneratingRoomRender, setIsGeneratingRoomRender] = useState<Record<string, boolean>>({});


  // Camera & Upload State
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Analysis State
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);

  // Image Editing State
  const [editState, setEditState] = useState({ isOpen: false, imageSrc: '', viewToUpdate: '', prompt: '' });
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Sharing State
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Chat state
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Export State
  const [isExportingStl, setIsExportingStl] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExportingScript, setIsExportingScript] = useState<boolean>(false);

  // Fabrication State
  const [fabricationServices, setFabricationServices] = useState<FabricationService[]>([]);
  const [fabricationSummary, setFabricationSummary] = useState<string | null>(null);
  const [isFindingFabricators, setIsFindingFabricators] = useState<boolean>(false);

  // Sourcing State
  const [sourcingInfo, setSourcingInfo] = useState<GroundedSearchResult | null>(null);
  const [isFindingSourcingInfo, setIsFindingSourcingInfo] = useState<boolean>(false);
  const [researchTopic, setResearchTopic] = useState<string>('sourcing the best LiDAR and Radar chips');

  // Collaboration and Versioning State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [designHistory, setDesignHistory] = useState<DesignVersion[]>([]);

  const [activeTab, setActiveTab] = useState<'spec' | 'chat' | 'history' | 'comments'>('spec');

  const handleGenerateSchedule = useCallback(async () => {
    if (!designSpec || !('buildingType' in designSpec) || isGeneratingSchedule) return;

    setError(null);
    setIsGeneratingSchedule(true);

    try {
        const result = await generateDoorAndWindowSchedule(designSpec as ArchitecturalSpec);
        setSchedule(result);
    } catch (err: any) {
        reportSuspiciousActivity('ScheduleGenerationFailed', { error: err });
        setError(err.message || 'An unknown error occurred while generating the schedule.');
    } finally {
        setIsGeneratingSchedule(false);
    }
  }, [designSpec, isGeneratingSchedule]);

  const handleGenerateFinishSchedule = useCallback(async () => {
    if (!designSpec || !('buildingType' in designSpec) || isGeneratingFinishSchedule) return;

    setError(null);
    setIsGeneratingFinishSchedule(true);

    try {
        const result = await generateFinishSchedule(designSpec as ArchitecturalSpec);
        setFinishSchedule(result);
    } catch (err: any) {
        reportSuspiciousActivity('FinishScheduleGenerationFailed', { error: err });
        setError(err.message || 'An unknown error occurred while generating the finish schedule.');
    } finally {
        setIsGeneratingFinishSchedule(false);
    }
  }, [designSpec, isGeneratingFinishSchedule]);


  const reinitializeChatFromSpec = useCallback((spec: DesignSpec | ArchitecturalSpec | AutonomousVehicleSpec, mode: string, thinkingMode: boolean) => {
    const isArchitectural = mode === 'architecture';
    const isAutonomous = mode === 'autonomous';

    let systemInstruction = `You are an expert engineering design assistant. The user has provided an initial JSON design specification. Your task is to interpret subsequent user instructions and return the complete, updated JSON object that reflects the requested changes. IMPORTANT: Only output the raw JSON object, with no additional text, explanations, or markdown formatting. The entire response must be a single, valid JSON object.`;
    if (isArchitectural) {
        systemInstruction = `You are an expert architectural design assistant. The user has provided an initial JSON architectural specification. Your task is to interpret subsequent user instructions and return the complete, updated JSON object that reflects the requested changes. IMPORTANT: Only output the raw JSON object, with no additional text, explanations, or markdown formatting. The entire response must be a single, valid JSON object.`;
    } else if (isAutonomous) {
        systemInstruction = `You are an expert autonomous systems design assistant. The user has provided an initial JSON autonomous vehicle specification. Your task is to interpret subsequent user instructions and return the complete, updated JSON object that reflects the requested changes. IMPORTANT: Only output the raw JSON object, with no additional text, explanations, or markdown formatting. The entire response must be a single, valid JSON object.`;
    }

    const initialChatHistoryForApi = [
        { role: 'user' as const, parts: [{ text: `Here is the initial design specification in JSON format. From now on, please act as an assistant to help me modify it based on my instructions. When I provide an instruction, you must return the entire, complete, updated JSON object reflecting the change. Do not add any commentary or explanation outside of the JSON object.\n\n${JSON.stringify(spec, null, 2)}` }] },
        { role: 'model' as const, parts: [{ text: 'Understood. I have the initial design specification. I will now only respond with the complete, updated JSON object based on your instructions. How would you like to modify the design?' }] }
    ];

    const modelConfig: GenerateContentParameters['config'] = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: isArchitectural ? architecturalSpecSchema : isAutonomous ? autonomousVehicleSpecSchema : designSpecSchema,
    };

    if (thinkingMode) {
        modelConfig.thinkingConfig = { thinkingBudget: 32768 };
    }

    const newChat = createChatSession({
        model: 'gemini-3-pro-preview',
        config: modelConfig,
        history: initialChatHistoryForApi,
    });
    setChatSession(newChat);
  }, []);

  // Re-initialize chat session when thinking mode changes
  useEffect(() => {
    if (designSpec && designMode) {
        reinitializeChatFromSpec(designSpec, designMode, isThinkingMode);
    }
  }, [isThinkingMode, designSpec, designMode, reinitializeChatFromSpec]);

  useEffect(() => {
    initializeSecurityAgent();
  }, []);

  // Load session from localStorage on initial mount
  useEffect(() => {
    const loadSession = async () => {
      // 1. Try to load from local storage
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        try {
          const sessionState = JSON.parse(savedSession);
          const mode = sessionState.designMode || null;
          setDesignMode(mode);
          const spec = sessionState.designSpec || null;
          setDesignSpec(spec);
          setSketchImageUrl(sessionState.sketchImageUrl || null);
          setThreeDSketchImageUrl(sessionState.threeDSketchImageUrl || null);
          setImageUrl(sessionState.imageUrl || null);
          setRenderImageUrl(sessionState.renderImageUrl || null);
          setLifestyleImageUrl(sessionState.lifestyleImageUrl || null);
          setExplodedImageUrl(sessionState.explodedImageUrl || null);
          setTechnicalDrawingImageUrl(sessionState.technicalDrawingImageUrl || null);
          setElevationImageUrl(sessionState.elevationImageUrl || null);
          setSectionImageUrl(sessionState.sectionImageUrl || null);
          setSensorLayoutImageUrl(sessionState.sensorLayoutImageUrl || null);
          setSystemArchitectureImageUrl(sessionState.systemArchitectureImageUrl || null);
          setAnalysisResult(sessionState.analysisResult || null);
          setAssemblyInstructions(sessionState.assemblyInstructions || null);
          setSchedule(sessionState.schedule || null);
          setFinishSchedule(sessionState.finishSchedule || null);
          setPrompt(sessionState.prompt || '');
          setTolerance(sessionState.tolerance || '');
          setSelectedTexture(sessionState.selectedTexture || null);
          setChatHistory(sessionState.chatHistory || []);
          setFilename(sessionState.filename || (spec ? spec.name.replace(/\s+/g, '_') : ''));
          setComments(sessionState.comments || []);
          setDesignHistory(sessionState.designHistory || []);
          // Chat session is re-initialized by the thinkingMode useEffect
        } catch (err) {
          console.error("Failed to load session from localStorage:", err);
          reportSuspiciousActivity('LocalStorageLoadFailed', { error: err });
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      // 2. Check for a share link, which overrides local storage
      if (window.location.hash && window.location.hash.startsWith('#data=')) {
        const encodedData = window.location.hash.substring(6);
        try {
          const sharedState = await decodeAndDecompress(encodedData);
          const mode = sharedState.designMode || null;
          setDesignMode(mode);
          const spec = sharedState.designSpec || null;
          setDesignSpec(spec);
          setSketchImageUrl(sharedState.sketchImageUrl || null);
          setThreeDSketchImageUrl(sharedState.threeDSketchImageUrl || null);
          setImageUrl(sharedState.imageUrl || null);
          setRenderImageUrl(sharedState.renderImageUrl || null);
          setLifestyleImageUrl(sharedState.lifestyleImageUrl || null);
          setExplodedImageUrl(sharedState.explodedImageUrl || null);
          setTechnicalDrawingImageUrl(sharedState.technicalDrawingImageUrl || null);
          setElevationImageUrl(sharedState.elevationImageUrl || null);
          setSectionImageUrl(sharedState.sectionImageUrl || null);
          setSensorLayoutImageUrl(sharedState.sensorLayoutImageUrl || null);
          setSystemArchitectureImageUrl(sharedState.systemArchitectureImageUrl || null);
          setAnalysisResult(sharedState.analysisResult || null);
          setAssemblyInstructions(sharedState.assemblyInstructions || null);
          setSchedule(sharedState.schedule || null);
          setFinishSchedule(sharedState.finishSchedule || null);
          setSelectedTexture(sharedState.selectedTexture || null);
          setPrompt(sharedState.prompt || '');
          setComments(sharedState.comments || []);
          setDesignHistory(sharedState.designHistory || []);
           if (spec && mode) {
            setFilename(spec.name.replace(/\s+/g, '_'));
            setChatHistory([{ role: 'model', text: 'Design loaded from link. How would you like to refine it?' }]);
          }
        } catch (err) {
          console.error("Failed to load shared design:", err);
          reportSuspiciousActivity('ShareLinkDecodeFailed', { error: err });
          setError("The shared link appears to be invalid or corrupted.");
        } finally {
            history.replaceState(null, '', window.location.pathname);
        }
      }
      setIsInitialLoading(false);
    };

    loadSession();
  }, []);

  // Save session to localStorage whenever key state changes
  useEffect(() => {
    if (isInitialLoading) return; // Don't save during initial load

    if (designSpec) {
      const sessionState = {
        designMode,
        designSpec,
        sketchImageUrl,
        threeDSketchImageUrl,
        imageUrl,
        renderImageUrl,
        lifestyleImageUrl,
        explodedImageUrl,
        technicalDrawingImageUrl,
        elevationImageUrl,
        sectionImageUrl,
        sensorLayoutImageUrl,
        systemArchitectureImageUrl,
        analysisResult,
        assemblyInstructions,
        schedule,
        finishSchedule,
        prompt,
        tolerance,
        selectedTexture,
        chatHistory,
        filename,
        comments,
        designHistory,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [
    designSpec, sketchImageUrl, threeDSketchImageUrl, imageUrl, renderImageUrl,
    lifestyleImageUrl, explodedImageUrl, technicalDrawingImageUrl, elevationImageUrl,
    sectionImageUrl, sensorLayoutImageUrl, systemArchitectureImageUrl, analysisResult,
    assemblyInstructions, schedule, finishSchedule, prompt, tolerance,
    selectedTexture, chatHistory, filename, isInitialLoading, designMode,
    comments, designHistory
  ]);


  // Effect to manage camera stream lifecycle
  useEffect(() => {
    if (!isCameraOpen) return;

    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const openCameraStream = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoElement) videoElement.srcObject = stream;
        } catch (err) {
          console.error("Error accessing camera:", err);
          reportSuspiciousActivity('CameraAccessFailed', { error: err });
          setError("Camera access was denied or is unavailable. Please enable it in your browser settings.");
          setIsCameraOpen(false);
        }
      } else {
        setError("Camera not supported on this browser.");
        setIsCameraOpen(false);
      }
    };
    openCameraStream();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
      if (videoElement) videoElement.srcObject = null;
    };
  }, [isCameraOpen]);

  // Effect to scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  // Effect to set default simulation material
  useEffect(() => {
    if (designSpec && 'materials' in designSpec && designSpec.materials.length > 0 && !simulationMaterial) {
        setSimulationMaterial(designSpec.materials[0]);
    }
  }, [designSpec, simulationMaterial]);

  // Effect to close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Canvas setup for drawing
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    const image = imageRef.current;
    if (canvas && image && activeView === 'technical-drawing' && technicalDrawingImageUrl) {
      const resizeCanvas = () => {
        if(image.naturalWidth > 0) { // check if image is loaded
          const { width, height } = image.getBoundingClientRect();
          canvas.width = width;
          canvas.height = height;
        }
      };

      if (image.complete) {
        resizeCanvas();
      } else {
        image.onload = resizeCanvas;
      }
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        image.onload = null;
      }
    }
  }, [technicalDrawingImageUrl, activeView]);


  const handleOpenCamera = useCallback(() => {
    setError(null);
    setIsCameraOpen(true);
  }, []);

  const handleCloseCamera = useCallback(() => setIsCameraOpen(false), []);

  const handleCapture = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const MAX_DIMENSION = 1024;
        const { videoWidth, videoHeight } = video;
        const scale = Math.min(MAX_DIMENSION / videoWidth, MAX_DIMENSION / videoHeight, 1);
        canvas.width = videoWidth * scale;
        canvas.height = videoHeight * scale;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const captured = canvas.toDataURL('image/jpeg', 0.9);
        try {
            const finalImage = await resizeImage(captured);
            setReferenceImages(prev => [...prev, finalImage]);
        } catch(err: any) {
            setError(err.message);
        }
      }
    }
    handleCloseCamera();
  }, [handleCloseCamera]);

  const handleRemoveImage = (indexToRemove: number) => {
    setReferenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
            const finalImage = await resizeImage(e.target?.result as string);
            setReferenceImages(prev => [...prev, finalImage]);
        } catch(err: any) {
            setError(err.message);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const resetState = () => {
    setDesignMode(null);
    setPrompt('');
    setTolerance('');
    setIsLoading(false);
    setError(null);
    setDesignSpec(null);
    setFilename('');
    setSketchImageUrl(null);
    setThreeDSketchImageUrl(null);
    setImageUrl(null);
    setRenderImageUrl(null);
    setLifestyleImageUrl(null);
    setExplodedImageUrl(null);
    setTechnicalDrawingImageUrl(null);
    setAnalysisResult(null);
    setGltfData(null);
    setAssemblyInstructions(null);
    setVirtualTourUrl(null);
    setElevationImageUrl(null);
    setSectionImageUrl(null);
    setSensorLayoutImageUrl(null);
    setSystemArchitectureImageUrl(null);
    setSchedule(null);
    setFinishSchedule(null);
    setActiveView('sketch');
    setRefineInstruction('');
    setHasDrawing(false);
    setDrawingTool(null);
    setPartAnalysisData({});
    setExpandedPart(null);
    setSimulationResult(null);
    setSimulationMaterial('');
    setSimulationForce('100');
    setSelectedTexture(null);
    setAspectRatio('1:1');
    setCurrentInteriorRoom(null);
    setIsGeneratingRoomRender({});
    setReferenceImages([]);
    setImageAnalysisResult(null);
    setEditState({ isOpen: false, imageSrc: '', viewToUpdate: '', prompt: '' });
    setChatSession(null);
    setChatHistory([]);
    setChatInput('');
    setFabricationServices([]);
    setFabricationSummary(null);
    setSourcingInfo(null);
    setComments([]);
    setNewComment('');
    setDesignHistory([]);
    setActiveTab('spec');
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const saveVersion = (name: string) => {
    if (designSpec) {
      const newVersion: DesignVersion = {
        name,
        timestamp: new Date().toISOString(),
        spec: designSpec,
      };
      setDesignHistory(prev => [...prev, newVersion]);
    }
  };

  const loadVersion = (versionToLoad: DesignVersion) => {
    setDesignSpec(versionToLoad.spec);
    setSketchImageUrl(null);
    setThreeDSketchImageUrl(null);
    setImageUrl(null);
    setRenderImageUrl(null);
    setLifestyleImageUrl(null);
    setExplodedImageUrl(null);
    setTechnicalDrawingImageUrl(null);
    setElevationImageUrl(null);
    setSectionImageUrl(null);
    setSensorLayoutImageUrl(null);
    setSystemArchitectureImageUrl(null);
    setSchedule(null);
    setFinishSchedule(null);
    setAnalysisResult(null);
    setAssemblyInstructions(null);
    setGltfData(null);
    setVirtualTourUrl(null);
    setActiveView('sketch');
    if(designMode){
        reinitializeChatFromSpec(versionToLoad.spec, designMode, isThinkingMode);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        text: newComment,
        timestamp: new Date().toISOString(),
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt || !designMode) {
      setError('Please enter a prompt and select a design mode.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setDesignSpec(null);
    setSketchImageUrl(null);
    setThreeDSketchImageUrl(null);
    setImageUrl(null);
    setRenderImageUrl(null);
    setLifestyleImageUrl(null);
    setExplodedImageUrl(null);
    setTechnicalDrawingImageUrl(null);
    setGltfData(null);
    setAnalysisResult(null);
    setAssemblyInstructions(null);
    setVirtualTourUrl(null);
    setElevationImageUrl(null);
    setSectionImageUrl(null);
    setSensorLayoutImageUrl(null);
    setSystemArchitectureImageUrl(null);
    setSchedule(null);
    setFinishSchedule(null);
    setChatHistory([]);
    setChatSession(null);
    setComments([]);
    setDesignHistory([]);
    setActiveView('sketch');

    try {
      let spec: DesignSpec | ArchitecturalSpec | AutonomousVehicleSpec;
      let sketchPromise: Promise<string>;
      let conceptPromise: Promise<string> | null = null;
      let renderPromise: Promise<string> | null = null;

      if (designMode === 'product') {
        spec = await generateDesignSpec(prompt, referenceImages, tolerance);
        sketchPromise = generateSketchImage(spec as DesignSpec);
        conceptPromise = generateDesignImage(spec as DesignSpec, selectedTexture, aspectRatio);
        renderPromise = generateRenderImage(spec as DesignSpec, selectedTexture, aspectRatio);
      } else if (designMode === 'architecture') {
        spec = await generateArchitecturalSpec(prompt, referenceImages);
        sketchPromise = generateFloorPlanImage(spec as ArchitecturalSpec);
        conceptPromise = generateExteriorRenderImage(spec as ArchitecturalSpec);
        renderPromise = generateInteriorRenderImage(spec as ArchitecturalSpec);
      } else if (designMode === 'autonomous') {
        spec = await generateAutonomousVehicleSpec(prompt, referenceImages);
        sketchPromise = generateVehicleConceptImage(spec as AutonomousVehicleSpec);
      } else {
        throw new Error("Invalid design mode selected");
      }

      setDesignSpec(spec);
      setFilename(spec.name.replace(/\s+/g, '_'));
      saveVersion('Initial Version');
      reinitializeChatFromSpec(spec, designMode, isThinkingMode);

      const sketchUrl = await sketchPromise;
      setSketchImageUrl(sketchUrl);

      if (conceptPromise) {
          const conceptUrl = await conceptPromise;
          setImageUrl(conceptUrl);
      }
      if (renderPromise) {
          const renderUrl = await renderPromise;
          setRenderImageUrl(renderUrl);
      }

    } catch (err: any) {
      reportSuspiciousActivity('DesignGenerationFailed', { error: err });
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, designMode, referenceImages, tolerance, reinitializeChatFromSpec, isThinkingMode, selectedTexture, aspectRatio]);

  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || !chatSession || isChatLoading) return;

    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: currentInput }]);

    try {
        const response = await chatSession.sendMessage({ message: currentInput });
        const responseText = response.text;

        try {
            const updatedSpec = JSON.parse(cleanJson(responseText));
            setDesignSpec(updatedSpec);
            setChatHistory(prev => [...prev, { role: 'model', text: `Design updated. View the changes in the Spec tab.` }]);
            saveVersion(`Chat Edit: ${currentInput.substring(0, 30)}...`);
            setSketchImageUrl(null);
            setThreeDSketchImageUrl(null);
            setImageUrl(null);
            setRenderImageUrl(null);
            setLifestyleImageUrl(null);
            setExplodedImageUrl(null);
            setTechnicalDrawingImageUrl(null);
            setAnalysisResult(null);
            setGltfData(null);
            setAssemblyInstructions(null);
            setVirtualTourUrl(null);
            setElevationImageUrl(null);
            setSectionImageUrl(null);
            setSensorLayoutImageUrl(null);
            setSystemArchitectureImageUrl(null);
            setSchedule(null);
            setFinishSchedule(null);
            setActiveView('sketch');

        } catch (e) {
            reportSuspiciousActivity('ChatNonJsonReply', { response: responseText });
            setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
        }
    } catch (err: any) {
        console.error("Chat error:", err);
        reportSuspiciousActivity('ChatApiFailed', { error: err });
        setChatHistory(prev => [...prev, { role: 'model', text: `An error occurred: ${err.message}` }]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatInput, chatSession, isChatLoading]);

    const handleConfirmShare = async () => {
        const stateToShare = {
            designMode,
            designSpec,
            sketchImageUrl,
            threeDSketchImageUrl,
            imageUrl,
            renderImageUrl,
            lifestyleImageUrl,
            explodedImageUrl,
            technicalDrawingImageUrl,
            elevationImageUrl,
            sectionImageUrl,
            sensorLayoutImageUrl,
            systemArchitectureImageUrl,
            analysisResult,
            assemblyInstructions,
            schedule,
            finishSchedule,
            prompt,
            selectedTexture,
            comments,
            designHistory,
        };
        const encoded = await compressAndEncode(stateToShare);
        const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
        navigator.clipboard.writeText(url);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
        setIsShareModalOpen(false);
    };

    // --- ON-DEMAND GENERATION HANDLERS ---
    const handleGenerate3dSketch = useCallback(async () => {
        if (!designSpec || isGenerating3dSketch || designMode !== 'product') return;
        setError(null); setIsGenerating3dSketch(true);
        try {
            const url = await generate3dSketchImage(designSpec as DesignSpec);
            setThreeDSketchImageUrl(url); setActiveView('3d-sketch');
        } catch (e: any) { setError(e.message); } finally { setIsGenerating3dSketch(false); }
    }, [designSpec, isGenerating3dSketch, designMode]);

    const handleGenerateLifestyleImage = useCallback(async () => {
        if (!designSpec || isGeneratingLifestyleImage || designMode !== 'product') return;
        setError(null); setIsGeneratingLifestyleImage(true);
        try {
            const url = await generateLifestyleImage(designSpec as DesignSpec);
            setLifestyleImageUrl(url); setActiveView('lifestyle');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingLifestyleImage(false); }
    }, [designSpec, isGeneratingLifestyleImage, designMode]);

    const handleGenerateExplodedView = useCallback(async () => {
        if (!designSpec || isGeneratingExplodedView || designMode !== 'product') return;
        setError(null); setIsGeneratingExplodedView(true);
        try {
            const url = await generateExplodedViewImage(designSpec as DesignSpec);
            setExplodedImageUrl(url); setActiveView('exploded');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingExplodedView(false); }
    }, [designSpec, isGeneratingExplodedView, designMode]);

    const handleGenerateTechnicalDrawing = useCallback(async () => {
        if (!designSpec || isGeneratingTechnicalDrawing || designMode !== 'product') return;
        setError(null); setIsGeneratingTechnicalDrawing(true);
        try {
            const url = await generateTechnicalDrawingImage(designSpec as DesignSpec);
            setTechnicalDrawingImageUrl(url); setActiveView('technical-drawing');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingTechnicalDrawing(false); }
    }, [designSpec, isGeneratingTechnicalDrawing, designMode]);

    const handleGenerateElevation = useCallback(async () => {
        if (!designSpec || isGeneratingElevation || designMode !== 'architecture') return;
        setError(null); setIsGeneratingElevation(true);
        try {
            const url = await generateElevationImage(designSpec as ArchitecturalSpec);
            setElevationImageUrl(url); setActiveView('elevation');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingElevation(false); }
    }, [designSpec, isGeneratingElevation, designMode]);

    const handleGenerateSection = useCallback(async () => {
        if (!designSpec || isGeneratingSection || designMode !== 'architecture') return;
        setError(null); setIsGeneratingSection(true);
        try {
            const url = await generateSectionImage(designSpec as ArchitecturalSpec);
            setSectionImageUrl(url); setActiveView('section');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingSection(false); }
    }, [designSpec, isGeneratingSection, designMode]);

    const handleGenerateSensorLayout = useCallback(async () => {
        if (!designSpec || isGeneratingSensorLayout || designMode !== 'autonomous') return;
        setError(null); setIsGeneratingSensorLayout(true);
        try {
            const url = await generateSensorLayoutImage(designSpec as AutonomousVehicleSpec);
            setSensorLayoutImageUrl(url); setActiveView('sensor-layout');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingSensorLayout(false); }
    }, [designSpec, isGeneratingSensorLayout, designMode]);

    const handleGenerateSystemArchitecture = useCallback(async () => {
        if (!designSpec || isGeneratingSystemArchitecture || designMode !== 'autonomous') return;
        setError(null); setIsGeneratingSystemArchitecture(true);
        try {
            const url = await generateSystemArchitectureImage(designSpec as AutonomousVehicleSpec);
            setSystemArchitectureImageUrl(url); setActiveView('system-architecture');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingSystemArchitecture(false); }
    }, [designSpec, isGeneratingSystemArchitecture, designMode]);

    const handleGenerateModel = useCallback(async () => {
        if (!designSpec || isGeneratingModel || designMode !== 'product') return;
        setError(null); setIsGeneratingModel(true);
        try {
            const gltf = await generateCadModel(designSpec as DesignSpec);
            setGltfData(gltf); setActiveView('3d-model');
        } catch (e: any) { setError(e.message); } finally { setIsGeneratingModel(false); }
    }, [designSpec, isGeneratingModel, designMode]);

    const handleGenerateVirtualTour = useCallback(async () => {
        if (!designSpec || !('buildingType' in designSpec) || isGeneratingVirtualTour) return;

        // Per project guidelines, check for API key before calling Veo.
        // @ts-ignore
        if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
            // @ts-ignore
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                try {
                    // @ts-ignore
                    await window.aistudio.openSelectKey();
                } catch (e) {
                    console.error("API key selection failed or was cancelled.", e);
                    setError("You must select a paid-tier API key to generate videos.");
                    return;
                }
            }
        } else {
             console.warn("aistudio context not available for API key check.");
        }

        setError(null);
        setIsGeneratingVirtualTour(true);
        setVirtualTourUrl(null);

        try {
            const url = await generateVirtualTourVideo(designSpec as ArchitecturalSpec);
            setVirtualTourUrl(url);
            setActiveView('virtual-tour');
        } catch (err: any) {
            if (err.message && err.message.includes("Requested entity was not found")) {
                setError("Video generation failed. Your API key might be invalid. Please try selecting a different key.");
            } else {
                reportSuspiciousActivity('VirtualTourGenerationFailed', { error: err });
                setError(err.message || 'An unknown error occurred while generating the virtual tour.');
            }
        } finally {
            setIsGeneratingVirtualTour(false);
        }
    }, [designSpec, isGeneratingVirtualTour]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e.nativeEvent) {
            return {
            x: e.nativeEvent.touches[0].clientX - rect.left,
            y: e.nativeEvent.touches[0].clientY - rect.top,
            };
        }
        return {
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawingTool) return;
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        setHasDrawing(true);

        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = drawingTool === 'pen' ? '#ef4444' : '#ffffff'; // red for pen
        ctx.lineWidth = drawingTool === 'pen' ? 3 : 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (drawingTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !drawingTool) return;
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        e.preventDefault();
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleRefineDrawing = useCallback(async () => {
        if (!refineInstruction.trim() || !technicalDrawingImageUrl || !designSpec || isRefiningDrawing || designMode !== 'product') return;

        setError(null);
        setIsRefiningDrawing(true);

        try {
            let imageToSend = technicalDrawingImageUrl;

            if (hasDrawing && drawingCanvasRef.current && imageRef.current) {
                const baseImage = imageRef.current;
                const overlayCanvas = drawingCanvasRef.current;

                const compositeCanvas = document.createElement('canvas');
                compositeCanvas.width = baseImage.naturalWidth;
                compositeCanvas.height = baseImage.naturalHeight;
                const ctx = compositeCanvas.getContext('2d');

                if (ctx) {
                    ctx.drawImage(baseImage, 0, 0);
                    ctx.drawImage(overlayCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height, 0, 0, compositeCanvas.width, compositeCanvas.height);
                    imageToSend = compositeCanvas.toDataURL('image/png');
                }
            }

            const refinedUrl = await refineTechnicalDrawingImage(refineInstruction, imageToSend, designSpec as DesignSpec);
            setTechnicalDrawingImageUrl(refinedUrl);

            setRefineInstruction('');
            setHasDrawing(false);
            const canvas = drawingCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }

        } catch (e: any) {
            reportSuspiciousActivity('DrawingRefinementFailed', { error: e });
            setError(e.message || 'An error occurred while refining the drawing.');
        } finally {
            setIsRefiningDrawing(false);
        }
    }, [refineInstruction, technicalDrawingImageUrl, designSpec, isRefiningDrawing, hasDrawing, designMode]);


    const ImageViewer = ({ src, alt }: { src: string | null, alt: string }) => (
        src ? <img src={src} alt={alt} className="max-w-full max-h-full object-contain" /> : <p className="text-slate-400">{alt} not available.</p>
    );

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">
                <LoaderIcon className="w-8 h-8 animate-spin" />
                <span className="ml-4 text-lg">Loading Session...</span>
            </div>
        );
    }

    if (!designMode) {
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

    const ActionButton = ({ icon: Icon, label, onClick, isLoading, disabled = false }: { icon: React.ElementType, label: string, onClick: () => void, isLoading: boolean, disabled?: boolean }) => (
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

    const TabButton = ({ viewId, icon: Icon, label }: { viewId: string; icon: React.ElementType; label: string; }) => (
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

    const RightPanelTabButton = ({ tabId, icon: Icon, label }: { tabId: 'spec' | 'chat' | 'history' | 'comments', icon: React.ElementType, label: string }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${activeTab === tabId ? 'bg-slate-800/50 text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
      <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
        {/* Header */}
        <header className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={resetState} className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              <MagicWandIcon className="w-6 h-6 text-sky-400" />
              AI Design Assistant
            </button>
            {designSpec && <span className="text-slate-500 font-mono text-sm hidden md:inline">/ {designSpec.name}</span>}
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
               <Share2Icon className="w-4 h-4" /> {isLinkCopied ? 'Copied!' : 'Share'}
             </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
            {/* Left Panel */}
            <div className="lg:col-span-3 bg-slate-800/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">Design Input</h2>
                </div>
                <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                    <textarea
                        className="w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-2 text-sm placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        placeholder="Describe your design..."
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
                                        <ActionButton icon={CubeIcon} label="Generate 3D Sketch" onClick={handleGenerate3dSketch} isLoading={isGenerating3dSketch} disabled={!!threeDSketchImageUrl} />
                                        <ActionButton icon={SparklesIcon} label="Generate Lifestyle Image" onClick={handleGenerateLifestyleImage} isLoading={isGeneratingLifestyleImage} disabled={!!lifestyleImageUrl} />
                                        <ActionButton icon={ExplodedViewIcon} label="Generate Exploded View" onClick={handleGenerateExplodedView} isLoading={isGeneratingExplodedView} disabled={!!explodedImageUrl} />
                                        <ActionButton icon={RulerIcon} label="Generate Technical Drawing" onClick={handleGenerateTechnicalDrawing} isLoading={isGeneratingTechnicalDrawing} disabled={!!technicalDrawingImageUrl} />
                                        <ActionButton icon={FileJsonIcon} label="Generate 3D Model (GLTF)" onClick={handleGenerateModel} isLoading={isGeneratingModel} disabled={!!gltfData} />
                                    </>
                                )}
                                {designMode === 'architecture' && (
                                    <>
                                        <ActionButton icon={BuildingIcon} label="Generate Elevation" onClick={handleGenerateElevation} isLoading={isGeneratingElevation} disabled={!!elevationImageUrl} />
                                        <ActionButton icon={LayersIcon} label="Generate Section" onClick={handleGenerateSection} isLoading={isGeneratingSection} disabled={!!sectionImageUrl} />
                                        <ActionButton icon={TableIcon} label="Generate Door/Window Schedule" onClick={handleGenerateSchedule} isLoading={isGeneratingSchedule} disabled={!!schedule} />
                                        <ActionButton icon={PaletteIcon} label="Generate Finish Schedule" onClick={handleGenerateFinishSchedule} isLoading={isGeneratingFinishSchedule} disabled={!!finishSchedule} />
                                        <ActionButton icon={FilmIcon} label="Generate Virtual Tour Video" onClick={handleGenerateVirtualTour} isLoading={isGeneratingVirtualTour} disabled={!!virtualTourUrl} />
                                    </>
                                )}
                                {designMode === 'autonomous' && (
                                    <>
                                         <ActionButton icon={Share2Icon} label="Generate Sensor Layout" onClick={handleGenerateSensorLayout} isLoading={isGeneratingSensorLayout} disabled={!!sensorLayoutImageUrl} />
                                         <ActionButton icon={CpuIcon} label="Generate System Architecture" onClick={handleGenerateSystemArchitecture} isLoading={isGeneratingSystemArchitecture} disabled={!!systemArchitectureImageUrl} />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Panel */}
            <div className="lg:col-span-6 bg-slate-800/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
                <div className="p-2 border-b border-slate-800 shrink-0">
                    <div className="flex space-x-1 overflow-x-auto custom-scrollbar pb-1">
                        {sketchImageUrl && <TabButton viewId="sketch" icon={PencilIcon} label={designMode === 'architecture' ? 'Plan' : (designMode === 'autonomous' ? 'Concept' : 'Sketch')} />}
                        {threeDSketchImageUrl && <TabButton viewId="3d-sketch" icon={CubeIcon} label="3D Sketch" />}
                        {imageUrl && <TabButton viewId="concept" icon={ImageIcon} label={designMode === 'architecture' ? 'Exterior' : 'Concept'} />}
                        {renderImageUrl && <TabButton viewId="render" icon={SparklesIcon} label={designMode === 'architecture' ? 'Interior' : 'Render'} />}
                        {lifestyleImageUrl && <TabButton viewId="lifestyle" icon={CameraIcon} label="Lifestyle" />}
                        {explodedImageUrl && <TabButton viewId="exploded" icon={ExplodedViewIcon} label="Exploded" />}
                        {technicalDrawingImageUrl && <TabButton viewId="technical-drawing" icon={RulerIcon} label="Drawing" />}
                        {elevationImageUrl && <TabButton viewId="elevation" icon={BuildingIcon} label="Elevation" />}
                        {sectionImageUrl && <TabButton viewId="section" icon={LayersIcon} label="Section" />}
                        {sensorLayoutImageUrl && <TabButton viewId="sensor-layout" icon={Share2Icon} label="Sensors" />}
                        {systemArchitectureImageUrl && <TabButton viewId="system-architecture" icon={CpuIcon} label="Architecture" />}
                        {virtualTourUrl && <TabButton viewId="virtual-tour" icon={FilmIcon} label="Tour" />}
                        {gltfData && <TabButton viewId="3d-model" icon={CubeIcon} label="3D Model" />}
                    </div>
                </div>
                <div className="flex-grow bg-slate-900/50 relative flex items-center justify-center p-2">
                    {!designSpec && !isLoading && <div className="text-slate-500">Your design visualizations will appear here.</div>}
                    {isLoading && !designSpec && <LoaderIcon className="w-8 h-8 animate-spin text-sky-500" />}

                    {activeView === 'sketch' && <ImageViewer src={sketchImageUrl} alt="Concept sketch" />}
                    {activeView === '3d-sketch' && <ImageViewer src={threeDSketchImageUrl} alt="3D sketch" />}
                    {activeView === 'concept' && <ImageViewer src={imageUrl} alt="Product concept" />}
                    {activeView === 'render' && <ImageViewer src={renderImageUrl} alt="Product render" />}
                    {activeView === 'lifestyle' && <ImageViewer src={lifestyleImageUrl} alt="Lifestyle" />}
                    {activeView === 'exploded' && <ImageViewer src={explodedImageUrl} alt="Exploded view" />}
                    {activeView === 'elevation' && <ImageViewer src={elevationImageUrl} alt="Elevation drawing" />}
                    {activeView === 'section' && <ImageViewer src={sectionImageUrl} alt="Section drawing" />}
                    {activeView === 'sensor-layout' && <ImageViewer src={sensorLayoutImageUrl} alt="Sensor layout" />}
                    {activeView === 'system-architecture' && <ImageViewer src={systemArchitectureImageUrl} alt="System architecture" />}

                    {activeView === 'technical-drawing' && (
                        technicalDrawingImageUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    ref={imageRef}
                                    src={technicalDrawingImageUrl}
                                    alt="Technical drawing"
                                    className="max-w-full max-h-full object-contain"
                                    crossOrigin="anonymous"
                                />
                                <canvas
                                    ref={drawingCanvasRef}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                      pointerEvents: drawingTool ? 'auto' : 'none',
                                      cursor: drawingTool ? 'crosshair' : 'default'
                                    }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                            </div>
                            {designMode === 'product' && (
                                <div className="absolute bottom-2 left-2 right-2 p-2 bg-slate-900/80 backdrop-blur-sm rounded-md border border-slate-700 flex flex-col md:flex-row items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <button title="Pen Tool" onClick={() => setDrawingTool(prev => prev === 'pen' ? null : 'pen')} className={`p-2 rounded-md ${drawingTool === 'pen' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><PencilIcon className="w-5 h-5" /></button>
                                        <button title="Eraser Tool" onClick={() => setDrawingTool(prev => prev === 'eraser' ? null : 'eraser')} className={`p-2 rounded-md ${drawingTool === 'eraser' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><EraserIcon className="w-5 h-5" /></button>
                                        <button
                                            title="Clear Drawing"
                                            onClick={() => {
                                                const canvas = drawingCanvasRef.current;
                                                if (canvas) {
                                                    const ctx = canvas.getContext('2d');
                                                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                                                    setHasDrawing(false);
                                                }
                                            }}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"
                                            disabled={!hasDrawing}
                                        >Clear</button>
                                    </div>
                                    <div className="flex-grow flex items-center gap-2 w-full md:w-auto">
                                        <input
                                            type="text"
                                            value={refineInstruction}
                                            onChange={(e) => setRefineInstruction(e.target.value)}
                                            placeholder="e.g., 'Make this dimension 50mm instead of 45mm'"
                                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm placeholder-slate-500 focus:ring-1 focus:ring-sky-500 outline-none"
                                        />
                                        <button onClick={handleRefineDrawing} disabled={isRefiningDrawing || !refineInstruction.trim()} className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 rounded-md text-white">
                                            {isRefiningDrawing ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SendIcon className="w-5 h-5" />}
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

            {/* Right Panel */}
            <div className="lg:col-span-3 bg-slate-800/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
                <div className="flex border-b border-slate-800 shrink-0">
                    <RightPanelTabButton tabId="spec" icon={FileCodeIcon} label="Spec" />
                    <RightPanelTabButton tabId="chat" icon={MessageSquareIcon} label="Chat" />
                    <RightPanelTabButton tabId="history" icon={HistoryIcon} label="History" />
                    <RightPanelTabButton tabId="comments" icon={MessageSquareIcon} label="Comments" />
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  {activeTab === 'spec' && (
                     <div className="p-4">
                        {designSpec ? <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">{JSON.stringify(designSpec, null, 2)}</pre> : <p className="text-slate-500 text-sm">Design specification will appear here.</p>}
                     </div>
                  )}
                  {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                       <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-sm lg:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-800 text-white' : 'bg-slate-700'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="p-3 rounded-lg bg-slate-700">
                                        <LoaderIcon className="w-5 h-5 animate-spin"/>
                                    </div>
                                </div>
                            )}
                       </div>
                       <div className="p-4 border-t border-slate-700">
                            <div className="flex items-center gap-2">
                                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleChatSubmit()} placeholder={designSpec ? "Refine the spec..." : "Generate a design first"} disabled={!designSpec || isChatLoading} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                                <button onClick={handleChatSubmit} disabled={!chatInput.trim() || isChatLoading} className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 rounded-md text-white"><SendIcon className="w-5 h-5"/></button>
                            </div>
                       </div>
                    </div>
                  )}
                  {activeTab === 'history' && (
                    <div className="p-4 space-y-2">
                        {designHistory.length > 0 ? designHistory.slice().reverse().map((version, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                                <div>
                                    <p className="text-sm font-medium">{version.name}</p>
                                    <p className="text-xs text-slate-400">{new Date(version.timestamp).toLocaleString()}</p>
                                </div>
                                <button onClick={() => loadVersion(version)} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded">Load</button>
                            </div>
                        )) : <p className="text-slate-500 text-sm">No version history yet.</p>}
                    </div>
                  )}
                   {activeTab === 'comments' && (
                    <div className="flex flex-col h-full">
                       <div className="flex-grow p-4 space-y-3 overflow-y-auto">
                           {comments.length > 0 ? comments.map((comment, index) => (
                               <div key={index} className="p-2 bg-slate-700/50 rounded-md">
                                   <p className="text-sm">{comment.text}</p>
                                   <p className="text-xs text-slate-500 text-right mt-1">{new Date(comment.timestamp).toLocaleString()}</p>
                               </div>
                           )) : <p className="text-slate-500 text-sm">No comments yet.</p>}
                       </div>
                       <div className="p-4 border-t border-slate-700">
                           <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full text-sm bg-slate-900 border border-slate-600 rounded-md p-2 h-20 outline-none focus:ring-1 focus:ring-sky-500"></textarea>
                           <button onClick={handleAddComment} className="mt-2 w-full py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm">Add Comment</button>
                       </div>
                    </div>
                   )}
                </div>
            </div>
        </main>

        {isShareModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full m-4">
                    <div className="flex items-start">
                        <div className="p-2 bg-yellow-900/50 rounded-full mr-4">
                            <AlertTriangleIcon className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Share Your Design</h3>
                            <p className="text-sm text-slate-400 mt-2">
                                Creating a shareable link will embed a compressed version of your current design data (including specs, prompts, and generated image data) directly into the URL.
                            </p>
                            <p className="text-sm text-slate-400 mt-2 font-semibold">
                                Do not share links containing sensitive or confidential information.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsShareModalOpen(false)} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md">Cancel</button>
                        <button onClick={handleConfirmShare} className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md">Confirm & Copy Link</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export default EngineeringDesignApp;
