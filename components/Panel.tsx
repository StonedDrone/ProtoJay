
import React from 'react';

interface PanelProps {
    title: string;
    children: React.ReactNode;
    flex?: boolean;
}

const Panel: React.FC<PanelProps> = ({ title, children, flex = false }) => {
    return (
        <div className={`bg-gray-800 rounded-lg p-3 ${flex ? 'flex flex-col flex-grow' : ''}`}>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
            <div className={`space-y-3 ${flex ? 'flex-grow overflow-hidden' : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default Panel;
