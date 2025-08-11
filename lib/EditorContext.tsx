
// lib/EditorContext.ts
"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { EditorPanels, FileItem, CursorPosition } from '../types/editor';
import ContextMenuProvider from '@/providers/ContextMenuProvider';

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
    children: ReactNode;
}

export interface EditorContextType {
    activeFile: FileItem | null;
    setActiveFile: (file: FileItem | null) => void;
    files: FileItem[];
    setFiles: (files: FileItem[] | ((prevFiles: FileItem[]) => FileItem[])) => void;
    isDirty: boolean;
    cursorPosition: CursorPosition;
    panels: EditorPanels;
    saveFile: (content?: string) => void;
    openFile: (file: FileItem) => void;
    newFile: () => void;
    toggleTerminal: () => void;
    toggleSearch: () => void;
    toggleGitPanel: () => void;
    toggleDebugPanel: () => void;
    fileType: string;
    encoding: string;
    lineEnding: string;
    indentType: string;
    gitBranch: string;
}

export function EditorProvider({ children }: EditorProviderProps) {
    const [activeFile, setActiveFile] = useState<FileItem | null>(null);
    const [files, _setFiles] = useState<FileItem[]>([]);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
    const [panels, setPanels] = useState<EditorPanels>({
        terminal: false,
        search: false,
        git: false,
        debug: false,
    });

    // Enhanced setFiles that handles both values and updater functions
    const setFiles = useCallback(
        (update: FileItem[] | ((prevFiles: FileItem[]) => FileItem[])) => {
            if (typeof update === 'function') {
                _setFiles(prev => update(prev));
            } else {
                _setFiles(update);
            }
        },
        []
    );

    const saveFile = (content?: string) => {
        if (!activeFile) return;
        if (content !== undefined) {
            setActiveFile(prev => prev ? { ...prev, content } : null);
        }
        setIsDirty(false);
    };

    const openFile = (file: FileItem) => {
        setActiveFile(file);
        setIsDirty(false);
    };

    const newFile = () => {
        const newFile: FileItem = {
            id: Date.now().toString(),
            name: 'untitled.js',
            path: '/untitled.js',
            type: 'file',
            language: 'javascript',
            content: '// New file',
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFile(newFile);
    };

    const togglePanel = (panel: keyof EditorPanels) => {
        setPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    const value: EditorContextType = {
        activeFile,
        setActiveFile,
        files,
        setFiles,
        isDirty,
        cursorPosition,
        panels,
        saveFile,
        openFile,
        newFile,
        toggleTerminal: () => togglePanel('terminal'),
        toggleSearch: () => togglePanel('search'),
        toggleGitPanel: () => togglePanel('git'),
        toggleDebugPanel: () => togglePanel('debug'),
        fileType: activeFile?.language || 'plaintext',
        encoding: 'UTF-8',
        lineEnding: 'LF',
        indentType: 'Spaces (2)',
        gitBranch: 'main',
    };

    return (
        <EditorContext.Provider value={value}>
            <ContextMenuProvider>
                {children}
            </ContextMenuProvider>
        </EditorContext.Provider>
    );
}

export const useEditor = (): EditorContextType => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};