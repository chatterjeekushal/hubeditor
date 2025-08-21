
"use client";
import { useState } from "react";
import { FileItem } from "@/types/editor";
import Tabs from "@/components/editor/Tab";
import Editor from "@monaco-editor/react";
import TerminalPanel from "@/components/panels/TerminalPanel";

export default function EditorWithTabs() {
    const [tabs, setTabs] = useState<FileItem[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const openTerminal = () => {
        const terminalTab: FileItem = {
            id: `terminal-${Date.now()}`,
            name: "bash", // Or "shell", "console", etc.
            type: "terminal"
        };

        setTabs([...tabs, terminalTab]);
        setActiveTab(terminalTab.id);
    };

    const handleTabClick = (id: string) => {
        setActiveTab(id);
    };

    const handleTabClose = (id: string) => {
        const newTabs = tabs.filter(tab => tab.id !== id);
        setTabs(newTabs);

        if (activeTab === id) {
            setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
        }
    };

    const renderActiveTabContent = () => {
        if (!activeTab) return (
            <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-500">
                No file or terminal open
            </div>
        );

        const tab = tabs.find(t => t.id === activeTab);
        if (!tab) return (
            <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-500">
                Tab not found
            </div>
        );

        if (tab.type === "terminal") {  // Now valid comparison
            return (
                <div className="flex-1 bg-gray-900 flex flex-col h-full">
                    <TerminalPanel />
                </div>
            );
        }

        // Handle file or folder cases
        return (
            <div className="flex-1 bg-gray-900">
                <Editor
                    height="100%"
                    language={tab.language}
                    value={tab.content}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        automaticLayout: true,
                    }}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabClick={handleTabClick}
                    onTabClose={handleTabClose}
                />
                <button
                    onClick={openTerminal}
                    className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm whitespace-nowrap"
                >
                    + New Terminal
                </button>
            </div>
            {renderActiveTabContent()}
        </div>
    );
}