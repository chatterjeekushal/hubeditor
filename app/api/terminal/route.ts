
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';


interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}


const workspaceDir = path.join(process.cwd(), 'user_workspace');
if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
}



function execCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            resolve({
                stdout,
                stderr,
                code: error && (error as any).code ? (error as any).code : 0,
            });
        });
    });
}

function getDirectoryTree(dirPath: string): FileNode[] {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            return {
                name: entry.name,
                type: 'folder',
                children: getDirectoryTree(fullPath)
            };
        } else {
            return {
                name: entry.name,
                type: 'file'
            };
        }
    });
}
export async function POST(req: NextRequest) {
    try {
        const { command, cwd = '' } = await req.json();

        if (!command || typeof command !== 'string') {
            return NextResponse.json({ error: 'No command provided' }, { status: 400 });
        }

        // Sanitize cwd - prevent directory traversal outside workspace
        let execPath = path.join(workspaceDir, cwd);
        if (!execPath.startsWith(workspaceDir)) {
            execPath = workspaceDir;
        }

        if (!fs.existsSync(execPath)) {
            return NextResponse.json({ error: 'Directory does not exist' }, { status: 400 });
        }

        // Execute the command
        const result = await execCommand(command, execPath);

        // Get updated file/folder structure of workspace
        const workspaceTree = getDirectoryTree(workspaceDir);

        return NextResponse.json({
            ...result,
            workspaceTree
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
