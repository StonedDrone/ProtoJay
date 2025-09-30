import React, { useState, useRef, useCallback, CSSProperties, useEffect } from 'react';
import { type Shape, type Point, type GlobalEffects, type Layer, VisualType, LiveStream } from '../types';

interface CanvasProps {
    shapes: Shape[];
    layers: Layer[];
    liveStreams: LiveStream[];
    effects: GlobalEffects;
    updateShapePoints: (id: string, newPoints: Point[]) => void;
    selectedShapeId: string | null;
    selectedLayerColor?: string;
    isDrawing: boolean;
    drawingPoints: Point[];
    onCanvasClick: (point: Point) => void;
    onDrawingFinish: () => void;
    selectedPointIndex: number | null;
    onPointSelect: (index: number) => void;
}

type DragState = {
    type: 'shape' | 'point';
    shapeId: string;
    pointIndex?: number;
    offset: Point;
} | null;

const VisualDefs: React.FC = () => (
    <defs>
        <style>{`
            @keyframes strob-anim {
                0%, 49% { fill: white; }
                50%, 100% { fill: black; }
            }
        `}</style>
        {/* Old Gradients */}
        <radialGradient id="gradient-purple"><stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#6d28d9" /></radialGradient>
        <radialGradient id="gradient-blue"><stop offset="0%" stopColor="#7dd3fc" /><stop offset="100%" stopColor="#0369a1" /></radialGradient>
        
        {/* New Visuals */}
        <linearGradient id="gradient-color" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00F" /><stop offset="50%" stopColor="#F0F" /><stop offset="100%" stopColor="#F00" /></linearGradient>
        <g id="strob"><rect width="100%" height="100%" style={{ animation: 'strob-anim 0.1s steps(1, end) infinite' }} /></g>
        <pattern id="shapes" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="15" height="15" x="0" y="0" fill="#fff" />
            <rect width="10" height="10" x="20" y="15" fill="#aaa" />
            <rect width="5" height="5" x="5" y="25" fill="#ccc" />
        </pattern>
        <pattern id="line-patterns" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 5 0 L 5 10" stroke="#fff" strokeWidth="2"/></pattern>
        <filter id="mad-noise-filter"><feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="1" seed="2"><animate attributeName="seed" from="0" to="100" dur="5s" repeatCount="indefinite" /></feTurbulence><feDisplacementMap in="SourceGraphic" scale="20" /></filter>
        <radialGradient id="sphere"><stop offset="10%" stopColor="#fff" /><stop offset="100%" stopColor="#000" /></radialGradient>
        <pattern id="line-repeat" patternUnits="userSpaceOnUse" width="40" height="20">
            <rect x="0" y="0" width="30" height="5" fill="#fff" />
            <rect x="10" y="10" width="30" height="5" fill="#fff" />
        </pattern>
        <pattern id="square-array" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect x="0" y="0" width="15" height="15" fill="#ccc" />
            <rect x="5" y="5" width="10" height="10" fill="#fff" />
        </pattern>
        <linearGradient id="siren" gradientTransform="rotate(45)"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#000" /></linearGradient>
        <filter id="dunes-filter"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.2" numOctaves="2"><animate attributeName="seed" from="0" to="100" dur="10s" repeatCount="indefinite" /></feTurbulence><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="2" intercept="-0.5"/></feComponentTransfer></filter>
        <pattern id="bar-code" patternUnits="userSpaceOnUse" width="20" height="100">
            <rect x="0" y="0" width="2" height="100" fill="#fff"/><rect x="3" y="0" width="1" height="100" fill="#fff"/><rect x="6" y="0" width="4" height="100" fill="#fff"/><rect x="12" y="0" width="3" height="100" fill="#fff"/>
        </pattern>
        <pattern id="bricks" width="40" height="20" patternUnits="userSpaceOnUse">
            <rect width="40" height="20" fill="#1f2937" />
            <rect x="0" y="0" width="18" height="8" fill="#fff" />
            <rect x="22" y="0" width="18" height="8" fill="#fff" />
            <rect x="0" y="10" width="38" height="8" fill="#fff" transform="translate(10, 0)" />
        </pattern>
        <filter id="clouds-filter"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4"><animate attributeName="seed" from="0" to="50" dur="15s" repeatCount="indefinite" /></feTurbulence><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope="1.5" intercept="-0.2"/></feComponentTransfer></filter>
        <filter id="random-filter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="1" stitchTiles="stitch" /></filter>
        <pattern id="noisy-barcode" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M -1,1 l 2,-2 M 0,10 l 10,-10 M 9,11 l 2,-2" stroke="#fff" strokeWidth="1"/></pattern>
        <filter id="caustics-filter"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"><animate attributeName="seed" from="0" to="20" dur="8s" repeatCount="indefinite" /></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="15" /></filter>
        <pattern id="square-wave" patternUnits="userSpaceOnUse" width="20" height="20"><path d="M 0,10 L 5,10 5,0 10,0 10,10 15,10 15,0 20,0" fill="none" stroke="#fff" strokeWidth="2" /></pattern>
        <pattern id="cubic-circles" patternUnits="userSpaceOnUse" width="20" height="20"><circle cx="10" cy="10" r="8" stroke="#fff" strokeWidth="2" fill="none"/></pattern>
        <pattern id="diagonals" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="0.5"/><path d="M-1,9 l2,2 M0,0 l10,10 M9,-1 l2,2" stroke="#fff" strokeWidth="0.5"/></pattern>
        <g id="spectrum">
            <rect x="5%" y="60%" width="8%" height="40%" fill="#fff" /><rect x="15%" y="20%" width="8%" height="80%" fill="#fff" /><rect x="25%" y="40%" width="8%" height="60%" fill="#fff" /><rect x="35%" y="10%" width="8%" height="90%" fill="#fff" /><rect x="45%" y="50%" width="8%" height="50%" fill="#fff" /><rect x="55%" y="30%" width="8%" height="70%" fill="#fff" /><rect x="65%" y="70%" width="8%" height="30%" fill="#fff" /><rect x="75%" y="25%" width="8%" height="75%" fill="#fff" /><rect x="85%" y="55%" width="8%" height="45%" fill="#fff" />
        </g>
        <g id="waveform"><path d="M 0 50 Q 10 20, 20 50 T 40 50 Q 50 80, 60 50 T 80 50 Q 90 20, 100 50" fill="none" stroke="#fff" strokeWidth="2" /></g>

        {/* Old patterns/filters */}
        <pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="2" cy="2" r="1" fill="#a78bfa" /></pattern>
        <pattern id="grid" patternUnits="userSpaceOnUse" width="20" height="20"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6366f1" strokeWidth="0.5"/></pattern>
        <filter id="fractal-filter"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" stitchTiles="stitch"><animate attributeName="seed" from="0" to="10" dur="20s" repeatCount="indefinite" /></feTurbulence><feColorMatrix type="matrix" values="0 0 0 0 0.5, 0 0 0 0 0.5, 0 0 0 0 1, 0 0 0 1 0" /></filter>
        <filter id="particles-filter"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="turbulence"><animate attributeName="seed" from="0" to="200" dur="3s" repeatCount="indefinite" /></feTurbulence><feComposite operator="in" in="turbulence" in2="SourceAlpha" result="composite"/><feColorMatrix in="composite" type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 -2 1"/></filter>
    </defs>
);

