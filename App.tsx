import React, { useState, useCallback, useEffect, useRef } from 'react';
import { type Shape, type Layer, type GlobalEffects, type Scene, type Point, type VisualType, type ShapeType, type MediaItem, blendModes } from './types';
import Header from './components/Header';
import Canvas from './components/Canvas';
import Panel from './components/Panel';
import Slider from './components/Slider';
import { Icon, LAYER_COLORS } from './constants';

const initialShapes: Shape[] = [
    { id: 'shape-1', type: 'polygon', points: [{x: 150, y: 150}, {x: 350, y: 150}, {x: 350, y: 350}, {x: 150, y: 350}], visual: 'gradient-purple' },
    { id: 'shape-2', type: 'polygon', points: [{x: 450, y: 200}, {x: 650, y: 200}, {x: 550, y: 400}], visual: 'grid' }
];

const initialLayers: Layer[] = [
    { id: 'layer-1', shapeId: 'shape-1', name: 'Main Square', opacity: 1, blendMode: 'normal', visible: true, color: LAYER_COLORS[0] },
    { id: 'layer-2', shapeId: 'shape-2', name: 'Accent Triangle', opacity: 0.8, blendMode: 'screen', visible: true, color: LAYER_COLORS[1] }
];

const initialEffects: GlobalEffects = { blur: 0, brightness: 100, contrast: 100, hueRotate: 0, saturate: 100 };

