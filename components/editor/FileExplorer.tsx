
"use client";

import { useState, useEffect } from "react";
import { FileItem } from "@/types/editor";
import {
    FiFile,
    FiFolder,
    FiFolderPlus,
    FiChevronRight,
    FiChevronDown,
    FiTrash2,
    FiRefreshCw,
} from "react-icons/fi";

interface FileExplorerProps {
    files: FileItem[];
    onFileSelect: (file: FileItem) => void;
    onNewFile: (parentId?: string) => void;
    onDeleteFile?: (id: string) => void;
    onReorderFiles?: (files: FileItem[]) => void;
    onRefresh?: () => void; // Add refresh handler
}

export default function FileExplorer({
    files,
    onFileSelect,
    onNewFile,
    onDeleteFile,
    onReorderFiles,
    onRefresh, // Add to props
}: FileExplorerProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add polling effect
    useEffect(() => {
        if (!onRefresh) return;

        const interval = setInterval(() => {
            onRefresh();
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [onRefresh]);

    const handleManualRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    const toggleFolder = (id: string) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const handleDragStart = (id: string) => {
        setDraggedFileId(id);
    };

    const handleDrop = (targetId: string) => {
        if (!draggedFileId || draggedFileId === targetId) return;

        const draggedIndex = files.findIndex((f) => f.id === draggedFileId);
        const targetIndex = files.findIndex((f) => f.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;

        const reordered = [...files];
        const [movedFile] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, movedFile);

        onReorderFiles?.(reordered);
        setDraggedFileId(null);
    };

    const renderTree = (items: FileItem[], depth = 0) =>
        items.map((item) => {
            const isFolder = item.type === "folder";
            const isExpanded = expandedFolders.has(item.id);

            return (
                <li
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(item.id)}
                    className="group"
                >
                    <div
                        style={{ paddingLeft: depth * 16 }}
                        className="flex items-center justify-between p-1 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() =>
                            isFolder ? toggleFolder(item.id) : onFileSelect(item)
                        }
                    >
                        <div className="flex items-center space-x-2">
                            {isFolder ? (
                                isExpanded ? <FiChevronDown /> : <FiChevronRight />
                            ) : null}
                            {isFolder ? (
                                <FiFolder className="text-yellow-400" />
                            ) : (
                                <FiFile className="text-blue-400" />
                            )}
                            <span className="truncate">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isFolder && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNewFile(item.id);
                                    }}
                                    className="p-1 hover:bg-gray-600 rounded"
                                >
                                    <FiFolderPlus />
                                </button>
                            )}
                            {onDeleteFile && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteFile(item.id);
                                    }}
                                    className="p-1 hover:bg-red-600 rounded"
                                >
                                    <FiTrash2 />
                                </button>
                            )}
                        </div>
                    </div>

                    {isFolder && isExpanded && item.children && (
                        <ul className="border-l border-gray-600 ml-2 pl-2">
                            {renderTree(item.children, depth + 1)}
                        </ul>
                    )}
                </li>
            );
        });

    return (
        <div className="p-2 border-r border-gray-700 h-full flex flex-col bg-gray-900 text-white w-64">
            <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-sm tracking-wide">EXPLORER</h2>
                <div className="flex gap-1">
                    <button
                        onClick={handleManualRefresh}
                        className="p-1 hover:bg-gray-700 rounded"
                        disabled={isRefreshing}
                        title="Refresh"
                    >
                        <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => onNewFile()}
                        className="p-1 hover:bg-gray-700 rounded"
                    >
                        <FiFolderPlus />
                    </button>
                </div>
            </div>
            <ul className="space-y-1 text-sm">{renderTree(files)}</ul>
        </div>
    );
}