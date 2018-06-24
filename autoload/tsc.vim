" init error stopped running
let g:tsc_status = 'init'

function! s:Run(cwd, command)
  let old_cwd = getcwd()
  execute 'lcd ' . a:cwd
  execute 'belowright 5new'
  setl winfixheight
  setl norelativenumber
  call termopen(a:command)
  execute 'setl statusline='.substitute(a:command, ' ', '\\ ', 'g')
  execute 'normal! G'
  execute 'wincmd p'
  execute 'lcd ' . old_cwd
endfunction

function! tsc#open(bufnr) abort
  if bufwinnr(a:bufnr) != -1
    return
  endif
  execute 'belowright 5new'
  setl winfixheight
  setl norelativenumber
  execute 'b '.a:bufnr
  call timer_start(10, function('s:on_open'))
endfunction

function! s:on_open(...) abort
  quit
endfunction

function! tsc#start(...)
  if g:tsc_status !=# 'init' && g:tsc_status !=# 'stopped'
    return
  endif
  let args = copy(a:000)
  call extend(args, ['-p', 'tsconfig.json', '--watch', 'true'])
  let f = findfile('tsconfig.json', '.;')
  if empty(f)
    echohl Error | echon 'tsconfig.json not found' | echohl None
    return
  endif
  let cwd = fnamemodify(f, ':p:h')
  let file = findfile('package.json', '.;')
  if !empty(file)
    let root = fnamemodify(f, ':p:h')
    let exe = root . '/node_modules/.bin/tsc'
    let cmd = executable(exe) ? exe : ''
    let cmd = './' . cmd[len(cwd) + 1:]
  endif
  if empty(cmd)
    let cmd = executable('tsc') ? 'tsc' : ''
  endif
  if empty(cmd)
    echohl Error | echon 'executable tsc not found' | echohl None
    return
  endif
  let command = cmd .' '. join(args, ' ')
  call s:Run(cwd, command)
endfunction