const App: React.FC = () => {
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [layers, setLayers] = useState<Layer[]>(initialLayers);
    const [effects, setEffects] = useState<GlobalEffects>(initialEffects);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-1');
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [audioLevels, setAudioLevels] = useState({ bass: 50, mids: 30, highs: 70 });

    useEffect(() => {
        const interval = setInterval(() => {
            setAudioLevels({
                bass: Math.random() * 100,
                mids: Math.random() * 100,
                highs: Math.random() * 100,
            });
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const updateShape = useCallback((id: string, newProps: Partial<Shape>) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, ...newProps } : s));
    }, []);
    
    const updateShapePoints = useCallback((id: string, newPoints: Point[]) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, points: newPoints } : s));
    }, []);

    const addShape = (type: ShapeType) => {
        const newShapeId = `shape-${Date.now()}`;
        let newShape: Shape;

        switch(type) {
            case 'rect':
                newShape = { id: newShapeId, type: 'rect', points: [{x: 200, y: 200}, {x: 400, y: 350}], visual: 'gradient-blue' };
                break;
            case 'circle':
                newShape = { id: newShapeId, type: 'circle', points: [{x: 300, y: 300}, {x: 400, y: 300}], visual: 'gradient-purple' };
                break;
            case 'polygon':
            default:
                newShape = { id: newShapeId, type: 'polygon', points: [{x: 200, y: 200}, {x: 400, y: 200}, {x: 300, y: 350}], visual: 'grid' };
                break;
        }

        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            shapeId: newShapeId,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
            opacity: 1,
            blendMode: 'normal',
            visible: true,
            color: LAYER_COLORS[layers.length % LAYER_COLORS.length]
        }
        setShapes(prev => [...prev, newShape]);
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };
    
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
            
            // Add a shape for the new media
            const newShapeId = `shape-${Date.now()}`;
            const newShape: Shape = { id: newShapeId, type: 'rect', points: [{x: 150, y: 150}, {x: 450, y: 350}], visual: 'media', mediaUrl: url };
            const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                shapeId: newShapeId,
                name: file.name,
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                color: LAYER_COLORS[layers.length % LAYER_COLORS.length]
            };
            setShapes(prev => [...prev, newShape]);
            setLayers(prev => [...prev, newLayer]);
            setSelectedLayerId(newLayer.id);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
            switch(e.key.toLowerCase()) {
                case 'r': addShape('rect'); break;
                case 'c': addShape('circle'); break;
                case 'p': addShape('polygon'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addShape]);

    const updateLayer = (id: string, newProps: Partial<Layer>) => {
        setLayers(prev => prev.map(l => l.id === id ? {...l, ...newProps} : l));
    };

    const deleteLayer = (id: string) => {
        const layerToDelete = layers.find(l => l.id === id);
        if (!layerToDelete) return;

        setLayers(prev => prev.filter(l => l.id !== id));
        setShapes(prev => prev.filter(s => s.id !== layerToDelete.shapeId));
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
            setShapes(scene.shapes);
            setLayers(scene.layers);
            setEffects(scene.effects);
        }
    };
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    const selectedShape = shapes.find(s => s.id === selectedLayer?.shapeId);

    // FIX: Widen the type for generative visuals to include optional mediaUrl property.
    // This ensures all items in `allVisuals` have a consistent shape, preventing type errors.
    const generativeVisuals: { name: string, type: VisualType, mediaUrl?: string }[] = [
        { name: "Purple Haze", type: 'gradient-purple' },
        { name: "Blue Plasma", type: 'gradient-blue' },
        { name: "Dot Matrix", type: 'dots' },
        { name: "Grid Lines", type: 'grid' },
        { name: "Fractal Noise", type: 'fractal' },
        { name: "Particle Flow", type: 'particles' },
    ];
    
    const allVisuals = [
        ...generativeVisuals,
        ...mediaLibrary.map(m => ({ name: m.name, type: 'media' as VisualType, mediaUrl: m.url }))
    ];

    const handleVisualChange = (shapeId: string, visualValue: string) => {
        const selectedVisual = allVisuals.find(v => (v.type === 'media' ? v.mediaUrl : v.type) === visualValue);
        if (selectedVisual) {
            updateShape(shapeId, {
                visual: selectedVisual.type,
                mediaUrl: selectedVisual.type === 'media' ? selectedVisual.mediaUrl : undefined
            });
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
            <Header onUploadClick={() => fileInputRef.current?.click()} />
            <div className="flex-grow grid grid-cols-12 grid-rows-1 gap-2 p-2 h-full overflow-hidden">
                
                <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
                    <Panel title="Create">
                        <div className="grid grid-cols-3 gap-2">
                           <button onClick={() => addShape('rect')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="rectangle" className="w-5 h-5"/>Rect</button>
                           <button onClick={() => addShape('circle')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="circle" className="w-5 h-5"/>Circle</button>
                           <button onClick={() => addShape('polygon')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="polygon" className="w-5 h-5"/>Polygon</button>
                        </div>
                    </Panel>
                    <Panel title="Layers" flex>
                        <div className="flex-grow space-y-2 overflow-y-auto">
                        {layers.map(layer => (
                            <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`p-2 rounded cursor-pointer transition-colors border-l-4 ${selectedLayerId === layer.id ? 'bg-indigo-600/30' : 'bg-gray-700 hover:bg-gray-600'}`} style={{ borderColor: selectedLayerId === layer.id ? layer.color : 'transparent' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }}></div>
                                        <span className="font-semibold">{layer.name}</span>
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
                    </Panel>
                </div>

                <div className="col-span-6 flex flex-col gap-2 h-full">
                    <Panel title="Projection Output" flex>
                       <Canvas shapes={shapes} layers={layers} effects={effects} updateShapePoints={updateShapePoints} selectedShapeId={selectedShape?.id || null} selectedLayerColor={selectedLayer?.color} />
                    </Panel>
                </div>

                <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
                    {selectedLayer && selectedShape && (
                         <Panel title={`Edit: ${selectedLayer.name}`}>
                             <Slider label="Opacity" value={selectedLayer.opacity * 100} onChange={v => updateLayer(selectedLayer.id, { opacity: v / 100 })} />
                             <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-400">Visual Source</label>
                                <select value={selectedShape.visual === 'media' ? selectedShape.mediaUrl : selectedShape.visual} onChange={e => handleVisualChange(selectedShape.id, e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <optgroup label="Generative">
                                        {generativeVisuals.map(v => <option key={v.type} value={v.type}>{v.name}</option>)}
                                    </optgroup>
                                    {mediaLibrary.length > 0 && <optgroup label="Media">
                                        {mediaLibrary.map(m => <option key={m.id} value={m.url}>{m.name}</option>)}
                                    </optgroup>}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-400">Blend Mode</label>
                                <select value={selectedLayer.blendMode} onChange={e => updateLayer(selectedLayer.id, { blendMode: e.target.value as any })} className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    {blendModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                             </div>
                         </Panel>
                    )}
                    <Panel title="Global Effects">
                        <Slider label="Blur" value={effects.blur} max={20} onChange={v => setEffects(e => ({...e, blur: v}))} />
                        <Slider label="Brightness" value={effects.brightness} max={200} onChange={v => setEffects(e => ({...e, brightness: v}))} />
                        <Slider label="Contrast" value={effects.contrast} max={200} onChange={v => setEffects(e => ({...e, contrast: v}))} />
                        <Slider label="Hue" value={effects.hueRotate} max={360} onChange={v => setEffects(e => ({...e, hueRotate: v}))} />
                        <Slider label="Saturate" value={effects.saturate} max={200} onChange={v => setEffects(e => ({...e, saturate: v}))} />
                    </Panel>
                    <Panel title="Audio Reactivity">
                         <div className="flex items-end h-24 gap-2">
                             <div className="flex-1 bg-gray-700 rounded-t-sm" style={{ height: `${audioLevels.bass}%`, background: 'linear-gradient(to top, #4f46e5, #a5b4fc)' }} />
                             <div className="flex-1 bg-gray-700 rounded-t-sm" style={{ height: `${audioLevels.mids}%`, background: 'linear-gradient(to top, #0891b2, #67e8f9)' }} />
                             <div className="flex-1 bg-gray-700 rounded-t-sm" style={{ height: `${audioLevels.highs}%`, background: 'linear-gradient(to top, #db2777, #f9a8d4)' }} />
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
