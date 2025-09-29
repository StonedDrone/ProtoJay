
import React, { useState, useRef, useCallback, CSSProperties } from 'react';
import { type Shape, type Point, type GlobalEffects, type Layer } from '../types';

interface CanvasProps {
    shapes: Shape[];
    layers: Layer[];
    effects: GlobalEffects;
    updateShape: (id: string, newPoints: Point[]) => void;
    selectedShapeId: string | null;
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


const Canvas: React.FC<CanvasProps> = ({ shapes, layers, effects, updateShape, selectedShapeId }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragState, setDragState] = useState<DragState>(null);

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
        const mousePos = getMousePosition(e);
        if (pointIndex !== undefined) {
            setDragState({ type: 'point', shapeId, pointIndex, offset: { x: 0, y: 0 } });
        } else {
            const shape = shapes.find(s => s.id === shapeId);
            if (!shape) return;
            const avgX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
            const avgY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;
            setDragState({ type: 'shape', shapeId, offset: { x: mousePos.x - avgX, y: mousePos.y - avgY } });
        }
    }, [shapes]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragState) return;
        const mousePos = getMousePosition(e);
        const { type, shapeId, pointIndex, offset } = dragState;
        
        const originalShape = shapes.find(s => s.id === shapeId);
        if (!originalShape) return;
        let newPoints = [...originalShape.points.map(p => ({...p}))];

        if (type === 'point' && pointIndex !== undefined) {
            newPoints[pointIndex] = mousePos;
        } else if (type === 'shape') {
            const avgX = originalShape.points.reduce((sum, p) => sum + p.x, 0) / originalShape.points.length;
            const avgY = originalShape.points.reduce((sum, p) => sum + p.y, 0) / originalShape.points.length;
            const dx = (mousePos.x - offset.x) - avgX;
            const dy = (mousePos.y - offset.y) - avgY;
            newPoints = originalShape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        }
        
        updateShape(shapeId, newPoints);
    }, [dragState, shapes, updateShape]);

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
        >
            <svg ref={svgRef} style={canvasStyle}>
                <VisualDefs/>
                {shapes.map(shape => {
                    const layer = layers.find(l => l.shapeId === shape.id);
                    if (!layer || !layer.visible) return null;
                    
                    const pointsString = shape.points.map(p => `${p.x},${p.y}`).join(' ');
                    const fill = shape.visual.startsWith('gradient') ? `url(#${shape.visual})`
                               : shape.visual === 'dots' || shape.visual === 'grid' ? `url(#${shape.visual})`
                               : `#fff`;
                    
                    return (
                        <g key={shape.id} opacity={layer.opacity} style={{ mixBlendMode: layer.blendMode as any}}>
                            <polygon
                                points={pointsString}
                                fill={fill}
                                onMouseDown={(e) => handleMouseDown(e, shape.id)}
                                className="cursor-move"
                            />
                            {(shape.visual === 'fractal' || shape.visual === 'particles') && (
                                <use href={`#${shape.visual}`} clipPath={`polygon(${pointsString})`} />
                            )}
                            {selectedShapeId === shape.id && shape.points.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r="6"
                                    fill="rgba(255, 255, 255, 0.9)"
                                    stroke="#4f46e5"
                                    strokeWidth="2"
                                    className="cursor-grab active:cursor-grabbing"
                                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, shape.id, i); }}
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default Canvas;
