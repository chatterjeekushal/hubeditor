
import { useState, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { FileItem } from '../../types/editor';
import { ContextMenu, MenuItem, MenuSeparator } from '../ui/ContextMenu';
import { FiX } from 'react-icons/fi';

interface EditorPaneProps {
    file: FileItem | null;
    onSave: (content: string) => void;
    onContentChange: (content: string) => void;
    openTabs: FileItem[];
    activeTab: string | null;
    onTabClick: (file: FileItem) => void;
    onTabClose: (id: string) => void;
    onRunCode?: () => void;
}

export default function EditorPane({
    file,
    onSave,
    onContentChange,
    openTabs,
    activeTab,
    onTabClick,
    onTabClose,
    onRunCode,
}: EditorPaneProps) {
    const editorRefs = useRef<Record<string, any>>({});

    const handleEditorChange = (value: string | undefined, tabId: string) => {
        onContentChange(value || '');
        const tab = openTabs.find(t => t.id === tabId);
        if (tab) tab.content = value || '';
    };

    const handleEditorDidMount = (editor: any, monaco: Monaco, tabId: string) => {
        editorRefs.current[tabId] = editor;

        editor.updateOptions({
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            smoothScrolling: true,
            automaticLayout: true,
        });

        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1a1a1a',
                'editor.lineHighlightBackground': '#2a2a2a',
                'editorLineNumber.foreground': '#555',
                'editorLineNumber.activeForeground': '#999',
                'editorGutter.background': '#1a1a1a',
            },
        });
        monaco.editor.setTheme('custom-dark');

        // Save shortcut
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            onSave(editor.getValue());
        });

        // Run shortcut
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
            runCode(editor.getValue(), tabId);
        });
    };

    const runCode = async (code: string, tabId: string) => {
        try {
            const res = await fetch("/api/runcode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language: openTabs.find(t => t.id === tabId)?.language || "javascript"
                }),
            });
            const data = await res.json();

            // Send output to terminal
            if (typeof window !== 'undefined' && typeof (window as any).executeInTerminal === 'function') {
                (window as any).executeInTerminal(data.output || "✅ Done (no output)");
            }
        } catch (err: any) {
            if (typeof window !== 'undefined' && typeof (window as any).executeInTerminal === 'function') {
                (window as any).executeInTerminal("❌ Error: " + err.message);
            }
        }
    };

    return (
        <div className="h-full w-full bg-[#1a1a1a] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 overflow-x-auto bg-gray-900 min-h-[40px]">
                {openTabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`
                            flex items-center px-3 py-2 text-sm border-r border-gray-700 
                            cursor-pointer whitespace-nowrap min-w-0 max-w-[160px]
                            transition-colors duration-200 ease-in-out
                            ${activeTab === tab.id
                                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }
                        `}
                        onClick={() => onTabClick(tab)}
                    >
                        <span className="truncate flex-1 mr-2">{tab.name}</span>
                        <FiX
                            className="flex-shrink-0 w-4 h-4 text-gray-500 hover:text-red-400 transition-colors duration-150"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(tab.id);
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Editors */}
            <div className="flex-1 relative">
                {openTabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`absolute inset-0 ${activeTab === tab.id ? 'block' : 'hidden'}`}
                    >
                        <Editor
                            height="100%"
                            width="100%"
                            language={tab.language || 'javascript'}
                            theme="custom-dark"
                            value={tab.content || ''}
                            onChange={(val) => handleEditorChange(val, tab.id)}
                            onMount={(editor, monaco) => handleEditorDidMount(editor, monaco, tab.id)}
                            options={{
                                automaticLayout: true,
                                wordWrap: 'on',
                                minimap: { enabled: false },
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                ))}

                {/* Show placeholder when no tabs */}
                {openTabs.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No files open</p>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            <ContextMenu id="editor-context-menu">
                <MenuItem onClick={() => editorRefs.current[activeTab!]?.trigger('keyboard', 'editor.action.clipboardCutAction')}>
                    Cut
                </MenuItem>
                <MenuItem onClick={() => editorRefs.current[activeTab!]?.trigger('keyboard', 'editor.action.clipboardCopyAction')}>
                    Copy
                </MenuItem>
                <MenuItem onClick={() => editorRefs.current[activeTab!]?.trigger('keyboard', 'editor.action.clipboardPasteAction')}>
                    Paste
                </MenuItem>
                <MenuSeparator />
                <MenuItem onClick={() => runCode(editorRefs.current[activeTab!]?.getValue() || '', activeTab!)}>
                    Run Code
                </MenuItem>
                <MenuSeparator />
                <MenuItem onClick={() => onSave(editorRefs.current[activeTab!]?.getValue() || '')}>
                    Save
                </MenuItem>
            </ContextMenu>
        </div>
    );
}