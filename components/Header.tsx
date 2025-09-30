import React from 'react';
import { Icon } from '../constants';

interface HeaderProps {
    onUploadClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onUploadClick }) => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon icon="polygon" className="w-8 h-8 text-indigo-400" />
                <h1 className="text-xl font-bold tracking-tight">Proto-Jay</h1>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onUploadClick} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
                    <Icon icon="upload" className="w-4 h-4"/>
                    <span>Upload Media</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                    <Icon icon="save" className="w-4 h-4"/>
                    <span>Save Project</span>
                </button>
                 <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                    <Icon icon="load" className="w-4 h-4"/>
                    <span>Load Project</span>
                </button>
            </div>
        </header>
    );
};

export default Header;