export interface Point {
  x: number;
  y: number;
}

export type VisualType = 'dots' | 'grid' | 'gradient-purple' | 'gradient-blue' | 'fractal' | 'particles' | 'media' |
  'gradient-color' | 'strob' | 'shapes' | 'line-patterns' | 'mad-noise' | 'sphere' | 'line-repeat' | 
  'square-array' | 'siren' | 'dunes' | 'bar-code' | 'bricks' | 'clouds' | 'random' | 
  'noisy-barcode' | 'caustics' | 'square-wave' | 'cubic-circles' | 'diagonals' | 
  'spectrum' | 'waveform' | 'live-input';

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
  visualOptions?: { [key: string]: number };
  mediaUrl?: string;
  liveStreamId?: string;
  rotation?: number;
  scale?: number;
}

export type OpacityMode = 'static' | 'pulse' | 'audio-bass' | 'audio-mids' | 'audio-highs';

export interface Layer {
    id:string;
    shapeId: string;
    name: string;
    opacity: number;
    blendMode: BlendMode;
    visible: boolean;
    color: string;
    opacityMode?: OpacityMode;
    opacityParams?: {
        speed?: number;
        min?: number;
        max?: number;
        sensitivity?: number;
    };
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

export interface LiveStream {
    id: string;
    name: string;
    stream: MediaStream;
}

export interface AudioLevels {
    bass: number;
    mids: number;
    highs: number;
}