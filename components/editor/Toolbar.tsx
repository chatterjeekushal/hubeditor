
import { FiSave, FiFolder, FiFile, FiTerminal, FiSearch, FiGitBranch, FiSettings, FiPlay } from 'react-icons/fi';
import { useEditor } from '../../lib/EditorContext';
import { useState, useRef } from 'react';

export default function Toolbar() {
    const {
        saveFile,
        openFile,
        newFile,
        toggleTerminal,
        toggleSearch,
        toggleGitPanel,
        activeFile,
        isDirty,
    } = useEditor();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const handleNewFile = () => {
        try {
            newFile();
        } catch (error) {
            console.error('Failed to create new file:', error);
        }
    };

    const handleOpenFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const fileItem = {
                        id: Date.now().toString(),
                        name: file.name,
                        path: file.name,
                        type: 'file' as const,
                        language: getLanguageFromFileName(file.name),
                        content: content,
                    };
                    openFile(fileItem);
                } catch (error) {
                    console.error('Failed to open file:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            reader.onerror = () => {
                console.error('Failed to read file');
                setIsLoading(false);
            };

            reader.readAsText(file);
        }
    };

    const handleSaveFile = () => {
        if (!activeFile) {
            console.warn('No active file to save');
            return;
        }

        try {
            // For now, we'll save the current content
            // In a real implementation, you'd get the content from the editor
            const content = activeFile.content || '';
            saveFile(content);
        } catch (error) {
            console.error('Failed to save file:', error);
        }
    };

    const handleRunCode = async () => {
        if (!activeFile) {
            console.warn('No active file to run');
            return;
        }

        setIsRunning(true);
        try {
            const content = activeFile.content || '';
            const language = activeFile.language || 'javascript';

            // Execute code based on language
            switch (language) {
                case 'javascript':
                case 'typescript':
                    await executeJavaScript(content);
                    break;
                case 'python':
                    await executePython(content);
                    break;
                case 'html':
                    await executeHTML(content);
                    break;
                default:
                    console.log('Running code:', content);
                    // For other languages, just log the content
                    break;
            }
        } catch (error) {
            console.error('Failed to run code:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const executeJavaScript = async (code: string) => {
        try {
            // Create a safe execution environment
            const result = new Function(code)();
            console.log('JavaScript execution result:', result);

            // You could also send this to a backend service for execution
            // or use a sandboxed environment

        } catch (error) {
            console.error('JavaScript execution error:', error);
        }
    };

    const executePython = async (code: string) => {
        // This would typically connect to a Python backend service
        console.log('Python code to execute:', code);
        console.log('Note: Python execution requires a backend service');
    };

    const executeHTML = async (html: string) => {
        // Open HTML in a new window/tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();
        }
    };

    const getLanguageFromFileName = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
        };
        return languageMap[extension || ''] || 'plaintext';
    };

    return (
        <div className="flex items-center gap-2 border border-red-500 p-2 bg-gray-800 border-b">
            <div className="flex items-center gap-1">
                <button
                    onClick={handleNewFile}
                    title="New File (Ctrl+N)"
                    disabled={isLoading}
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                >
                    <FiFile className="w-4 h-4" />
                </button>
                <button
                    onClick={handleOpenFile}
                    title="Open File (Ctrl+O)"
                    disabled={isLoading}
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                >
                    <FiFolder className="w-4 h-4" />
                </button>
                <button
                    onClick={handleSaveFile}
                    title="Save (Ctrl+S)"
                    disabled={!activeFile || isLoading}
                    className={`p-2 rounded transition-colors disabled:opacity-50 ${isDirty
                        ? 'text-yellow-400 hover:bg-gray-700'
                        : 'text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    <FiSave className="w-4 h-4" />
                </button>
            </div>

            <div className="w-px h-6 bg-gray-600" />

            <div className="flex items-center gap-1">
                <button
                    onClick={handleRunCode}
                    title="Run Code (Ctrl+R)"
                    disabled={!activeFile || isLoading || isRunning}
                    className={`p-2 rounded transition-colors disabled:opacity-50 ${isRunning
                        ? 'text-green-400 hover:bg-gray-700'
                        : 'text-green-300 hover:bg-gray-700'
                        }`}
                >
                    <FiPlay className="w-4 h-4" />
                </button>
            </div>

            <div className="w-px h-6 bg-gray-600" />

            <div className="flex items-center gap-1">
                <button
                    onClick={toggleTerminal}
                    title="Toggle Terminal"
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                    <FiTerminal className="w-4 h-4" />
                </button>
                <button
                    onClick={toggleSearch}
                    title="Search (Ctrl+F)"
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                    <FiSearch className="w-4 h-4" />
                </button>
                <button
                    onClick={toggleGitPanel}
                    title="Git Panel"
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                    <FiGitBranch className="w-4 h-4" />
                </button>
            </div>

            <div className="w-px h-6 bg-gray-600" />

            <div className="flex items-center gap-1">
                <button
                    onClick={() => console.log('Settings')}
                    title="Settings"
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                    <FiSettings className="w-4 h-4" />
                </button>
            </div>

            {/* Hidden file input for file selection */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".js,.ts,.jsx,.tsx,.html,.css,.json,.md,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.txt"
            />
        </div>
    );
}