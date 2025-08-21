
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
import { FiX, FiMaximize2, FiMinimize2, FiSettings, FiSearch, FiTerminal, FiFolder, FiCode } from "react-icons/fi";

function EditorLayout() {
  const { activeFile, setActiveFile, saveFile, files, setFiles, panels } = useEditor();
  const [openTabs, setOpenTabs] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(280);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activePanel, setActivePanel] = useState('terminal');
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);

  const refreshFiles = useCallback(async (changeData?: { event: string; path: string }) => {
    try {
      if (changeData?.event === 'unlink' || changeData?.event === 'unlinkDir') {
        setFiles(prev => prev.filter(file => file.path && !file.path.startsWith(changeData.path)));
        setOpenTabs(prev => prev.filter(tab => tab.path && !tab.path.startsWith(changeData.path)));
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

  const handlePanelResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPanel(true);
    const startY = e.clientY;
    const startHeight = panelHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = startHeight + (startY - moveEvent.clientY);
      setPanelHeight(Math.min(Math.max(newHeight, 120), 600));
    };

    const onMouseUp = () => {
      setIsDraggingPanel(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setSidebarWidth(Math.min(Math.max(newWidth, 200), 500));
    };

    const onMouseUp = () => {
      setIsDraggingSidebar(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleExecuteCode = async (code: string): Promise<string> => {
    try {
      const language = activeFile?.language || "javascript";
      const res = await fetch("/api/runcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      return data.output || data.result || "✅ Done (no output)";
    } catch (err: any) {
      console.error("Execution error:", err);
      return `❌ Error: ${err.message}`;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      {/* Enhanced Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 shadow-lg">
        <Toolbar />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Sidebar */}
        <div
          className="bg-slate-800 border-r border-slate-700 flex flex-col shadow-lg transition-all duration-200"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Sidebar Header */}
          <div className="h-10 bg-slate-750 border-b border-slate-700 flex items-center justify-between px-3">
            <div className="flex items-center space-x-2">
              <FiFolder className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">EXPLORER</span>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-1 hover:bg-slate-600 rounded transition-colors">
                <FiSettings className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* File Explorer */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
            <FileExplorer
              files={files}
              onFileSelect={handleFileSelect}
              onNewFile={() => setActiveFile(null)}
              onDeleteFile={() => setActiveFile(null)}
              onRefresh={refreshFiles}
            />
          </div>
        </div>

        {/* Sidebar Resize Handle */}
        <div
          className={`w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors ${isDraggingSidebar ? 'bg-blue-500' : ''
            }`}
          onMouseDown={handleSidebarResize}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-900">
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

          {/* Panel Resize Handle */}
          <div
            className={`h-2 bg-slate-700 hover:bg-blue-500 cursor-ns-resize transition-colors relative ${isDraggingPanel ? 'bg-blue-500' : ''
              }`}
            onMouseDown={handlePanelResize}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-600 rounded-full opacity-50" />
            </div>
          </div>

          {/* Enhanced Bottom Panel */}
          <div
            className="bg-slate-800 border-t border-slate-700 overflow-hidden shadow-lg"
            style={{ height: isMinimized ? '32px' : `${panelHeight}px` }}
          >
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="h-8 bg-slate-750 border-b border-slate-700 flex items-center justify-between px-3">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActivePanel('terminal')}
                    className={`flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded transition-colors ${activePanel === 'terminal'
                      ? 'text-blue-400 bg-slate-600'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                  >
                    <FiTerminal className="w-3 h-3" />
                    <span>Terminal</span>
                  </button>
                  <button
                    onClick={() => setActivePanel('search')}
                    className={`flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded transition-colors ${activePanel === 'search'
                      ? 'text-blue-400 bg-slate-600'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                  >
                    <FiSearch className="w-3 h-3" />
                    <span>Search</span>
                  </button>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    {isMinimized ? (
                      <FiMaximize2 className="w-3 h-3 text-slate-400" />
                    ) : (
                      <FiMinimize2 className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              {!isMinimized && (
                <div className="flex-1 overflow-hidden">
                  {activePanel === 'terminal' && (
                    <TerminalPanel onExecuteCode={handleExecuteCode} />
                  )}
                  {activePanel === 'search' && <SearchPanel isVisible={activePanel === 'search'} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Status Bar */}
      <div className="h-6 bg-slate-700 border-t border-slate-600 flex items-center justify-between px-3 text-xs">
        <StatusBar />
      </div>

      {/* Overlay for dragging states */}
      {(isDraggingPanel || isDraggingSidebar) && (
        <div className="fixed inset-0 z-50 cursor-col-resize" style={{ cursor: isDraggingPanel ? 'ns-resize' : 'col-resize' }} />
      )}
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