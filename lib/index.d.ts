import { NeovimClient as Neovim } from 'neovim';
export declare enum ErrorType {
    Error = 0,
    Warning = 1
}
export declare enum State {
    Init = "init",
    Compiling = "compiling",
    Error = "error",
    Stopped = "stopped",
    Running = "running"
}
export interface ErrorItem {
    filename: string;
    lnum: number;
    col: number;
    type: ErrorType;
    text: string;
}
export default class TsPlugin {
    private nvim;
    private unlisten;
    private errors;
    private attached;
    constructor(nvim: Neovim);
    onInit(): Promise<void>;
    onTerminalOpen(): Promise<void>;
    private attachTerminal;
    onTerminalClose(): Promise<void>;
    private onLinesChange;
    private state;
}
