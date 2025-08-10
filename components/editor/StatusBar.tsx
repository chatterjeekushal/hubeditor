
import { useEditor } from '../../lib/EditorContext';

export default function StatusBar() {
    const {
        cursorPosition,
        fileType,
        encoding,
        lineEnding,
        indentType,
        isDirty,
        gitBranch,
        activeFile,
    } = useEditor();

    return (
        <footer className="flex justify-between items-center px-3 py-1 bg-red-600 text-white text-sm border-t  border border-yellow-500">
            <div className="flex items-center gap-4">
                <span className="text-gray-200">
                    Ln {cursorPosition.line}, Col {cursorPosition.column}
                </span>
                {activeFile && (
                    <>
                        <span className="text-gray-200">{fileType}</span>
                        <span className="text-gray-200">{encoding}</span>
                        <span className="text-gray-200">{lineEnding}</span>
                        <span className="text-gray-200">{indentType}</span>
                    </>
                )}
                {isDirty && <span className="text-yellow-300">●</span>}
            </div>
            <div className="flex items-center gap-4">
                {gitBranch && (
                    <span className="flex items-center gap-1 text-gray-200">
                        <span className="text-xs">⎇</span> {gitBranch}
                    </span>
                )}
            </div>
        </footer>
    );
}