import React, { useState, useCallback, useEffect, useRef } from 'react';
import { type Shape, type Layer, type GlobalEffects, type Scene, type Point, type VisualType, type ShapeType, type MediaItem, blendModes, type LiveStream, AudioLevels, OpacityMode } from './types';
import Header from './components/Header';
import Canvas, { VisualThumbnail } from './components/Canvas';
import Panel from './components/Panel';
import Slider from './components/Slider';
import { Icon, LAYER_COLORS, VISUALS, VISUAL_OPTIONS_CONFIG } from './constants';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});

const getDefaultVisualOptions = (visual: VisualType) => {
    const options: { [key: string]: number } = {};
    const config = VISUAL_OPTIONS_CONFIG[visual];
    if (config) {
        for (const key in config) {
            options[key] = config[key].defaultValue;
        }
    }
    return options;
}

const initialShapes: Shape[] = [
    { id: 'shape-1', type: 'polygon', points: [{x: 150, y: 150}, {x: 350, y: 150}, {x: 350, y: 350}, {x: 150, y: 350}], visual: 'dunes', rotation: 0, scale: 1, visualOptions: getDefaultVisualOptions('dunes') },
    { id: 'shape-2', type: 'polygon', points: [{x: 450, y: 200}, {x: 650, y: 200}, {x: 550, y: 400}], visual: 'caustics', rotation: 0, scale: 1, visualOptions: getDefaultVisualOptions('caustics') }
];

const initialLayers: Layer[] = [
    { id: 'layer-1', shapeId: 'shape-1', name: 'Main Square', opacity: 1, blendMode: 'normal', visible: true, color: LAYER_COLORS[0], opacityMode: 'static' },
    { id: 'layer-2', shapeId: 'shape-2', name: 'Accent Triangle', opacity: 0.8, blendMode: 'screen', visible: true, color: LAYER_COLORS[1], opacityMode: 'static' }
];

const initialEffects: GlobalEffects = { blur: 0, brightness: 100, contrast: 100, hueRotate: 0, saturate: 100 };

interface ProjectState {
    shapes: Shape[];
    layers: Layer[];
    effects: GlobalEffects;
}

const useHistory = (initialState: ProjectState) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = history[currentIndex];

    const setState = useCallback((value: ProjectState | ((prevState: ProjectState) => ProjectState), commit: boolean = true) => {
        const newState = typeof value === 'function' ? (value as (prevState: ProjectState) => ProjectState)(state) : value;
        
        if (JSON.stringify(newState) === JSON.stringify(state)) return;

        if (commit) {
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(newState);
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
        } else {
            const newHistory = [...history];
            newHistory[currentIndex] = newState;
            setHistory(newHistory);
        }
    }, [history, currentIndex, state]);

    const undo = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex(c => c - 1);
    }, [currentIndex]);
    
    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) setCurrentIndex(c => c + 1);
    }, [currentIndex, history.length]);

    return {
        state,
        setState,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1
    };
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left flex items-center justify-between py-2 px-1 text-sm font-semibold text-gray-300 hover:bg-gray-700/50 rounded">
                <span>{title}</span>
                <Icon icon="chevronDown" className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && <div className="pt-2 pb-1">{children}</div>}
        </div>
    );
};

