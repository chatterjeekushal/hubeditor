
import { useState } from 'react';

interface SearchPanelProps {
    isVisible: boolean;
}

interface SearchResult {
    file: string;
    line: number;
    preview: string;
    match: string;
}

export default function SearchPanel({ isVisible }: SearchPanelProps) {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [replaceTerm, setReplaceTerm] = useState<string>('');
    const [isRegex, setIsRegex] = useState<boolean>(false);
    const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(false);
    const [isWholeWord, setIsWholeWord] = useState<boolean>(false);
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = () => {
        // Mock search results
        const mockResults: SearchResult[] = [
            {
                file: 'example.js',
                line: 15,
                preview: 'const example = "This is an example";',
                match: 'example'
            },
            {
                file: 'example.js',
                line: 23,
                preview: 'function exampleFunction() {',
                match: 'example'
            }
        ];
        setResults(mockResults);
    };

    const handleReplace = () => {
        console.log('Replace:', replaceTerm);
    };

    const handleReplaceAll = () => {
        console.log('Replace all:', replaceTerm);
    };

    if (!isVisible) return null;

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-200 p-2">
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <input
                    type="text"
                    value={replaceTerm}
                    onChange={(e) => setReplaceTerm(e.target.value)}
                    placeholder="Replace..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
            </div>

            <div className="flex gap-4 mb-4 text-sm">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isRegex}
                        onChange={(e) => setIsRegex(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Regex
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isCaseSensitive}
                        onChange={(e) => setIsCaseSensitive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Case sensitive
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isWholeWord}
                        onChange={(e) => setIsWholeWord(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Whole word
                </label>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                    Search
                </button>
                <button
                    onClick={handleReplace}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                    Replace
                </button>
                <button
                    onClick={handleReplaceAll}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                    Replace All
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                {results.map((result, index) => (
                    <div
                        key={index}
                        className="p-2 border-b border-gray-700 hover:bg-gray-800 cursor-pointer"
                    >
                        <div className="text-blue-400 text-sm mb-1">
                            {result.file}:{result.line}
                        </div>
                        <div className="text-gray-300 text-sm font-mono">
                            {result.preview.replace(
                                result.match,
                                `<span class="bg-yellow-600 text-black">${result.match}</span>`
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}