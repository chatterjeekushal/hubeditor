
"use client";

import { useEffect, useState } from "react";
import { EditorProvider, useEditor } from "../lib/EditorContext";
import ContextMenuProvider from "../providers/ContextMenuProvider";
import Toolbar from "../components/editor/Toolbar";
import FileExplorer from "../components/editor/FileExplorer";
import EditorPane from "../components/editor/EditorPane";
import StatusBar from "../components/editor/StatusBar";
import TerminalPanel from "../components/panels/TerminalPanel";
import SearchPanel from "../components/panels/SearchPanel";
import { FileItem } from "../types/editor";

function EditorLayout() {
  const { activeFile, setActiveFile, saveFile, files, setFiles, panels } = useEditor();

  // Fetch workspace files on load
  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch("/api/files");
        if (!res.ok) throw new Error("Failed to load files");
        const data: FileItem[] = await res.json();
        setFiles(data);
      } catch (err) {
        console.error("Error loading files:", err);
      }
    }
    loadFiles();
  }, [setFiles]);

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

  const refreshFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error refreshing files:", error);
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