const MaterialsPanel: React.FC<{
    selectedShape: Shape;
    onVisualChange: (visualType: VisualType, options?: { mediaUrl?: string, liveStreamId?: string }) => void;
    mediaLibrary: MediaItem[];
    liveStreams: LiveStream[];
    onGenerate: (prompt: string) => void;
    isGenerating: boolean;
}> = ({ selectedShape, onVisualChange, mediaLibrary, liveStreams, onGenerate, isGenerating }) => {
    const [prompt, setPrompt] = useState('');

    return (
        <Panel title="Materials" flex>
            <div className="h-full overflow-y-auto pr-1">
                 <CollapsibleSection title="AI Generation" defaultOpen={true}>
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'flowing lava', 'starry night'"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            rows={2}
                        />
                        <button
                            onClick={() => onGenerate(prompt)}
                            disabled={!prompt || isGenerating}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            <Icon icon="sparkles" className="w-4 h-4" />
                            <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
                        </button>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Generative">
                    <div className="grid grid-cols-3 gap-2">
                        {VISUALS.map(v => (
                            <VisualThumbnail 
                                key={v.id} 
                                visual={v} 
                                isSelected={selectedShape.visual === v.id}
                                onClick={() => onVisualChange(v.id)}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
                
                {mediaLibrary.length > 0 && (
                    <CollapsibleSection title="Media Library">
                        <div className="grid grid-cols-3 gap-2">
                            {mediaLibrary.map(m => (
                                <VisualThumbnail
                                    key={m.id}
                                    visual={{id: 'media', name: m.name}}
                                    mediaUrl={m.url}
                                    isSelected={selectedShape.mediaUrl === m.url}
                                    onClick={() => onVisualChange('media', { mediaUrl: m.url })}
                                />
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {liveStreams.length > 0 && (
                     <CollapsibleSection title="Live Inputs">
                        <div className="grid grid-cols-3 gap-2">
                            {liveStreams.map(ls => (
                                <VisualThumbnail
                                    key={ls.id}
                                    visual={{id: 'live-input', name: ls.name}}
                                    stream={ls.stream}
                                    isSelected={selectedShape.liveStreamId === ls.id}
                                    onClick={() => onVisualChange('live-input', { liveStreamId: ls.id })}
                                />
                            ))}
                        </div>
                    </CollapsibleSection>
                )}
            </div>
        </Panel>
    )
}

const VisualsPanel: React.FC<{
    selectedShape: Shape;
    onOptionChange: (option: string, value: number, commit: boolean) => void;
}> = ({ selectedShape, onOptionChange }) => {
    const config = VISUAL_OPTIONS_CONFIG[selectedShape.visual];
    if (!config) return null;

    const visualName = VISUALS.find(v => v.id === selectedShape.visual)?.name || 'Visual';

    return (
        <Panel title={`${visualName} Options`}>
            {Object.keys(config).map((key) => {
                const optionConfig = config[key];
                return (
                    <Slider
                        key={key}
                        label={optionConfig.label}
                        min={optionConfig.min}
                        max={optionConfig.max}
                        step={optionConfig.step}
                        value={selectedShape.visualOptions?.[key] ?? optionConfig.defaultValue}
                        onChange={(value) => onOptionChange(key, value, false)}
                        onCommit={(value) => onOptionChange(key, value, true)}
                    />
                );
            })}
        </Panel>
    );
};

type TemplateType = ShapeType | 'star' | 'hexagon' | 'arrow';

const App: React.FC = () => {
    const { state: projectState, setState: setProjectState, undo, redo, canUndo, canRedo } = useHistory({ shapes: initialShapes, layers: initialLayers, effects: initialEffects });
    const { shapes, layers, effects } = projectState;
    
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-1');
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
    const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
    const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [audioLevels, setAudioLevels] = useState<AudioLevels>({ bass: 0, mids: 0, highs: 0 });
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const setupAudio = async () => {
        if (audioContextRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = context.createMediaStreamSource(stream);
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            audioContextRef.current = context;
            analyserRef.current = analyser;

            const audioProcessingLoop = () => {
                if (analyserRef.current) {
                    const bufferLength = analyserRef.current.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    const bass = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5 / 255 * 100;
                    const mids = dataArray.slice(5, 50).reduce((a, b) => a + b, 0) / 45 / 255 * 100;
                    const highs = dataArray.slice(50, bufferLength).reduce((a, b) => a + b, 0) / (bufferLength - 50) / 255 * 100;
                    
                    setAudioLevels({ bass, mids, highs });
                }
                animationFrameRef.current = requestAnimationFrame(audioProcessingLoop);
            };
            audioProcessingLoop();

        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };
    
    useEffect(() => {
        setupAudio();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            audioContextRef.current?.close();
        };
    }, []);

    useEffect(() => {
        setSelectedPointIndex(null);
    }, [selectedLayerId]);

    const updateShape = useCallback((id: string, newProps: Partial<Shape>, commit: boolean = true) => {
        setProjectState(p => ({ ...p, shapes: p.shapes.map(s => s.id === id ? { ...s, ...newProps } : s)}), commit);
    }, [setProjectState]);
    
    const updateShapePoints = useCallback((id: string, newPoints: Point[], commit: boolean = true) => {
        setProjectState(p => ({ ...p, shapes: p.shapes.map(s => s.id === id ? { ...s, points: newPoints } : s)}), commit);
    }, [setProjectState]);

    const addShape = useCallback((type: TemplateType) => {
        const newShapeId = `shape-${Date.now()}`;
        let newShape: Shape;
        let name = type.charAt(0).toUpperCase() + type.slice(1);
        const baseShapeProps = { rotation: 0, scale: 1 };
        const center = { x: 300, y: 300 };

        const createShape = (type: ShapeType, points: Point[], visual: VisualType): Shape => ({
            id: newShapeId, type, points, visual, ...baseShapeProps, visualOptions: getDefaultVisualOptions(visual)
        });

        switch(type) {
            case 'rect':
                newShape = createShape('rect', [{x: 200, y: 200}, {x: 400, y: 350}], 'gradient-color');
                break;
            case 'circle':
                newShape = createShape('circle', [{x: 300, y: 300}, {x: 400, y: 300}], 'sphere');
                break;
            case 'polygon':
                newShape = createShape('polygon', [{x: 200, y: 200}, {x: 400, y: 200}, {x: 300, y: 350}], 'grid');
                break;
            case 'hexagon': {
                const r = 100;
                const points: Point[] = Array.from({ length: 6 }).map((_, i) => ({
                    x: Math.round(center.x + r * Math.cos(i * Math.PI / 3)),
                    y: Math.round(center.y + r * Math.sin(i * Math.PI / 3)),
                }));
                newShape = createShape('polygon', points, 'line-patterns');
                break;
            }
            case 'star': {
                const r1 = 120, r2 = 50, n = 5;
                const points: Point[] = [];
                for (let i = 0; i < n * 2; i++) {
                    const r = i % 2 === 0 ? r1 : r2;
                    const angle = (i * Math.PI / n) - (Math.PI / 2);
                    points.push({
                        x: Math.round(center.x + r * Math.cos(angle)),
                        y: Math.round(center.y + r * Math.sin(angle)),
                    });
                }
                newShape = createShape('polygon', points, 'fractal');
                break;
            }
            case 'arrow': {
                const w = 150, h = 100;
                const points: Point[] = [
                    { x: center.x - w/2, y: center.y - h/4 }, { x: center.x, y: center.y - h/4 },
                    { x: center.x, y: center.y - h/2 }, { x: center.x + w/2, y: center.y },
                    { x: center.x, y: center.y + h/2 }, { x: center.x, y: center.y + h/4 },
                    { x: center.x - w/2, y: center.y + h/4 },
                ];
                newShape = createShape('polygon', points, 'siren');
                break;
            }
            default: return;
        }

        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            shapeId: newShapeId,
            name: `${name} Layer`,
            opacity: 1,
            blendMode: 'normal',
            visible: true,
            color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
            opacityMode: 'static',
            opacityParams: { min: 0, max: 100, speed: 1, sensitivity: 1 },
        }
        setProjectState(p => ({...p, shapes: [...p.shapes, newShape], layers: [...p.layers, newLayer]}));
        setSelectedLayerId(newLayer.id);
    }, [layers.length, setProjectState]);
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newMediaItem: MediaItem = {
                id: `media-${Date.now()}`,
                name: file.name,
                url,
                type: file.type.startsWith('video') ? 'video' : 'image',
            };
            setMediaLibrary(prev => [...prev, newMediaItem]);
            
            const newShapeId = `shape-${Date.now()}`;
            const newShape: Shape = { id: newShapeId, type: 'rect', points: [{x: 150, y: 150}, {x: 450, y: 350}], visual: 'media', mediaUrl: url, rotation: 0, scale: 1 };
            const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                shapeId: newShapeId,
                name: file.name,
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
                opacityMode: 'static',
            };
            setProjectState(p => ({...p, shapes: [...p.shapes, newShape], layers: [...p.layers, newLayer]}));
            setSelectedLayerId(newLayer.id);
        }
    };
    
    const addLiveInput = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newLiveStream: LiveStream = {
                id: `live-${Date.now()}`,
                name: `Camera ${liveStreams.length + 1}`,
                stream,
            };
            setLiveStreams(prev => [...prev, newLiveStream]);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) { redo(); } else { undo(); }
                    return;
                }
                if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    redo();
                    return;
                }
            }

            if (isDrawing) {
                if (e.key === 'Escape') {
                    setIsDrawing(false);
                    setDrawingPoints([]);
                }
                return;
            }
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT' || document.activeElement?.tagName === 'TEXTAREA') return;
            switch(e.key.toLowerCase()) {
                case 'r': addShape('rect'); break;
                case 'c': addShape('circle'); break;
                case 'p': addShape('polygon'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addShape, isDrawing, undo, redo]);
    
    const completeDrawing = useCallback(() => {
        if (drawingPoints.length > 2) {
            const newShapeId = `shape-${Date.now()}`;
            const visual: VisualType = 'grid';
            const newShape: Shape = { id: newShapeId, type: 'polygon', points: drawingPoints, visual, rotation: 0, scale: 1, visualOptions: getDefaultVisualOptions(visual) };
            const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                shapeId: newShapeId,
                name: `Custom Polygon`,
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
                opacityMode: 'static'
            };
            setProjectState(p => ({...p, shapes: [...p.shapes, newShape], layers: [...p.layers, newLayer]}));
            setSelectedLayerId(newLayer.id);
        }
        setDrawingPoints([]);
        setIsDrawing(false);
    }, [drawingPoints, layers.length, setProjectState]);

    const toggleDrawingMode = () => {
        if (isDrawing) {
            completeDrawing();
        } else {
            setIsDrawing(true);
            setDrawingPoints([]);
            setSelectedLayerId(null);
        }
    };

    const handleCanvasClick = (point: Point) => {
        if (isDrawing) {
            setDrawingPoints(prev => [...prev, point]);
        } else {
            setSelectedPointIndex(null);
        }
    };

    const updateLayer = (id: string, newProps: Partial<Layer>, commit: boolean = true) => {
        setProjectState(p => ({...p, layers: p.layers.map(l => l.id === id ? {...l, ...newProps} : l)}), commit);
    };

    const deleteLayer = (id: string) => {
        const layerToDelete = layers.find(l => l.id === id);
        if (!layerToDelete) return;

        setProjectState(p => ({...p, 
            layers: p.layers.filter(l => l.id !== id),
            shapes: p.shapes.filter(s => s.id !== layerToDelete.shapeId)
        }));
        
        if (selectedLayerId === id) {
            setSelectedLayerId(layers.length > 1 ? layers.filter(l => l.id !== id)[0].id : null);
        }
    }

    const saveScene = () => {
        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            name: `Scene ${scenes.length + 1}`,
            shapes,
            layers,
            effects,
        };
        setScenes(prev => [...prev, newScene]);
    };

    const loadScene = (id: string) => {
        const scene = scenes.find(s => s.id === id);
        if (scene) {
            setProjectState({ shapes: scene.shapes, layers: scene.layers, effects: scene.effects }, true);
        }
    };
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    const selectedShape = shapes.find(s => s.id === selectedLayer?.shapeId);

    const handleVisualChange = (shapeId: string, visual: VisualType, options: { mediaUrl?: string, liveStreamId?: string } = {}) => {
        updateShape(shapeId, {
            visual,
            visualOptions: getDefaultVisualOptions(visual),
            mediaUrl: visual === 'media' ? options.mediaUrl : undefined,
            liveStreamId: visual === 'live-input' ? options.liveStreamId : undefined,
        });
    };

    const handleVisualOptionChange = (option: string, value: number, commit: boolean) => {
        if (!selectedShape) return;
        const newOptions = { ...selectedShape.visualOptions, [option]: value };
        updateShape(selectedShape.id, { visualOptions: newOptions }, commit);
    };

    const handleGenerateVisual = async (prompt: string, shapeId: string) => {
        if (!prompt || !shapeId) return;
        setIsGenerating(true);

        const configurableVisuals = Object.keys(VISUAL_OPTIONS_CONFIG);
        const visualInfo = configurableVisuals.map(visual => {
            const params = VISUAL_OPTIONS_CONFIG[visual as VisualType];
            if (!params) return '';
            const paramDescriptions = Object.entries(params).map(([key, config]) => 
                `- ${key} (a number between ${config.min} and ${config.max}, typically around ${config.defaultValue})`
            ).join('\n');
            return `For a "${visual}" effect:\n${paramDescriptions}`;
        }).join('\n\n');

        const systemInstruction = `You are a creative assistant for a projection mapping application. Your task is to translate a user's text prompt into a configuration for one of the available generative visuals.

Analyze the prompt and respond with a single JSON object matching this schema: { "visual": "visual_name", "visualOptions": { "param1": value1, "param2": value2 } }.

Choose the visual that best matches the prompt's theme and set its parameters to creatively interpret the user's request. Be artistic with the values, but stay within the specified ranges.

Available visuals and their parameters:

${visualInfo}

For example, if the prompt is "gentle ocean waves", a good response might be:
{
  "visual": "dunes",
  "visualOptions": {
    "frequencyX": 0.02,
    "frequencyY": 0.1,
    "octaves": 2
  }
}

Only respond with the JSON object. Do not include any other text or markdown formatting.`;
        
        const propertiesForSchema: {[key: string]: { type: Type }} = {};
        Object.values(VISUAL_OPTIONS_CONFIG).forEach(config => {
            if (config) {
                Object.keys(config).forEach(paramKey => {
                    propertiesForSchema[paramKey] = { type: Type.NUMBER };
                });
            }
        });

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                visual: {
                    type: Type.STRING,
                    enum: configurableVisuals,
                },
                visualOptions: {
                    type: Type.OBJECT,
                    properties: propertiesForSchema
                }
            },
            required: ['visual', 'visualOptions']
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate a visual for this prompt: "${prompt}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    systemInstruction: systemInstruction,
                }
            });
            
            const result = JSON.parse(response.text);
            
            if (result.visual && VISUAL_OPTIONS_CONFIG[result.visual as VisualType]) {
                const newVisual = result.visual as VisualType;
                const defaultOptions = getDefaultVisualOptions(newVisual);
                const newOptions = { ...defaultOptions, ...result.visualOptions };

                updateShape(shapeId, { visual: newVisual, visualOptions: newOptions });
            } else {
                console.error("Invalid visual returned from AI:", result);
                alert("The AI returned an invalid visual type. Please try a different prompt.");
            }
        } catch (error) {
            console.error("Error generating visual with Gemini:", error);
            alert("There was an error generating the visual. Please check the console for details.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handlePointUpdate = (coord: 'x' | 'y', value: number, commit: boolean) => {
        if (!selectedShape || selectedPointIndex === null) return;
        const newPoints = [...selectedShape.points];
        newPoints[selectedPointIndex] = { ...newPoints[selectedPointIndex], [coord]: value };
        updateShapePoints(selectedShape.id, newPoints, commit);
    };

    return (
        <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
            <Header onUploadClick={() => fileInputRef.current?.click()} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
            <div className="flex-grow grid grid-cols-12 grid-rows-1 gap-2 p-2 h-full overflow-hidden">
                
                <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
                    {selectedShape ? (
                         <MaterialsPanel 
                            selectedShape={selectedShape}
                            onVisualChange={(visual, options) => handleVisualChange(selectedShape.id, visual, options)}
                            mediaLibrary={mediaLibrary}
                            liveStreams={liveStreams}
                            onGenerate={(prompt) => handleGenerateVisual(prompt, selectedShape.id)}
                            isGenerating={isGenerating}
                         />
                    ) : (
                        <Panel title="Materials">
                            <p className="text-sm text-gray-400">Select a layer to see material options.</p>
                        </Panel>
                    )}
                    <Panel title="Layers" flex>
                        <div className="flex flex-col h-full">
                            <div className="flex-grow space-y-2 overflow-y-auto pr-1">
                                {layers.map(layer => (
                                    <div 
                                        key={layer.id} 
                                        onClick={() => setSelectedLayerId(layer.id)} 
                                        onContextMenu={(e) => { e.preventDefault(); setRenamingLayerId(layer.id); }}
                                        className={`p-2 rounded cursor-pointer transition-colors border-l-4 ${selectedLayerId === layer.id ? 'bg-indigo-600/30' : 'bg-gray-700 hover:bg-gray-600'}`} 
                                        style={{ borderColor: selectedLayerId === layer.id ? layer.color : 'transparent' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }}></div>
                                                {renamingLayerId === layer.id ? (
                                                    <input
                                                        type="text"
                                                        defaultValue={layer.name}
                                                        className="bg-gray-900 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full"
                                                        autoFocus
                                                        onClick={e => e.stopPropagation()}
                                                        onBlur={(e) => {
                                                            updateLayer(layer.id, { name: e.target.value });
                                                            setRenamingLayerId(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                updateLayer(layer.id, { name: e.currentTarget.value });
                                                                setRenamingLayerId(null);
                                                            } else if (e.key === 'Escape') {
                                                                setRenamingLayerId(null);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="font-semibold">{layer.name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible })}}>
                                                    <Icon icon={layer.visible ? 'eye' : 'eyeSlash'} className="w-5 h-5"/>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id)}}>
                                                    <Icon icon="trash" className="w-5 h-5 text-red-400"/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 pl-4">{shapes.find(s => s.id === layer.shapeId)?.type}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2">
                                <button onClick={() => addShape('rect')} className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150">
                                    <Icon icon="plus" className="w-4 h-4" />
                                    <span>Add Layer</span>
                                </button>
                            </div>
                        </div>
                    </Panel>
                     <Panel title="Create">
                        <div className="grid grid-cols-4 gap-2">
                           <button onClick={() => addShape('rect')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="rectangle" className="w-5 h-5"/>Rect</button>
                           <button onClick={() => addShape('circle')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="circle" className="w-5 h-5"/>Circle</button>
                           <button onClick={() => addShape('polygon')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="polygon" className="w-5 h-5"/>Poly</button>
                           <button onClick={toggleDrawingMode} className={`flex flex-col items-center justify-center gap-1 rounded p-2 text-sm transition-colors duration-150 text-center ${isDrawing ? 'bg-indigo-500' : 'bg-gray-700 hover:bg-indigo-500'}`}><Icon icon="line" className="w-5 h-5"/>Line</button>
                           <button onClick={() => addShape('star')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="star" className="w-5 h-5"/>Star</button>
                           <button onClick={() => addShape('hexagon')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="hexagon" className="w-5 h-5"/>Hex</button>
                           <button onClick={() => addShape('arrow')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="arrow" className="w-5 h-5"/>Arrow</button>
                        </div>
                    </Panel>
                    <Panel title="Live Sources">
                         <button onClick={addLiveInput} className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150">
                            <Icon icon="plus" className="w-4 h-4" />
                            <span>Add Camera</span>
                        </button>
                    </Panel>
                </div>

                <div className="col-span-6 flex flex-col gap-2 h-full">
                    <Panel title="Projection Output" flex>
                       <Canvas 
                         shapes={shapes} 
                         layers={layers}
                         liveStreams={liveStreams} 
                         effects={effects}
                         audioLevels={audioLevels}
                         analyserRef={analyserRef}
                         updateShapePoints={(id, points, commit) => updateShapePoints(id, points, commit)}
                         onInteractionEnd={() => setProjectState(projectState, true)}
                         selectedShapeId={selectedShape?.id || null} 
                         selectedLayerColor={selectedLayer?.color}
                         isDrawing={isDrawing}
                         drawingPoints={drawingPoints}
                         onCanvasClick={handleCanvasClick}
                         onDrawingFinish={completeDrawing}
                         selectedPointIndex={selectedPointIndex}
                         onPointSelect={setSelectedPointIndex}
                        />
                    </Panel>
                </div>

                <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
                    {selectedLayer && selectedShape && (
                        <>
                         <Panel title={`Edit: ${selectedLayer.name}`}>
                             <Slider label="Rotation" value={selectedShape.rotation || 0} max={360} onChange={v => updateShape(selectedShape.id, { rotation: v }, false)} onCommit={v => updateShape(selectedShape.id, { rotation: v }, true)} />
                             <Slider label="Size" value={(selectedShape.scale || 1) * 100} min={10} max={300} onChange={v => updateShape(selectedShape.id, { scale: v / 100 }, false)} onCommit={v => updateShape(selectedShape.id, { scale: v / 100 }, true)} />
                             <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-400">Blend Mode</label>
                                <select value={selectedLayer.blendMode} onChange={e => updateLayer(selectedLayer.id, { blendMode: e.target.value as any })} className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    {blendModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-400">Opacity Mode</label>
                                <select value={selectedLayer.opacityMode || 'static'} onChange={e => updateLayer(selectedLayer.id, { opacityMode: e.target.value as OpacityMode })} className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="static">Static</option><option value="pulse">Pulse</option><option value="audio-bass">Audio (Bass)</option><option value="audio-mids">Audio (Mids)</option><option value="audio-highs">Audio (Highs)</option>
                                </select>
                             </div>
                             {(selectedLayer.opacityMode === 'static') && <Slider label="Opacity" value={selectedLayer.opacity * 100} onChange={v => updateLayer(selectedLayer.id, { opacity: v / 100 }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacity: v/100}, true)} />}
                             {(selectedLayer.opacityMode === 'pulse') && (<>
                                <Slider label="Speed" value={selectedLayer.opacityParams?.speed ?? 1} min={0.1} max={10} step={0.1} onChange={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, speed: v} }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, speed: v} }, true)} />
                                <Slider label="Min Opacity" value={selectedLayer.opacityParams?.min ?? 0} onChange={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, min: v} }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, min: v} }, true)} />
                                <Slider label="Max Opacity" value={selectedLayer.opacityParams?.max ?? 100} onChange={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, max: v} }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, max: v} }, true)} />
                             </>)}
                             {(selectedLayer.opacityMode?.startsWith('audio')) && (<>
                                <Slider label="Sensitivity" value={selectedLayer.opacityParams?.sensitivity ?? 1} min={0.1} max={5} step={0.1} onChange={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, sensitivity: v} }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, sensitivity: v} }, true)} />
                                <Slider label="Min Opacity" value={selectedLayer.opacityParams?.min ?? 0} onChange={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, min: v} }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, min: v} }, true)} />
                                <Slider label="Max Opacity" value={selectedLayer.opacityParams?.max ?? 100} onChange={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, max: v} }, false)} onCommit={v => updateLayer(selectedLayer.id, { opacityParams: {...selectedLayer.opacityParams, max: v} }, true)} />
                             </>)}
                         </Panel>
                         <VisualsPanel
                            selectedShape={selectedShape}
                            onOptionChange={handleVisualOptionChange}
                         />
                         {selectedPointIndex !== null && selectedShape.points[selectedPointIndex] && (
                            <Panel title={`Point ${selectedPointIndex + 1} Properties`}>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-400">X</label>
                                        <input 
                                            type="number" 
                                            value={selectedShape.points[selectedPointIndex].x.toFixed(0)}
                                            onChange={(e) => handlePointUpdate('x', parseFloat(e.target.value), false)}
                                            onBlur={(e) => handlePointUpdate('x', parseFloat(e.target.value), true)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-400">Y</label>
                                        <input 
                                            type="number" 
                                            value={selectedShape.points[selectedPointIndex].y.toFixed(0)}
                                            onChange={(e) => handlePointUpdate('y', parseFloat(e.target.value), false)}
                                            onBlur={(e) => handlePointUpdate('y', parseFloat(e.target.value), true)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            </Panel>
                         )}
                        </>
                    )}
                    <Panel title="Global Effects">
                        <Slider label="Blur" value={effects.blur} max={20} onChange={v => setProjectState(p => ({...p, effects: {...p.effects, blur: v}}), false)} onCommit={v => setProjectState(p => ({...p, effects: {...p.effects, blur: v}}), true)} />
                        <Slider label="Brightness" value={effects.brightness} max={200} onChange={v => setProjectState(p => ({...p, effects: {...p.effects, brightness: v}}), false)} onCommit={v => setProjectState(p => ({...p, effects: {...p.effects, brightness: v}}), true)} />
                        <Slider label="Contrast" value={effects.contrast} max={200} onChange={v => setProjectState(p => ({...p, effects: {...p.effects, contrast: v}}), false)} onCommit={v => setProjectState(p => ({...p, effects: {...p.effects, contrast: v}}), true)} />
                        <Slider label="Hue" value={effects.hueRotate} max={360} onChange={v => setProjectState(p => ({...p, effects: {...p.effects, hueRotate: v}}), false)} onCommit={v => setProjectState(p => ({...p, effects: {...p.effects, hueRotate: v}}), true)} />
                        <Slider label="Saturate" value={effects.saturate} max={200} onChange={v => setProjectState(p => ({...p, effects: {...p.effects, saturate: v}}), false)} onCommit={v => setProjectState(p => ({...p, effects: {...p.effects, saturate: v}}), true)} />
                    </Panel>
                    <Panel title="Audio Reactivity">
                         <div className="flex items-end h-24 gap-2">
                             <div className="flex-1 bg-gray-700 rounded-t-sm transition-all duration-75" style={{ height: `${audioLevels.bass}%`, background: 'linear-gradient(to top, #4f46e5, #a5b4fc)' }} />
                             <div className="flex-1 bg-gray-700 rounded-t-sm transition-all duration-75" style={{ height: `${audioLevels.mids}%`, background: 'linear-gradient(to top, #0891b2, #67e8f9)' }} />
                             <div className="flex-1 bg-gray-700 rounded-t-sm transition-all duration-75" style={{ height: `${audioLevels.highs}%`, background: 'linear-gradient(to top, #db2777, #f9a8d4)' }} />
                         </div>
                         <div className="flex justify-between text-xs mt-1 text-gray-400"><span>BASS</span><span>MIDS</span><span>HIGHS</span></div>
                    </Panel>
                     <Panel title="Performance">
                        <div className="flex items-center gap-2">
                            <button onClick={saveScene} className="flex-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150">Save Scene</button>
                            <select onChange={e => loadScene(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option>Load Scene</option>
                                {scenes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
};

export default App;