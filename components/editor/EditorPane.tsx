
import { useState, useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { FileItem } from '../../types/editor';
import { ContextMenu, MenuItem, MenuSeparator, SubMenu } from '../ui/ContextMenu';
import { FiX } from 'react-icons/fi';

interface EditorPaneProps {
    file: FileItem | null;
    onSave: (content: string) => void;
    onContentChange: (content: string) => void;
    onRunCode?: () => void;
    openTabs: FileItem[];
    activeTab: string | null;
    onTabClick: (file: FileItem) => void;
    onTabClose: (id: string) => void;
}

export default function EditorPane({
    file,
    onSave,
    onContentChange,
    onRunCode,
    openTabs,
    activeTab,
    onTabClick,
    onTabClose,
}: EditorPaneProps) {
    const editorRefs = useRef<Record<string, any>>({}); // ✅ store editors by tabId

    const handleEditorChange = (value: string | undefined, tabId: string) => {
        onContentChange(value || '');
        if (openTabs.find(t => t.id === tabId)) {
            openTabs.find(t => t.id === tabId)!.content = value || '';
        }
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
        if (onRunCode) {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
                onRunCode();
            });
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

            {/* Editors (all mounted, just hidden) */}
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
                {onRunCode && <MenuItem onClick={onRunCode}>Run Code</MenuItem>}
                <MenuSeparator />
                <MenuItem onClick={() => onSave(editorRefs.current[activeTab!]?.getValue() || '')}>
                    Save
                </MenuItem>
            </ContextMenu>
        </div>
    );
}
