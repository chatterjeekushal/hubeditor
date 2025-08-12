
'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import 'xterm/css/xterm.css';

const HOME = '~'; // represent workspaceDir root as ~

function normalizePath(path: string) {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export default function TerminalPanel() {
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const term = useRef<Terminal | null>(null);
    const commandBuffer = useRef<string>('');
    const [currentPath, setCurrentPath] = useState<string>(HOME);

    useEffect(() => {
        const terminal = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: { background: '#1e1e1e', foreground: '#ffffff' },
        });

        term.current = terminal;
        terminal.open(terminalRef.current!);

        const prompt = () => {
            terminal.write(`\r\nuser@devsphere:${currentPath}$ `);
            commandBuffer.current = '';
        };

        const scrollToBottom = () => {
            terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
        };

        const resolvePath = (cwd: string, target: string): string => {
            if (target === '') return cwd;
            if (target.startsWith('/')) {
                return normalizePath(target === '/' ? HOME : target.replace(/^~?/, ''));
            } else if (target === '~') {
                return HOME;
            } else if (target === '..') {
                if (cwd === HOME) return HOME;
                const parts = cwd.split('/').filter(Boolean);
                parts.pop();
                return parts.length ? '/' + parts.join('/') : HOME;
            } else {
                if (cwd === HOME) return normalizePath('/' + target);
                else return normalizePath(cwd + '/' + target);
            }
        };

        const executeCommand = async (inputCommand: string) => {
            const trimmedCmd = inputCommand.trim();

            // Handle 'cd' locally
            if (trimmedCmd.startsWith('cd ')) {
                const targetDir = trimmedCmd.slice(3).trim();
                const newPath = resolvePath(currentPath, targetDir);
                setCurrentPath(newPath);
                prompt();
                scrollToBottom();
                return;
            }

            terminal.write(`\r\nRunning: ${inputCommand}\r\n`);

            try {
                const res = await fetch('/api/terminal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: trimmedCmd, cwd: currentPath === HOME ? '' : currentPath }),
                });

                const data = await res.json();

                // ✅ Detect clear-screen marker from backend
                if (data.stdout === '__CLEAR_SCREEN__') {
                    terminal.clear(); // completely wipe screen & history
                    prompt();
                    scrollToBottom();
                    return;
                }

                if (data.stdout) terminal.write(data.stdout.replace(/\n/g, '\r\n'));
                if (data.stderr) terminal.write(data.stderr.replace(/\n/g, '\r\n'));
                if (data.error) terminal.write(`Error: ${data.error}\r\n`);
            } catch (err: any) {
                terminal.write(`Error: ${err.message}\r\n`);
            }

            prompt();
            scrollToBottom();
        };

        terminal.writeln('Welcome to DevSphere Terminal 🖥️');
        terminal.writeln('Type a command and press Enter to execute');
        prompt();

        terminal.onKey(({ key, domEvent }) => {
            const ev = domEvent;
            const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

            if (ev.key === 'Enter') {
                const command = commandBuffer.current.trim();
                if (command) {
                    executeCommand(command);
                } else {
                    prompt();
                }
            } else if (ev.key === 'Backspace') {
                if (commandBuffer.current.length > 0) {
                    terminal.write('\b \b');
                    commandBuffer.current = commandBuffer.current.slice(0, -1);
                }
            } else if (printable) {
                terminal.write(key);
                commandBuffer.current += key;
            }
            scrollToBottom();
        });

        return () => {
            terminal.dispose();
        };
    }, [currentPath]);

    return <div ref={terminalRef} style={{ height: '100px', width: '100%', zIndex: 6 }} />;
}
