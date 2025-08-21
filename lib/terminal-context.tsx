
// terminal-context.tsx
import { createContext, useContext, useRef } from 'react';

interface TerminalContextType {
    writeOutput: (output: string) => void;
    executeCommand: (command: string) => Promise<void>;
}

const TerminalContext = createContext<TerminalContextType | null>(null);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
    const writeOutputRef = useRef<(output: string) => void>(() => { });
    const executeCommandRef = useRef<(command: string) => Promise<void>>(async () => { });

    return (
        <TerminalContext.Provider value={{
            writeOutput: (output) => writeOutputRef.current(output),
            executeCommand: (cmd) => executeCommandRef.current(cmd)
        }}>
            {children}
        </TerminalContext.Provider>
    );
}

export function useTerminal() {
    const context = useContext(TerminalContext);
    if (!context) {
        throw new Error('useTerminal must be used within a TerminalProvider');
    }
    return context;
}