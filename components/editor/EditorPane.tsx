
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
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            smoothScrolling: true,
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
            if (typeof window.executeInTerminal === 'function') {
                window.executeInTerminal(data.output || "✅ Done (no output)");
            }
        } catch (err: any) {
            if (typeof window.executeInTerminal === 'function') {
                window.executeInTerminal("❌ Error: " + err.message);
            }
        }
    };

    return (
        <div className="h-full w-full bg-[#1a1a1a] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 overflow-x-auto bg-gray-800">
                {openTabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`flex items-center px-3 py-2 text-sm border-r border-gray-700 cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        onClick={() => onTabClick(tab)}
                    >
                        <span className="truncate max-w-[160px]">{tab.name}</span>
                        <FiX
                            className="ml-2 text-gray-400 hover:text-white"
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