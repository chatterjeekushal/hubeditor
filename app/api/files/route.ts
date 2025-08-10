
// app/api/files/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const workspaceDir = path.join(process.cwd(), "user_workspace");

interface FileNode {
    id: string;
    name: string;
    type: "file" | "folder";
    path: string;
    children?: FileNode[];
}

/**
 * Recursively builds a directory tree.
 */
function getDirectoryTree(dirPath: string, basePath = ""): FileNode[] {
    if (!fs.existsSync(dirPath)) return [];

    return fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
            return {
                id: relativePath,
                name: entry.name,
                type: "folder",
                path: relativePath,
                children: getDirectoryTree(fullPath, relativePath),
            };
        } else {
            return {
                id: relativePath,
                name: entry.name,
                type: "file",
                path: relativePath,
            };
        }
    });
}

export async function GET() {
    try {
        // Ensure workspace exists
        if (!fs.existsSync(workspaceDir)) {
            fs.mkdirSync(workspaceDir, { recursive: true });
        }

        // Get directory tree
        const tree = getDirectoryTree(workspaceDir);
        return NextResponse.json(tree);
    } catch (error) {
        console.error("Error reading workspace:", error);
        return NextResponse.json(
            { error: "Failed to read workspace" },
            { status: 500 }
        );
    }
}
