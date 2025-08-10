// File types
export interface FileItem {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    language?: string;
    content?: string;
    children?: FileItem[];
}

// Cursor position
export interface CursorPosition {
    line: number;
    column: number;
}

// Editor panels visibility
export interface EditorPanels {
    terminal: boolean;
    search: boolean;
    git: boolean;
    debug: boolean;
}

// Editor context state
export interface EditorState {
    activeFile: FileItem | null;
    files: FileItem[];
    isDirty: boolean;
    cursorPosition: CursorPosition;
    panels: EditorPanels;
}

// Editor context actions
export interface EditorActions {
    saveFile: (content: string) => void;
    openFile: (file: FileItem) => void;
    newFile: () => void;
    toggleTerminal: () => void;
    toggleSearch: () => void;
    toggleGitPanel: () => void;
    toggleDebugPanel: () => void;
}

// Combined editor context type
export type EditorContextType = EditorState & EditorActions & {
    fileType: string;
    encoding: string;
    lineEnding: string;
    indentType: string;
    gitBranch: string;
};

import { FileItem, CursorPosition } from './editor'; // adjust import paths if needed

export interface EditorPanels {
    terminal: boolean;
    search: boolean;
    git: boolean;
    debug: boolean;
}

export interface EditorContextType {
    activeFile: FileItem | null;
    setActiveFile: (file: FileItem | null) => void; // ✅ added
    files: FileItem[];
    setFiles: (files: FileItem[]) => void;          // ✅ added
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


export interface EditorPanels {
    terminal: boolean;
    search: boolean;
    git: boolean;
    debug: boolean;
}