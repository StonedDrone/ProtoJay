export interface Point {
  x: number;
  y: number;
}

export type VisualType = 'dots' | 'grid' | 'gradient-purple' | 'gradient-blue' | 'fractal' | 'particles' | 'media';
export type ShapeType = 'polygon' | 'rect' | 'circle';

export const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
] as const;

export type BlendMode = typeof blendModes[number];

export interface Shape {
  id: string;
  type: ShapeType;
  points: Point[];
  visual: VisualType;
  mediaUrl?: string;
}

export interface Layer {
    id:string;
    shapeId: string;
    name: string;
    opacity: number;
    blendMode: BlendMode;
    visible: boolean;
    color: string;
}

export interface GlobalEffects {
    blur: number;
    brightness: number;
    contrast: number;
    hueRotate: number;
    saturate: number;
}

export interface Scene {
    id: string;
    name: string;
    shapes: Shape[];
    layers: Layer[];
    effects: GlobalEffects;
}

export interface MediaItem {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'video';
}
