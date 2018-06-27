"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const neovim_1 = require("neovim");
const logger = require('./util/logger')('index');
const countRegex = /Found\s(\d+)\serror/;
const startRegex = /File\s+change\s+detected/;
const errorRegex = /^(.+):(\d+):(\d+)\s-\s(\w+)\s(.*)$/;
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["Error"] = 0] = "Error";
    ErrorType[ErrorType["Warning"] = 1] = "Warning";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
var State;
(function (State) {
    State["Init"] = "init";
    State["Compiling"] = "compiling";
    State["Error"] = "error";
    State["Stopped"] = "stopped";
    State["Running"] = "running";
})(State = exports.State || (exports.State = {}));
let TsPlugin = class TsPlugin {
    constructor(nvim) {
        this.errors = [];
        this.attached = false;
        this.nvim = nvim;
    }
    onInit() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let buffers = yield this.nvim.buffers;
            if (!this.attached) {
                for (let buf of buffers) {
                    let name = yield this.nvim.call('bufname', [buf.id]);
                    if (/^term:\/\//.test(name)
                        && name.indexOf('tsconfig.json') !== -1) {
                        let buftype = yield buf.getOption('buftype');
                        if (buftype !== 'terminal') {
                            yield this.nvim.call('tsc#open', [buf.id]);
                        }
                        yield this.attachTerminal(buf);
                    }
                }
            }
        });
    }
    onTerminalOpen() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let buffer = yield this.nvim.buffer;
            yield this.attachTerminal(buffer);
        });
    }
    attachTerminal(buffer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.unlisten = buffer.listen('lines', (buf, tick, firstline, lastline, linedata) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield this.onLinesChange(linedata);
            }));
            this.attached = true;
            this.state = State.Running;
        });
    }
    onTerminalClose() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                this.unlisten();
                this.state = State.Stopped;
                this.attached = false;
            }
            catch (e) {
                // tsd
            }
        });
    }
    onLinesChange(linedata) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (let line of linedata) {
                if (startRegex.test(line)) {
                    this.state = State.Compiling;
                    this.errors = [];
                }
                else if (errorRegex.test(line)) {
                    let ms = line.match(errorRegex);
                    this.errors.push({
                        filename: ms[1],
                        lnum: Number(ms[2]),
                        col: Number(ms[3]),
                        type: /error/.test(ms[4]) ? ErrorType.Error : ErrorType.Warning,
                        text: ms[5]
                    });
                }
                else if (countRegex.test(line)) {
                    let ms = line.match(countRegex);
                    if (ms[1] == '0') {
                        this.errors = [];
                        this.state = State.Running;
                    }
                    else {
                        this.state = State.Error;
                    }
                    let obj = yield this.nvim.call('getqflist', [{ title: 1 }]);
                    let action = obj.title && obj.title.indexOf('Results of tsc') != -1 ? 'r' : ' ';
                    yield this.nvim.call('setqflist', [this.errors, action, 'Results of tsc']);
                }
            }
            return;
        });
    }
    set state(s) {
        this.nvim.setVar('tsc_status', s).catch(e => {
            // noop
        });
    }
};
tslib_1.__decorate([
    neovim_1.Function('TstoolInit', { sync: false })
], TsPlugin.prototype, "onInit", null);
tslib_1.__decorate([
    neovim_1.Function('TscTerminalOpen', { sync: true })
], TsPlugin.prototype, "onTerminalOpen", null);
tslib_1.__decorate([
    neovim_1.Function('TscTerminalClose', { sync: true })
], TsPlugin.prototype, "onTerminalClose", null);
TsPlugin = tslib_1.__decorate([
    neovim_1.Plugin({ dev: false })
], TsPlugin);
exports.default = TsPlugin;
//# sourceMappingURL=index.js.map