
import { useState, useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEditor } from '../../lib/EditorContext';
import { FileItem } from '../../types/editor';
import { ContextMenu, MenuItem, MenuSeparator, SubMenu } from '../ui/ContextMenu';

interface EditorPaneProps {
    file: FileItem | null;
    onSave: (content: string) => void;
    onContentChange: (content: string) => void;
    onRunCode?: () => void;
}

export default function EditorPane({ file, onSave, onContentChange, onRunCode }: EditorPaneProps) {
    const [content, setContent] = useState<string>('');
    const editorRef = useRef<any>(null);

    useEffect(() => {
        if (file) {
            setContent(file.content || '');
        }
    }, [file]);

    const handleEditorChange = (value: string | undefined) => {
        const newContent = value || '';
        setContent(newContent);
        onContentChange(newContent);
    };

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
        editor.updateOptions({
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            autoClosingBrackets: 'always',
            autoIndent: 'full',
        });

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            onSave(content);
        });

        // Add run code shortcut (Ctrl+R)
        if (onRunCode) {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
                onRunCode();
            });
        }

        // Add more shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
            editor.trigger('keyboard', 'actions.find', {});
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
            editor.trigger('keyboard', 'editor.action.startFindReplaceAction', {});
        });
    };

    return (
        <div className="h-full bg-green-900">
            <Editor
                height="100%"
                width="100%"
                language={file?.language || 'javascript'}
                theme="vs-dark"
                value={content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    automaticLayout: true,
                    folding: true,
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                }}
            />

            <ContextMenu id="editor-context-menu">
                <MenuItem onClick={() => console.log('Cut')}>Cut</MenuItem>
                <MenuItem onClick={() => console.log('Copy')}>Copy</MenuItem>
                <MenuItem onClick={() => console.log('Paste')}>Paste</MenuItem>
                <MenuSeparator />
                <MenuItem onClick={() => console.log('Find')}>Find</MenuItem>
                <MenuItem onClick={() => console.log('Replace')}>Replace</MenuItem>
                <MenuSeparator />
                <MenuItem onClick={onRunCode}>Run Code</MenuItem>
                <MenuSeparator />
                <SubMenu label="Format">
                    <MenuItem onClick={() => console.log('Format Document')}>Document</MenuItem>
                    <MenuItem onClick={() => console.log('Format Selection')}>Selection</MenuItem>
                </SubMenu>
            </ContextMenu>
        </div>
    );
}