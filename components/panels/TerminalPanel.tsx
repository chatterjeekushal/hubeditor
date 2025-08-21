
'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const HOME = '~';

function normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

interface TerminalPanelProps {
    onExecuteCode?: (code: string) => Promise<string>;
}

export default function TerminalPanel({ onExecuteCode }: TerminalPanelProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const term = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const commandBuffer = useRef<string>('');
    const [currentPath, setCurrentPath] = useState<string>(HOME);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);

    const writeOutput = (message: string, type: 'info' | 'error' | 'output' = 'output') => {
        const color = type === 'error' ? '31' : type === 'info' ? '33' : '37';
        term.current?.write(`\r\n\x1b[${color}m${message.replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
        prompt();
        scrollToBottomIfNeeded();
    };

    useEffect(() => {
        const terminal = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
                cursor: '#ffffff',
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            lineHeight: 1.2,
            letterSpacing: 0.5,
            scrollback: 1000,
            disableStdin: false,
            allowProposedApi: true,
        });

        fitAddon.current = new FitAddon();
        terminal.loadAddon(fitAddon.current);
        term.current = terminal;
        terminal.open(terminalRef.current!);
        fitAddon.current.fit();

        const terminalElement = terminalRef.current?.querySelector('.xterm-viewport');
        if (terminalElement) {
            terminalElement.addEventListener('scroll', handleScroll);
        }

        terminal.writeln('\x1b[1;36mWelcome to DevSphere Terminal 🖥️\x1b[0m');
        terminal.writeln('\x1b[2mType commands or run code from the editor\x1b[0m');
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
            scrollToBottomIfNeeded();
        });

        // Expose terminal write function globally
        (window as any).executeInTerminal = writeOutput;

        const handleResize = () => {
            fitAddon.current?.fit();
            scrollToBottomIfNeeded();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            const terminalElement = terminalRef.current?.querySelector('.xterm-viewport');
            if (terminalElement) {
                terminalElement.removeEventListener('scroll', handleScroll);
            }
            terminal.dispose();
            delete (window as any).executeInTerminal;
            delete (window as any).executeCodeInTerminal;
        };
    }, []);

    // Code execution useEffect
    useEffect(() => {
        if (!term.current || !onExecuteCode) return;

        const executeCode = async (code: string) => {
            writeOutput('Running code...', 'info');
            try {
                const result = await onExecuteCode(code);
                writeOutput(result, 'output');
            } catch (err: any) {
                writeOutput(`Error: ${err.message}`, 'error');
            }
        };

        // Expose this function globally
        (window as any).executeCodeInTerminal = executeCode;

        return () => {
            // Clean up
            delete (window as any).executeCodeInTerminal;
        };
    }, [onExecuteCode]);

    const prompt = (): void => {
        term.current?.write(`\r\n\x1b[1;32muser@devsphere\x1b[0m:\x1b[1;34m${currentPath}\x1b[0m$ `);
        commandBuffer.current = '';
        scrollToBottomIfNeeded();
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

    const executeCommand = async (inputCommand: string): Promise<void> => {
        const trimmedCmd = inputCommand.trim();
        const terminal = term.current;

        if (!terminal) return;

        if (trimmedCmd.startsWith('cd ')) {
            const targetDir = trimmedCmd.slice(3).trim();
            const newPath = resolvePath(currentPath, targetDir);
            setCurrentPath(newPath);
            prompt();
            return;
        }

        terminal.write(`\r\n\x1b[33mRunning: ${inputCommand}\x1b[0m\r\n`);

        try {
            const res = await fetch('/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: trimmedCmd,
                    cwd: currentPath === HOME ? '' : currentPath
                }),
            });

            const data = await res.json();

            if (data.stdout === '__CLEAR_SCREEN__') {
                terminal.clear();
                prompt();
                return;
            }

            if (data.stdout) terminal.write(data.stdout.replace(/\n/g, '\r\n'));
            if (data.stderr) terminal.write(`\x1b[31m${data.stderr.replace(/\n/g, '\r\n')}\x1b[0m`);
            if (data.error) terminal.write(`\x1b[31mError: ${data.error}\x1b[0m\r\n`);
        } catch (err: any) {
            terminal.write(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
        }

        prompt();
    };

    const scrollToBottomIfNeeded = (): void => {
        if (shouldAutoScroll) {
            setTimeout(() => {
                term.current?.scrollToBottom();
            }, 10);
        }
    };

    const handleScroll = (): void => {
        const viewport = terminalRef.current?.querySelector('.xterm-viewport') as HTMLElement;
        if (!viewport) return;

        const isAtBottom = viewport.scrollHeight - viewport.clientHeight <= viewport.scrollTop + 10;
        setShouldAutoScroll(isAtBottom);
    };

    const toggleMinimize = (): void => {
        setIsMinimized(!isMinimized);
        setTimeout(() => {
            fitAddon.current?.fit();
        }, 10);
    };

    const toggleFullscreen = (): void => {
        setIsFullscreen(!isFullscreen);
        setTimeout(() => {
            fitAddon.current?.fit();
        }, 10);
    };

    return (
        <div className={`flex flex-col w-full rounded-lg overflow-hidden shadow-lg ${isFullscreen ? 'fixed inset-0 z-50 m-0' : 'relative'}`}>
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm text-gray-300">
                    Terminal - {currentPath}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleMinimize}
                        className="text-gray-400 hover:text-white p-1"
                        aria-label={isMinimized ? "Maximize" : "Minimize"}
                    >
                        {isMinimized ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="text-gray-400 hover:text-white p-1"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div
                ref={terminalRef}
                className={`bg-gray-900 ${isMinimized ? 'hidden' : 'block'} transition-all duration-200 ease-in-out`}
                style={{
                    height: isFullscreen ? 'calc(100vh - 40px)' : '400px',
                    width: '100%',
                    padding: '0.5rem',
                }}
            />
            {isMinimized && (
                <div className="bg-gray-800 text-gray-400 text-sm p-2 cursor-pointer" onClick={toggleMinimize}>
                    Terminal minimized - click to expand
                </div>
            )}
        </div>
    );
}