const LiveVideoPlayer: React.FC<{ stream: MediaStream }> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);
    return <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};

export const VisualThumbnail: React.FC<{
    visual: {id: VisualType | 'media', name: string},
    isSelected: boolean,
    onClick: () => void,
    mediaUrl?: string
    stream?: MediaStream
}> = ({ visual, isSelected, onClick, mediaUrl, stream }) => {
    return (
        <div onClick={onClick} className={`cursor-pointer group flex flex-col items-center gap-1 ${isSelected ? 'text-indigo-400' : ''}`}>
            <div className={`w-full aspect-[4/3] bg-gray-900 rounded-md transition-all duration-150 border-2 ${isSelected ? 'border-indigo-500' : 'border-gray-700 group-hover:border-gray-600'} overflow-hidden`}>
                <div className="w-full h-full transition-transform duration-300 group-hover:scale-110">
                    {visual.id === 'media' && mediaUrl ? (
                        <img src={mediaUrl} className="w-full h-full object-cover" />
                    ) : visual.id === 'live-input' && stream ? (
                        <LiveVideoPlayer stream={stream} />
                    ) : (
                        <svg viewBox="0 0 100 75" className="w-full h-full">
                            <VisualDefs />
                            <rect x="0" y="0" width="100" height="75" fill="#000" />
                            <rect x="0" y="0" width="100" height="75" fill="url(#gradient-color)" visibility={visual.id === 'gradient-color' ? 'visible' : 'hidden'} />
                            <use href="#strob" visibility={visual.id === 'strob' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#shapes)" visibility={visual.id === 'shapes' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#line-patterns)" visibility={visual.id === 'line-patterns' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#fff" filter="url(#mad-noise-filter)" visibility={visual.id === 'mad-noise' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#sphere)" visibility={visual.id === 'sphere' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#line-repeat)" visibility={visual.id === 'line-repeat' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#square-array)" visibility={visual.id === 'square-array' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#siren)" visibility={visual.id === 'siren' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#000" filter="url(#dunes-filter)" visibility={visual.id === 'dunes' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#bar-code)" visibility={visual.id === 'bar-code' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#bricks)" visibility={visual.id === 'bricks' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#000" filter="url(#clouds-filter)" visibility={visual.id === 'clouds' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#fff" filter="url(#random-filter)" visibility={visual.id === 'random' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#noisy-barcode)" filter="url(#random-filter)" visibility={visual.id === 'noisy-barcode' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#fff" filter="url(#caustics-filter)" visibility={visual.id === 'caustics' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#square-wave)" visibility={visual.id === 'square-wave' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#cubic-circles)" visibility={visual.id === 'cubic-circles' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#diagonals)" visibility={visual.id === 'diagonals' ? 'visible' : 'hidden'} />
                            <use href="#spectrum" visibility={visual.id === 'spectrum' ? 'visible' : 'hidden'} />
                            <use href="#waveform" transform="translate(0, -25) scale(1 1.5)" visibility={visual.id === 'waveform' ? 'visible' : 'hidden'} />
                            {/* Old visuals */}
                            <rect x="0" y="0" width="100" height="75" fill="url(#dots)" visibility={visual.id === 'dots' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="url(#grid)" visibility={visual.id === 'grid' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#000" filter="url(#fractal-filter)" visibility={visual.id === 'fractal' ? 'visible' : 'hidden'} />
                            <rect x="0" y="0" width="100" height="75" fill="#000" filter="url(#particles-filter)" visibility={visual.id === 'particles' ? 'visible' : 'hidden'} />
                        </svg>
                    )}
                </div>
            </div>
            <p className="text-xs truncate w-full text-center">{visual.name}</p>
        </div>
    )
}

const Canvas: React.FC<CanvasProps> = ({ shapes, layers, liveStreams, effects, updateShapePoints, selectedShapeId, selectedLayerColor = '#4f46e5', isDrawing, drawingPoints, onCanvasClick, onDrawingFinish, selectedPointIndex, onPointSelect }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragState, setDragState] = useState<DragState>(null);
    const [mousePos, setMousePos] = useState<Point | null>(null);

    const getMousePosition = (e: React.MouseEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return { x: 0, y: 0 };
        return {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d
        };
    };

    const handleMouseDown = useCallback((e: React.MouseEvent, shapeId: string, pointIndex?: number) => {
        if (isDrawing) return;
        e.stopPropagation();

        if (pointIndex !== undefined) {
             onPointSelect(pointIndex);
        }

        const mousePos = getMousePosition(e);
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return;

        if (pointIndex !== undefined) {
            setDragState({ type: 'point', shapeId, pointIndex, offset: { x: 0, y: 0 } });
        } else {
            const avgX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
            const avgY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;
            setDragState({ type: 'shape', shapeId, offset: { x: mousePos.x - avgX, y: mousePos.y - avgY } });
        }
    }, [shapes, isDrawing, onPointSelect]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const currentMousePos = getMousePosition(e);
        setMousePos(currentMousePos);
        if (!dragState) return;
        const { type, shapeId, pointIndex, offset } = dragState;
        
        const originalShape = shapes.find(s => s.id === shapeId);
        if (!originalShape) return;
        let newPoints = [...originalShape.points.map(p => ({...p}))];

        if (type === 'point' && pointIndex !== undefined) {
            if (originalShape.type === 'rect') {
                const otherIndex = pointIndex === 0 ? 1 : 0;
                newPoints[pointIndex] = currentMousePos;
            } else if (originalShape.type === 'circle') {
                newPoints[pointIndex] = currentMousePos;
            } else {
                newPoints[pointIndex] = currentMousePos;
            }
        } else if (type === 'shape') {
            const avgX = originalShape.points.reduce((sum, p) => sum + p.x, 0) / originalShape.points.length;
            const avgY = originalShape.points.reduce((sum, p) => sum + p.y, 0) / originalShape.points.length;
            const dx = (currentMousePos.x - offset.x) - avgX;
            const dy = (currentMousePos.y - offset.y) - avgY;
            newPoints = originalShape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        }
        
        updateShapePoints(shapeId, newPoints);
    }, [dragState, shapes, updateShapePoints]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);

    const canvasStyle: CSSProperties = {
        filter: `blur(${effects.blur}px) brightness(${effects.brightness}%) contrast(${effects.contrast}%) hue-rotate(${effects.hueRotate}deg) saturate(${effects.saturate}%)`,
        width: '100%',
        height: '100%',
        backgroundColor: '#111827',
        borderRadius: '0.25rem',
        overflow: 'hidden'
    };
    
    return (
        <div 
            className="w-full h-full touch-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
                onCanvasClick(getMousePosition(e));
            }}
            onContextMenu={(e) => {
                if (isDrawing) {
                    e.preventDefault();
                    onDrawingFinish();
                }
            }}
        >
            <svg ref={svgRef} style={canvasStyle} className={isDrawing ? 'cursor-crosshair' : ''}>
                <VisualDefs/>
                <defs>
                    {shapes.map(shape => {
                         const clipPathId = `clip-${shape.id}`;
                         if (shape.type === 'polygon') {
                            const pointsString = shape.points.map(p => `${p.x},${p.y}`).join(' ');
                            return <clipPath key={clipPathId} id={clipPathId}><polygon points={pointsString} /></clipPath>
                         }
                         if (shape.type === 'rect') {
                             const [p1, p2] = shape.points;
                             const x = Math.min(p1.x, p2.x);
                             const y = Math.min(p1.y, p2.y);
                             const width = Math.abs(p1.x - p2.x);
                             const height = Math.abs(p1.y - p2.y);
                             return <clipPath key={clipPathId} id={clipPathId}><rect x={x} y={y} width={width} height={height}/></clipPath>
                         }
                         if (shape.type === 'circle') {
                             const [center, edge] = shape.points;
                             const r = Math.hypot(edge.x - center.x, edge.y - center.y);
                             return <clipPath key={clipPathId} id={clipPathId}><circle cx={center.x} cy={center.y} r={r}/></clipPath>
                         }
                         return null;
                    })}
                </defs>

                {shapes.map(shape => {
                    const layer = layers.find(l => l.shapeId === shape.id);
                    if (!layer || !layer.visible) return null;
                    
                    const clipPathId = `clip-${shape.id}`;
                    
                    const simplePatternFills = ['shapes', 'line-patterns', 'line-repeat', 'square-array', 'bar-code', 'bricks', 'noisy-barcode', 'square-wave', 'cubic-circles', 'diagonals', 'dots', 'grid'];
                    const gradientFills = ['gradient-purple', 'gradient-blue', 'gradient-color', 'sphere', 'siren'];
                    const filterEffects = ['mad-noise', 'dunes', 'clouds', 'random', 'caustics', 'fractal', 'particles'];
                    const useHrefEffects = ['strob', 'spectrum', 'waveform'];

                    let fill = 'black';
                    let filter = 'none';
                    let useHref = null;

                    if (simplePatternFills.includes(shape.visual)) fill = `url(#${shape.visual})`;
                    else if (gradientFills.includes(shape.visual)) fill = `url(#${shape.visual})`;
                    else if (filterEffects.includes(shape.visual)) {
                        fill = (shape.visual === 'dunes' || shape.visual === 'clouds' || shape.visual === 'fractal' || shape.visual === 'particles') ? 'black' : 'white';
                        filter = `url(#${shape.visual}-filter)`;
                    } else if (useHrefEffects.includes(shape.visual)) {
                        useHref = `#${shape.visual}`;
                    }

                    let centerX = 0, centerY = 0;
                    if (shape.points.length > 0) {
                        if (shape.type === 'rect') {
                            centerX = (shape.points[0].x + shape.points[1].x) / 2;
                            centerY = (shape.points[0].y + shape.points[1].y) / 2;
                        } else if (shape.type === 'circle') {
                            centerX = shape.points[0].x;
                            centerY = shape.points[0].y;
                        } else {
                            centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
                            centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;
                        }
                    }

                    const transform = `rotate(${shape.rotation || 0} ${centerX} ${centerY}) scale(${shape.scale || 1}) translate(${centerX * (1 - (shape.scale || 1))} ${centerY * (1 - (shape.scale || 1))})`;
                    
                    const renderContent = () => {
                        if (shape.visual === 'media' && shape.mediaUrl) {
                            return <image href={shape.mediaUrl} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />;
                        }
                        if (shape.visual === 'live-input' && shape.liveStreamId) {
                            const liveStream = liveStreams.find(ls => ls.id === shape.liveStreamId);
                            if (liveStream) {
                                return (
                                    <foreignObject x="0" y="0" width="100%" height="100%">
                                        <LiveVideoPlayer stream={liveStream.stream} />
                                    </foreignObject>
                                );
                            }
                        }
                        if (useHref) {
                             return <use href={useHref} width="100%" height="100%" />;
                        }
                        return <rect x="0" y="0" width="100%" height="100%" fill={fill} filter={filter} />;
                    };

                    return (
                        <g key={shape.id} opacity={layer.opacity} style={{ mixBlendMode: layer.blendMode as any}} transform={transform}>
                            <g onMouseDown={(e) => handleMouseDown(e, shape.id)} className="cursor-move">
                                <g clipPath={`url(#${clipPathId})`}>
                                    {renderContent()}
                                </g>
                            </g>
                            {selectedShapeId === shape.id && !isDrawing && (shape.type === 'polygon' ? shape.points : shape.type === 'rect' ? [{x: Math.min(shape.points[0].x, shape.points[1].x), y: Math.min(shape.points[0].y, shape.points[1].y)}, {x: Math.max(shape.points[0].x, shape.points[1].x), y: Math.min(shape.points[0].y, shape.points[1].y)}, {x: Math.max(shape.points[0].x, shape.points[1].x), y: Math.max(shape.points[0].y, shape.points[1].y)}, {x: Math.min(shape.points[0].x, shape.points[1].x), y: Math.max(shape.points[0].y, shape.points[1].y)}] : shape.points).map((p, i) => {
                                const handleIndex = shape.type === 'rect' ? (i === 0 || i === 3 ? 0 : 1) : i;
                                const isSelected = handleIndex === selectedPointIndex;
                                return (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r={isSelected ? 8 : 6}
                                    fill={isSelected ? selectedLayerColor : 'rgba(255, 255, 255, 0.9)'}
                                    stroke={selectedLayerColor}
                                    strokeWidth="2"
                                    className="cursor-grab active:cursor-grabbing"
                                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, shape.id, handleIndex); }}
                                />
                            )})}
                        </g>
                    );
                })}
                {isDrawing && drawingPoints.length > 0 && (
                    <g style={{ pointerEvents: 'none' }}>
                        <polyline
                            points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={selectedLayerColor}
                            strokeWidth="2"
                            strokeDasharray="4 4"
                        />
                        {drawingPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill={selectedLayerColor} />
                        ))}
                        {mousePos && (
                            <line
                                x1={drawingPoints[drawingPoints.length - 1].x}
                                y1={drawingPoints[drawingPoints.length - 1].y}
                                x2={mousePos.x}
                                y2={mousePos.y}
                                stroke={selectedLayerColor}
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />
                        )}
                    </g>
                )}
            </svg>
        </div>
    );
};

export default Canvas;