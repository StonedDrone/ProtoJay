import React, { useState, useRef, useCallback, CSSProperties } from 'react';
import { type Shape, type Point, type GlobalEffects, type Layer } from '../types';

interface CanvasProps {
    shapes: Shape[];
    layers: Layer[];
    effects: GlobalEffects;
    updateShapePoints: (id: string, newPoints: Point[]) => void;
    selectedShapeId: string | null;
    selectedLayerColor?: string;
    isDrawing: boolean;
    drawingPoints: Point[];
    onCanvasClick: (point: Point) => void;
    onDrawingFinish: () => void;
}

type DragState = {
    type: 'shape' | 'point';
    shapeId: string;
    pointIndex?: number;
    offset: Point;
} | null;

const VisualDefs: React.FC = () => (
    <defs>
        <radialGradient id="gradient-purple">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <radialGradient id="gradient-blue">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="2" cy="2" r="1" fill="#a78bfa" />
        </pattern>
        <pattern id="grid" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
        <filter id="fractal-filter">
             <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" stitchTiles="stitch"/>
             <feColorMatrix type="matrix" values="0 0 0 0 0.5, 0 0 0 0 0.5, 0 0 0 0 1, 0 0 0 1 0" />
        </filter>
        <g id="fractal"><rect width="100%" height="100%" filter="url(#fractal-filter)" /></g>
        <filter id="particles-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="turbulence"/>
            <feComposite operator="in" in="turbulence" in2="SourceAlpha" result="composite"/>
            <feColorMatrix in="composite" type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 -2 1"/>
        </filter>
        <g id="particles"><rect width="100%" height="100%" filter="url(#particles-filter)" /></g>
    </defs>
);

const getBoundingBox = (points: Point[]) => {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const x = points.map(p => p.x);
    const y = points.map(p => p.y);
    const minX = Math.min(...x);
    const minY = Math.min(...y);
    const maxX = Math.max(...x);
    const maxY = Math.max(...y);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const Canvas: React.FC<CanvasProps> = ({ shapes, layers, effects, updateShapePoints, selectedShapeId, selectedLayerColor = '#4f46e5', isDrawing, drawingPoints, onCanvasClick, onDrawingFinish }) => {
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
    }, [shapes, isDrawing]);

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
                if(isDrawing) {
                    onCanvasClick(getMousePosition(e));
                }
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
                    const fill = shape.visual.startsWith('gradient') ? `url(#${shape.visual})`
                               : shape.visual === 'dots' || shape.visual === 'grid' ? `url(#${shape.visual})`
                               : `#fff`;

                    let shapeElement: React.ReactNode = null;
                    let handles: Point[] = [];
                    
                    if (shape.type === 'polygon') {
                        const pointsString = shape.points.map(p => `${p.x},${p.y}`).join(' ');
                        shapeElement = <polygon points={pointsString} fill={fill} onMouseDown={(e) => handleMouseDown(e, shape.id)} className="cursor-move"/>;
                        handles = shape.points;
                    } else if (shape.type === 'rect') {
                        const [p1, p2] = shape.points;
                        const x = Math.min(p1.x, p2.x);
                        const y = Math.min(p1.y, p2.y);
                        const width = Math.abs(p1.x - p2.x);
                        const height = Math.abs(p1.y - p2.y);
                        shapeElement = <rect x={x} y={y} width={width} height={height} fill={fill} onMouseDown={(e) => handleMouseDown(e, shape.id)} className="cursor-move"/>
                        handles = [{x,y}, {x:x+width,y}, {x:x+width,y:y+height}, {x,y:y+height}];
                    } else if (shape.type === 'circle') {
                        const [center, edge] = shape.points;
                        const r = Math.hypot(edge.x - center.x, edge.y - center.y);
                        shapeElement = <circle cx={center.x} cy={center.y} r={r} fill={fill} onMouseDown={(e) => handleMouseDown(e, shape.id)} className="cursor-move"/>;
                        handles = [center, edge];
                    }
                    
                    return (
                        <g key={shape.id} opacity={layer.opacity} style={{ mixBlendMode: layer.blendMode as any}}>
                            {shape.visual === 'media' && shape.mediaUrl ? (
                                <g clipPath={`url(#${clipPathId})`}>
                                    <image href={shape.mediaUrl} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" onMouseDown={(e) => handleMouseDown(e, shape.id)} className="cursor-move" />
                                </g>
                            ) : (
                                <>
                                    {shapeElement}
                                    {(shape.visual === 'fractal' || shape.visual === 'particles') && (
                                        <use href={`#${shape.visual}`} clipPath={`url(#${clipPathId})`} />
                                    )}
                                </>
                            )}

                            {selectedShapeId === shape.id && !isDrawing && handles.map((p, i) => {
                                const handleIndex = shape.type === 'rect' ? (i === 0 || i === 2) ? 0 : 1 : i;
                                const originalPoint = shape.points[handleIndex];
                                return (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r="6"
                                    fill="rgba(255, 255, 255, 0.9)"
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