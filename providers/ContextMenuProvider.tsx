
"use client";

import { ReactNode, useEffect } from 'react';
import { useContextMenu } from '../components/ui/ContextMenu';

interface ContextMenuProviderProps {
    children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
    const { showContextMenu } = useContextMenu();

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            showContextMenu(
                e as unknown as React.MouseEvent,
                'editor-context-menu',
                { location: 'editor' }
            );
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [showContextMenu]);

    return (
        <div className="h-full w-full">
            {children}
        </div>
    );
};

export default ContextMenuProvider;