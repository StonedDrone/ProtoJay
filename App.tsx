import React, { useState, useCallback, useEffect, useRef } from 'react';
import { type Shape, type Layer, type GlobalEffects, type Scene, type Point, type VisualType, type ShapeType, type MediaItem, blendModes } from './types';
import Header from './components/Header';
import Canvas, { VisualThumbnail } from './components/Canvas';
import Panel from './components/Panel';
import Slider from './components/Slider';
import { Icon, LAYER_COLORS, VISUALS } from './constants';

const initialShapes: Shape[] = [
    { id: 'shape-1', type: 'polygon', points: [{x: 150, y: 150}, {x: 350, y: 150}, {x: 350, y: 350}, {x: 150, y: 350}], visual: 'dunes', rotation: 0, scale: 1 },
    { id: 'shape-2', type: 'polygon', points: [{x: 450, y: 200}, {x: 650, y: 200}, {x: 550, y: 400}], visual: 'caustics', rotation: 0, scale: 1 }
];

const initialLayers: Layer[] = [
    { id: 'layer-1', shapeId: 'shape-1', name: 'Main Square', opacity: 1, blendMode: 'normal', visible: true, color: LAYER_COLORS[0] },
    { id: 'layer-2', shapeId: 'shape-2', name: 'Accent Triangle', opacity: 0.8, blendMode: 'screen', visible: true, color: LAYER_COLORS[1] }
];

const initialEffects: GlobalEffects = { blur: 0, brightness: 100, contrast: 100, hueRotate: 0, saturate: 100 };

const MaterialsPanel: React.FC<{
    selectedShape: Shape;
    onVisualChange: (visualType: VisualType, mediaUrl?: string) => void;
    mediaLibrary: MediaItem[];
}> = ({ selectedShape, onVisualChange, mediaLibrary }) => {
    return (
        <Panel title="Materials" flex>
            <div className="grid grid-cols-3 gap-2 h-full overflow-y-auto pr-1">
                {VISUALS.map(v => (
                    <VisualThumbnail 
                        key={v.id} 
                        visual={v} 
                        isSelected={selectedShape.visual === v.id}
                        onClick={() => onVisualChange(v.id)}
                    />
                ))}
                {mediaLibrary.map(m => (
                    <VisualThumbnail
                        key={m.id}
                        visual={{id: 'media', name: m.name}}
                        mediaUrl={m.url}
                        isSelected={selectedShape.mediaUrl === m.url}
                        onClick={() => onVisualChange('media', m.url)}
                    />
                ))}
            </div>
        </Panel>
    )
}


