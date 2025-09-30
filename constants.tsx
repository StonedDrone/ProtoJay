import React from 'react';
import { VisualType } from './types';

export const ICONS = {
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />,
    eye: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
    eyeSlash: <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L6.228 6.228" />,
    save: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />,
    load: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0 3 3m-3-3-3-3" />,
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />,
    polygon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18.75 12 3.75l8.25 15Z" />,
    hexagon: <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />,
    arrow: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />,
    rectangle: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" transform="scale(0.8) translate(3, 3)" /><rect x="7" y="7" width="10" height="10" rx="1" />,
    circle: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 17.25L10 12l-2.25-4.5 4.5-2.25L18 7.5l-4.125 4.125" />,
    undo: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />,
    redo: <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H3a6 6 0 0 0 0 12h3" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18l-1.813-2.096a4.5 4.5 0 0 0-6.364-6.364L-.813 7.904 2.096 6l1.813 2.096a4.5 4.5 0 0 0 6.364 6.364L12 16.273l1.813-2.096a4.5 4.5 0 0 0 6.364-6.364L22.273 6 21 7.904l-1.813 2.096a4.5 4.5 0 0 0-6.364 6.364L11.364 18l-1.55-1.904zM12 3v2m0 14v2m-9-9h2m14 0h2" />,
};

export const Icon: React.FC<{ icon: keyof typeof ICONS; className?: string }> = ({ icon, className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        {ICONS[icon]}
    </svg>
);

export const LAYER_COLORS = [
    '#ef4444', // red-500
    '#3b82f6', // blue-500
    '#22c55e', // green-500
    '#eab308', // yellow-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
];

export const VISUALS: { id: VisualType; name: string }[] = [
    { id: 'gradient-color', name: 'Gradient Color' },
    { id: 'strob', name: 'Strob' },
    { id: 'shapes', name: 'Shapes' },
    { id: 'line-patterns', name: 'Line Patterns' },
    { id: 'mad-noise', name: 'MadNoise' },
    { id: 'sphere', name: 'Sphere' },
    { id: 'line-repeat', name: 'LineRepeat' },
    { id: 'square-array', name: 'SquareArray' },
    { id: 'siren', name: 'Siren' },
    { id: 'dunes', name: 'Dunes' },
    { id: 'bar-code', name: 'Bar Code' },
    { id: 'bricks', name: 'Bricks' },
    { id: 'clouds', name: 'Clouds' },
    { id: 'random', name: 'Random' },
    { id: 'noisy-barcode', name: 'Noisy Barcode' },
    { id: 'caustics', name: 'Caustics' },
    { id: 'square-wave', name: 'SquareWave' },
    { id: 'cubic-circles', name: 'CubicCircles' },
    { id: 'diagonals', name: 'Diagonals' },
    { id: 'spectrum', name: 'Spectrum' },
    { id: 'waveform', name: 'Waveform' },
    { id: 'dots', name: 'Dots' },
    { id: 'grid', name: 'Grid' },
    { id: 'fractal', name: 'Fractal' },
    { id: 'particles', name: 'Particles' },
];

type VisualOptionsConfig = {
    [key in VisualType]?: {
        [key: string]: { label: string; min: number; max: number; step: number; defaultValue: number };
    };
};

export const VISUAL_OPTIONS_CONFIG: VisualOptionsConfig = {
    'dunes': {
        frequencyX: { label: 'Frequency X', min: 0.01, max: 0.2, step: 0.005, defaultValue: 0.02 },
        frequencyY: { label: 'Frequency Y', min: 0.05, max: 0.8, step: 0.01, defaultValue: 0.2 },
        octaves: { label: 'Octaves', min: 1, max: 5, step: 1, defaultValue: 2 },
    },
    'clouds': {
        frequency: { label: 'Frequency', min: 0.005, max: 0.1, step: 0.001, defaultValue: 0.03 },
        octaves: { label: 'Octaves', min: 1, max: 8, step: 1, defaultValue: 4 },
    },
    'caustics': {
        frequency: { label: 'Frequency', min: 0.01, max: 0.2, step: 0.005, defaultValue: 0.05 },
        octaves: { label: 'Octaves', min: 1, max: 5, step: 1, defaultValue: 3 },
        scale: { label: 'Displacement', min: 1, max: 50, step: 1, defaultValue: 15 },
    },
    'fractal': {
        frequency: { label: 'Frequency', min: 0.01, max: 0.1, step: 0.001, defaultValue: 0.04 },
        octaves: { label: 'Octaves', min: 1, max: 8, step: 1, defaultValue: 4 },
    },
    'particles': {
        frequency: { label: 'Size', min: 0.1, max: 2.0, step: 0.05, defaultValue: 0.9 },
    },
    'mad-noise': {
        frequency: { label: 'Frequency', min: 0.01, max: 0.1, step: 0.001, defaultValue: 0.02 },
        scale: { label: 'Displacement', min: 1, max: 50, step: 1, defaultValue: 20 },
    },
    'grid': {
        size: { label: 'Size', min: 5, max: 100, step: 1, defaultValue: 20 },
        strokeWidth: { label: 'Stroke Width', min: 0.1, max: 5, step: 0.1, defaultValue: 0.5 },
    },
    'dots': {
        size: { label: 'Spacing', min: 5, max: 50, step: 1, defaultValue: 10 },
        radius: { label: 'Radius', min: 0.5, max: 10, step: 0.5, defaultValue: 1 },
    },
     'line-patterns': {
        spacing: { label: 'Spacing', min: 4, max: 40, step: 1, defaultValue: 10 },
        strokeWidth: { label: 'Stroke Width', min: 0.5, max: 10, step: 0.5, defaultValue: 2 },
    },
};