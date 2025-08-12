
declare module 'terminal-in-react' {
    import { Component } from 'react';

    interface TerminalProps {
        color?: string;
        backgroundColor?: string;
        barColor?: string;
        style?: React.CSSProperties;
        commands?: Record<string, (...args: string[]) => void | string>;
        descriptions?: Record<string, string>;
        msg?: string;
    }

    export default class Terminal extends Component<TerminalProps> { }
}
