

export { };

declare global {
    interface Window {
        executeInTerminal: (output: string) => void;
        executeCodeInTerminal: (code: string) => Promise<void>; // Added this line
    }
}