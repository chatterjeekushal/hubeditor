
import { FiSave, FiFolder, FiFile, FiTerminal, FiSearch, FiGitBranch, FiSettings, FiPlay } from 'react-icons/fi';
import { useEditor } from '@/lib/EditorContext';
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
        runCode, // Changed from runcode to runCode
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
            const content = activeFile.content || '';
            saveFile(content);
        } catch (error) {
            console.error('Failed to save file:', error);
        }
    };

    // Use the runCode function from context instead of direct API call
    const handleRunCode = async () => {
        if (!activeFile) {
            console.warn('No active file to run');
            return;
        }

        setIsRunning(true);
        try {
            const content = activeFile.content || '';
            const language = activeFile.language || 'javascript';

            // Use the runCode function from context
            await runCode(content, language);
        } catch (error) {
            console.error('Failed to run code:', error);
            if (typeof window.executeInTerminal === 'function') {
                window.executeInTerminal(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        } finally {
            setIsRunning(false);
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
        <div className="flex items-center justify-between px-3 py-2  border-b border-gray-600 bg-gray-700 shadow-sm w-full">
            {/* Left section - File operations */}
            <div className="flex items-center">
                <div className="flex items-center bg-gray-800 rounded-md p-1 mr-3">
                    <button
                        onClick={handleNewFile}
                        title="New File (Ctrl+N)"
                        disabled={isLoading}
                        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiFile className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleOpenFile}
                        title="Open File (Ctrl+O)"
                        disabled={isLoading}
                        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiFolder className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSaveFile}
                        title="Save (Ctrl+S)"
                        disabled={!activeFile || isLoading}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${isDirty
                            ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <FiSave className="w-4 h-4" />
                    </button>
                </div>

                {/* Run button - separate from file operations */}
                <div className="flex items-center bg-gray-800 rounded-md p-1 mr-3">
                    <button
                        onClick={handleRunCode}
                        title="Run Code (Ctrl+R)"
                        disabled={!activeFile || isLoading || isRunning}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${isRunning
                            ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10 animate-pulse'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                            }`}
                    >
                        <FiPlay className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Active file indicator */}
                {activeFile && (
                    <div className="flex items-center text-sm text-gray-400 bg-gray-800 rounded px-3 py-1">
                        <span className="truncate max-w-48">{activeFile.name}</span>
                        {isDirty && (
                            <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        )}
                    </div>
                )}
            </div>

            {/* Right section - Tools and settings */}
            <div className="flex items-center">
                <div className="flex items-center bg-gray-800 rounded-md p-1 mr-3">
                    <button
                        onClick={toggleSearch}
                        title="Search (Ctrl+F)"
                        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all duration-150"
                    >
                        <FiSearch className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleTerminal}
                        title="Toggle Terminal"
                        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all duration-150"
                    >
                        <FiTerminal className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleGitPanel}
                        title="Git Panel"
                        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all duration-150"
                    >
                        <FiGitBranch className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center bg-gray-800 rounded-md p-1">
                    <button
                        onClick={() => console.log('Settings')}
                        title="Settings"
                        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all duration-150"
                    >
                        <FiSettings className="w-4 h-4" />
                    </button>
                </div>
            </div>

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