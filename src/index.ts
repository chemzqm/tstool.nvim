import {
  NeovimClient as Neovim,
  Plugin,
  Function,
  Buffer,
} from 'neovim'
const logger = require('./util/logger')('index')

const countRegex = /Found\s(\d+)\serror/
const startRegex = /File\s+change\s+detected/
const errorRegex = /^(.+):(\d+):(\d+)\s-\s(\w+)\s(.*)$/

export enum ErrorType  {
  Error,
  Warning,
}

export enum State {
  Init = 'init',
  Compiling = 'compiling',
  Error = 'error',
  Stopped = 'stopped',
  Running = 'running'
}

export interface ErrorItem {
  filename: string
  lnum: number
  col: number
  type: ErrorType
  text: string
}

@Plugin({dev: false})
export default class TsPlugin {
  private nvim: Neovim
  private unlisten: Function
  private errors: ErrorItem[] = []
  private attached = false

  constructor(nvim: Neovim) {
    this.nvim = nvim
  }

  @Function('TstoolInit', {sync: false})
  public async onInit():Promise<void> {
    let buffers = await this.nvim.buffers
    if (!this.attached) {
      for (let buf of buffers) {
        let name = await this.nvim.call('bufname', [buf.id])
        if (/^term:\/\//.test(name)
            && name.indexOf('tsconfig.json') !== -1) {
          let buftype = await buf.getOption('buftype')
          if (buftype !== 'terminal') {
            await this.nvim.call('tsc#open', [buf.id])
          }
          await this.attachTerminal(buf)
        }
      }
    }
  }

  @Function('TscTerminalOpen', {sync: true})
  public async onTerminalOpen():Promise<void> {
    let buffer = await this.nvim.buffer
    await this.attachTerminal(buffer)
  }

  private async attachTerminal(buffer:Buffer):Promise<void> {
    this.unlisten = buffer.listen('lines', async (buf, tick, firstline, lastline, linedata) => {
      await this.onLinesChange(linedata)
    })
    this.attached = true
    this.state = State.Running
  }

  @Function('TscTerminalClose', {sync: true})
  public async onTerminalClose():Promise<void> {
    try {
      this.unlisten()
      this.state = State.Stopped
      this.attached = false
    } catch (e) {
      // tsd
    }
  }

  private async onLinesChange(linedata:string[]):Promise<void> {
    for (let line of linedata) {
      if (startRegex.test(line)) {
        this.state = State.Compiling
        this.errors = []
      } else if (errorRegex.test(line)) {
        let ms = line.match(errorRegex)
        this.errors.push({
          filename: ms[1],
          lnum: Number(ms[2]),
          col: Number(ms[3]),
          type: /error/.test(ms[4]) ? ErrorType.Error : ErrorType.Warning,
          text: ms[5]
        })
      } else if (countRegex.test(line)) {
        let ms = line.match(countRegex)
        if (ms[1] == '0') {
          this.errors = []
          this.state = State.Running
        } else {
          this.state = State.Error
        }
        let obj = await this.nvim.call('getqflist', [{title: 1}]) as any
        let action = obj.title && obj.title == 'Results of tsc' ? 'r' : ' '
        await this.nvim.call('setqflist', [this.errors, action, 'Results of tsc'])
      }
    }
    return
  }

  private set state(s:string) {
    this.nvim.setVar('tsc_status', s).catch(e => {
      // noop
    })
  }
}
