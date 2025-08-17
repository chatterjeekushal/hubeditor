
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

function mapCommand(command: string): string {
    if (process.platform === 'win32') {
        const parts = command.trim().split(' ');
        switch (parts[0]) {
            case 'ls':
                return command.replace(/^ls/, 'dir');
            case 'touch':
                if (parts[1]) {
                    return `type nul > ${parts[1]}`;
                }
                return 'echo No filename provided';
            case 'clear':
            case 'cls':
                return 'cls';
            default:
                return command;
        }
    }
    return command;
}

function execCommand(
    command: string,
    cwd: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve) => {
        exec(
            command,
            {
                cwd: cwd,
                shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
            },
            (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
                let code: number | null = null;
                if (error) {
                    const err = error as NodeJS.ErrnoException;
                    code = typeof err.code === 'number' ? err.code : 1;
                }
                resolve({
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    code: code
                });
            }
        );
    });
}

function getDirectoryTree(dirPath: string): FileNode[] {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            return {
                name: entry.name,
                type: 'folder',
                children: getDirectoryTree(fullPath),
            };
        }
        return {
            name: entry.name,
            type: 'file',
        };
    });
}

export async function POST(req: NextRequest) {
    try {
        const { command, cwd = '' } = await req.json();

        if (!command || typeof command !== 'string') {
            return NextResponse.json(
                { error: 'No command provided' },
                { status: 400 }
            );
        }

        if (command.trim().toLowerCase() === 'cls') {
            return NextResponse.json({
                stdout: '__CLEAR_SCREEN__',
                stderr: '',
                code: 0,
                workspaceTree: getDirectoryTree(workspaceDir),
            });
        }

        let execPath = path.join(workspaceDir, cwd);
        if (!execPath.startsWith(workspaceDir)) {
            execPath = workspaceDir;
        }
        if (!fs.existsSync(execPath)) {
            return NextResponse.json(
                { error: 'Directory does not exist' },
                { status: 400 }
            );
        }

        const safeCommand = mapCommand(command);
        const result = await execCommand(safeCommand, execPath);
        const workspaceTree = getDirectoryTree(workspaceDir);

        return NextResponse.json({
            ...result,
            workspaceTree,
        });
    } catch (err: unknown) {
        const error = err as Error;
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}