const App: React.FC = () => {
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [layers, setLayers] = useState<Layer[]>(initialLayers);
    const [effects, setEffects] = useState<GlobalEffects>(initialEffects);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-1');
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
    const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
    
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

    useEffect(() => {
        setSelectedPointIndex(null);
    }, [selectedLayerId]);

    const updateShape = useCallback((id: string, newProps: Partial<Shape>) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, ...newProps } : s));
    }, []);
    
    const updateShapePoints = useCallback((id: string, newPoints: Point[]) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, points: newPoints } : s));
    }, []);

    const addShape = useCallback((type: ShapeType) => {
        const newShapeId = `shape-${Date.now()}`;
        let newShape: Shape;
        const baseShapeProps = { rotation: 0, scale: 1 };

        switch(type) {
            case 'rect':
                newShape = { id: newShapeId, type: 'rect', points: [{x: 200, y: 200}, {x: 400, y: 350}], visual: 'gradient-color', ...baseShapeProps };
                break;
            case 'circle':
                newShape = { id: newShapeId, type: 'circle', points: [{x: 300, y: 300}, {x: 400, y: 300}], visual: 'sphere', ...baseShapeProps };
                break;
            case 'polygon':
            default:
                newShape = { id: newShapeId, type: 'polygon', points: [{x: 200, y: 200}, {x: 400, y: 200}, {x: 300, y: 350}], visual: 'grid', ...baseShapeProps };
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
    }, [layers.length]);
    
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
                color: LAYER_COLORS[layers.length % LAYER_COLORS.length]
            };
            setShapes(prev => [...prev, newShape]);
            setLayers(prev => [...prev, newLayer]);
            setSelectedLayerId(newLayer.id);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isDrawing) {
                if (e.key === 'Escape') {
                    setIsDrawing(false);
                    setDrawingPoints([]);
                }
                return;
            }
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
            switch(e.key.toLowerCase()) {
                case 'r': addShape('rect'); break;
                case 'c': addShape('circle'); break;
                case 'p': addShape('polygon'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addShape, isDrawing]);
    
    const completeDrawing = useCallback(() => {
        if (drawingPoints.length > 2) {
            const newShapeId = `shape-${Date.now()}`;
            const newShape: Shape = { id: newShapeId, type: 'polygon', points: drawingPoints, visual: 'grid', rotation: 0, scale: 1 };
            const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                shapeId: newShapeId,
                name: `Custom Polygon`,
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                color: LAYER_COLORS[layers.length % LAYER_COLORS.length]
            };
            setShapes(prev => [...prev, newShape]);
            setLayers(prev => [...prev, newLayer]);
            setSelectedLayerId(newLayer.id);
        }
        setDrawingPoints([]);
        setIsDrawing(false);
    }, [drawingPoints, layers.length]);

    const toggleDrawingMode = () => {
        if (isDrawing) { // Finish drawing
            completeDrawing();
        } else { // Start drawing
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

    const handleVisualChange = (shapeId: string, visual: VisualType, mediaUrl?: string) => {
        updateShape(shapeId, {
            visual,
            mediaUrl: visual === 'media' ? mediaUrl : undefined
        });
    };
    
    const handlePointUpdate = (coord: 'x' | 'y', value: number) => {
        if (!selectedShape || selectedPointIndex === null) return;
        const newPoints = [...selectedShape.points];
        newPoints[selectedPointIndex] = { ...newPoints[selectedPointIndex], [coord]: value };
        updateShapePoints(selectedShape.id, newPoints);
    };

    return (
        <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
            <Header onUploadClick={() => fileInputRef.current?.click()} />
            <div className="flex-grow grid grid-cols-12 grid-rows-1 gap-2 p-2 h-full overflow-hidden">
                
                <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
                    <Panel title="Create">
                        <div className="grid grid-cols-4 gap-2">
                           <button onClick={() => addShape('rect')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="rectangle" className="w-5 h-5"/>Rect</button>
                           <button onClick={() => addShape('circle')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="circle" className="w-5 h-5"/>Circle</button>
                           <button onClick={() => addShape('polygon')} className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-indigo-500 rounded p-2 text-sm transition-colors duration-150 text-center"><Icon icon="polygon" className="w-5 h-5"/>Poly</button>
                           <button onClick={toggleDrawingMode} className={`flex flex-col items-center justify-center gap-1 rounded p-2 text-sm transition-colors duration-150 text-center ${isDrawing ? 'bg-indigo-500' : 'bg-gray-700 hover:bg-indigo-500'}`}><Icon icon="line" className="w-5 h-5"/>Line</button>
                        </div>
                    </Panel>
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
                </div>

                <div className="col-span-6 flex flex-col gap-2 h-full">
                    <Panel title="Projection Output" flex>
                       <Canvas 
                         shapes={shapes} 
                         layers={layers} 
                         effects={effects} 
                         updateShapePoints={updateShapePoints} 
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
                             <Slider label="Opacity" value={selectedLayer.opacity * 100} onChange={v => updateLayer(selectedLayer.id, { opacity: v / 100 })} />
                             <Slider label="Rotation" value={selectedShape.rotation || 0} max={360} onChange={v => updateShape(selectedShape.id, { rotation: v })} />
                             <Slider label="Size" value={(selectedShape.scale || 1) * 100} min={10} max={300} onChange={v => updateShape(selectedShape.id, { scale: v / 100 })} />
                             <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-400">Blend Mode</label>
                                <select value={selectedLayer.blendMode} onChange={e => updateLayer(selectedLayer.id, { blendMode: e.target.value as any })} className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    {blendModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                             </div>
                         </Panel>
                         {selectedPointIndex !== null && selectedShape.points[selectedPointIndex] && (
                            <Panel title={`Point ${selectedPointIndex + 1} Properties`}>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-400">X</label>
                                        <input 
                                            type="number" 
                                            value={selectedShape.points[selectedPointIndex].x.toFixed(0)}
                                            onChange={(e) => handlePointUpdate('x', parseFloat(e.target.value))}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-400">Y</label>
                                        <input 
                                            type="number" 
                                            value={selectedShape.points[selectedPointIndex].y.toFixed(0)}
                                            onChange={(e) => handlePointUpdate('y', parseFloat(e.target.value))}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            </Panel>
                         )}
                         <MaterialsPanel 
                            selectedShape={selectedShape}
                            onVisualChange={(visual, mediaUrl) => handleVisualChange(selectedShape.id, visual, mediaUrl)}
                            mediaLibrary={mediaLibrary}
                         />
                        </>
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