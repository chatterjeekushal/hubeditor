
"use client";

import { useEffect, useCallback, useState } from "react";
import { EditorProvider, useEditor } from "../lib/EditorContext";
import ContextMenuProvider from "../providers/ContextMenuProvider";
import Toolbar from "../components/editor/Toolbar";
import FileExplorer from "../components/editor/FileExplorer";
import EditorPane from "../components/editor/EditorPane";
import StatusBar from "../components/editor/StatusBar";
import TerminalPanel from "../components/panels/TerminalPanel";
import SearchPanel from "../components/panels/SearchPanel";
import { FileItem } from "../types/editor";
import { useFileWatcher } from "@/hook/useFileWatcher";
import { FiX } from "react-icons/fi";

function EditorLayout() {
  const { activeFile, setActiveFile, saveFile, files, setFiles, panels } = useEditor();
  const [openTabs, setOpenTabs] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const refreshFiles = useCallback(async (changeData?: { event: string; path: string }) => {
    try {
      if (changeData?.event === 'unlink' || changeData?.event === 'unlinkDir') {
        setFiles(prev => prev.filter(file => !file.path.startsWith(changeData.path)));
        setOpenTabs(prev => prev.filter(tab => !tab.path.startsWith(changeData.path)));
        if (activeTabId && changeData.path.startsWith(activeTabId)) {
          setActiveTabId(null);
          setActiveFile(null);
        }
        return;
      }

      if (changeData?.event === 'change') {
        try {
          const response = await fetch(`/api/files?path=${encodeURIComponent(changeData.path)}`);
          const updatedFile = await response.json();
          setFiles(prev => prev.map(file => file.path === changeData.path ? updatedFile : file));
          setOpenTabs(prev => prev.map(tab => tab.path === changeData.path ? updatedFile : tab));
          if (activeTabId === updatedFile.id) {
            setActiveFile(updatedFile);
          }
          return;
        } catch (error) {
          console.error("Failed to update single file:", error);
        }
      }

      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error in refreshFiles:", error);
    }
  }, [setFiles, activeTabId, setActiveFile]);

  useFileWatcher(refreshFiles);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const handleContentChange = (content: string) => {
    if (activeFile) {
      const updatedFile = { ...activeFile, content };
      setActiveFile(updatedFile);
      setOpenTabs(prev =>
        prev.map(tab => tab.id === activeFile.id ? updatedFile : tab)
      );
    }
  };

  const handleFileSelect = (file: FileItem) => {
    if (file.type === "file") {
      // Add to tabs if not already open
      if (!openTabs.some(tab => tab.id === file.id)) {
        setOpenTabs([...openTabs, file]);
      }
      setActiveTabId(file.id);
      setActiveFile(file);
    } else {
      setActiveFile(null);
    }
  };

  const handleTabClick = (file: FileItem) => {
    setActiveTabId(file.id);
    setActiveFile(file);
  };

  const handleTabClose = (id: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== id);
    setOpenTabs(newTabs);

    if (activeTabId === id) {
      const newActiveTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
      setActiveTabId(newActiveTab?.id || null);
      setActiveFile(newActiveTab);
    }
  };

  const handleRunCode = () => {
    if (!activeFile) {
      console.warn("No active file to run");
      return;
    }

    const content = activeFile.content || "";
    const language = activeFile.language || "javascript";

    console.log(`Running ${language} code:`, content);

    switch (language) {
      case "javascript":
      case "typescript":
        try {
          const result = new Function(content)();
          console.log("JavaScript execution result:", result);
        } catch (error) {
          console.error("JavaScript execution error:", error);
        }
        break;
      case "html":
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(content);
          newWindow.document.close();
        }
        break;
      default:
        console.log("Code execution for", language, ":", content);
        break;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* File Explorer Sidebar */}
        <div className="w-64 border-r border-gray-700">
          <FileExplorer
            files={files}
            onFileSelect={handleFileSelect}
            onNewFile={() => setActiveFile(null)}
            onDeleteFile={() => setActiveFile(null)}
            onRefresh={refreshFiles}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col relative h-screen w-screen">
          {/* Tabs */}


          {/* Editor Content */}
          <div className="flex-1">
            <EditorPane
              file={activeFile}
              onSave={saveFile}
              onContentChange={handleContentChange}
              onRunCode={handleRunCode}
              openTabs={openTabs}
              activeTab={activeTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
            />
          </div>

          {/* Bottom Panels */}
          <div className="w-full h-60 overflow-hidden absolute bottom-0 left-0 right-0 flex">
            {panels.terminal && <TerminalPanel />}
            {panels.search && <SearchPanel isVisible={panels.search} />}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

export default function HomePage() {
  return (
    <EditorProvider>
      <ContextMenuProvider>
        <EditorLayout />
      </ContextMenuProvider>
    </EditorProvider>
  );
}