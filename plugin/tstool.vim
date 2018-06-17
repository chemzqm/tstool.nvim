if exists('did_tstool_loaded') || v:version < 700 || !has('nvim')
  finish
endif
let did_tstool_loaded = 1
let s:test_bufnr = 0

function! s:init()
  augroup tstool
    autocmd!
    autocmd TermOpen tsc*tsconfig.json* :call TscTerminalOpen()
    autocmd TermClose tsc*tsconfig.json* :silent! call TscTerminalClose()
  augroup end
  try
    call TstoolInit()
  catch /^Vim\%((\a\+)\)\=:E117/
    echohl Error | echon '[tstool.nvim] try :UpdateRemotePlugins and restart' | echohl None
  endtry
endfunction

function! s:JestStart(...)
  if get(s:, 'test_bufnr', 0)
    execute 'silent! bd! ' . s:test_bufnr
  endif
  let f = bufname('%')
  let lnum = line('.')
  while lnum >= 1
    let line = getline(lnum)
    let ms = matchlist(line, '\%(test\|it\)(''\(.*\)'',')
    if !empty(ms)
      let name = ms[1]
      break
    endif
    let lnum = lnum - 1
  endw
  if !exists('name') | return | endif
  let cmd = 'jest '. f . " -t '". name ."'"
  execute 'belowright 5new'
  setl winfixheight
  setl norelativenumber
  let s:test_bufnr = bufnr('%')
  call termopen(cmd, {
        \ 'on_exit': function('s:OnExit'),
        \ 'buffer_nr': bufnr('%'),
        \})
  execute 'normal! G'
  execute 'wincmd p'
endfunction

function! s:OnExit(job_id, status, event) dict
  if a:status == 0
    echohl MoreMsg | echo 'Test passed!' | echohl None
    execute 'silent! bd! '.self.buffer_nr
  endif
endfunction

command! -nargs=0 Tslint :call tslint#lint()
command! -nargs=* Tsc    :call tsc#start(<f-args>)
command! -nargs=* Tstest :call s:JestStart(<f-args>)

autocmd VimEnter * call s:init()
