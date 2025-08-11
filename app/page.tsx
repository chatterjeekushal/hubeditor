
"use client";

import { useEffect, useCallback } from "react";
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

function EditorLayout() {




  const { activeFile, setActiveFile, saveFile, files, setFiles, panels } = useEditor();

  const refreshFiles = useCallback(async (changeData?: { event: string; path: string }) => {
    try {
      // Always use functional updates for state
      if (changeData?.event === 'unlink' || changeData?.event === 'unlinkDir') {
        setFiles(prev => prev.filter(file => !file.path.startsWith(changeData.path)));
        return;
      }

      if (changeData?.event === 'change') {
        try {
          const response = await fetch(`/api/files?path=${encodeURIComponent(changeData.path)}`);
          const updatedFile = await response.json();
          setFiles(prev => prev.map(file => file.path === changeData.path ? updatedFile : file));
          return;
        } catch (error) {
          console.error("Failed to update single file:", error);
        }
      }

      // Fallback to full refresh
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error in refreshFiles:", error);
    }
  }, [setFiles]);

  // Initialize file watcher
  useFileWatcher(refreshFiles);

  // Initial load
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);





  // Use the file watcher hook with the enhanced refresh
  useFileWatcher(refreshFiles);

  // Fetch workspace files on load
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const handleContentChange = (content: string) => {
    if (activeFile) {
      setActiveFile({ ...activeFile, content });
    }
  };

  const handleFileSelect = (file: FileItem) => {
    setActiveFile(file);
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
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <EditorPane
              file={activeFile}
              onSave={saveFile}
              onContentChange={handleContentChange}
              onRunCode={handleRunCode}
            />
          </div>

          {/* Bottom Panels */}
          <div className="h-64 border-t border-gray-700">
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