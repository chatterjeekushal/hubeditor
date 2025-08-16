
"use client";

import { FiX } from "react-icons/fi";
import { FileItem } from "@/types/editor";

interface TabsProps {
    tabs: FileItem[];
    activeTab: string | null;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabClick, onTabClose }: TabsProps) {
    return (
        <div className="flex border-b border-gray-700 overflow-x-auto bg-gray-900">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`flex items-center px-3 py-2 text-xs border-r border-gray-700 cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-gray-800" : "bg-gray-900 hover:bg-gray-800"
                        }`}
                    onClick={() => onTabClick(tab.id)}
                >
                    <span className="truncate max-w-[120px]">{tab.name}</span>
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
    );
}