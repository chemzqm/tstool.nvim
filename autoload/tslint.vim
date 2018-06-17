function! s:IsEmpty(arr)
  if empty(a:arr) | return 1 | endif
  if len(a:arr) == 1 && empty(a:arr[0]) | return 1 | endif
  return 0
endfunction

let s:frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let s:frame_index = 0
let s:timer = 0
let g:tslint_frame = ''

function! s:OnFrame(...) abort
  let g:tslint_frame = s:frames[s:frame_index]
  let s:frame_index += 1
  if s:frame_index == 10
    let s:frame_index = 0
  endif
endfunction

function! s:TslintExit(job, code, event) dict abort
  if s:timer
    call timer_stop(s:timer)
    let s:timer = 0
    let g:tslint_frame = ''
  endif
  if a:code == 0
    echohl MoreMsg | echon 'No issue found' | echohl None
    return
  endif
  if !s:IsEmpty(self.stderr)
    for str in self.stderr
      echohl Error | echon str | echohl None
    endfor
    return
  endif
  let obj = json_decode(self.stdout)
  let arr = []
  for item in obj
    call add(arr, {
          \ 'filename': item['name'],
          \ 'lnum': item['startPosition']['line'] + 1,
          \ 'col': item['startPosition']['character'] + 1,
          \ 'text': item['failure'],
          \ 'type': item['ruleSeverity'] ==? 'ERROR' ? 'E' : 'W',
          \})
  endfor
  call setqflist(arr, 'r', 'Result of tslint')
  echohl Error | echon '[tslint] Found '.len(arr).' errors' | echohl None
endfunction

function! tslint#lint()
  let cwd = fnamemodify(findfile('tslint.json', '.;'), ':p:h')
  if empty(cwd)
    echohl MoreMsg | echon 'tslint.json not found' | echohl None
  endif
  let cmd = 'tslint -c tslint.json -t json -p .'
  let job = jobstart(cmd, {
        \ 'cwd': cwd,
        \ 'stdout_buffered': 1,
        \ 'stderr_buffered': 1,
        \ 'on_exit': function('s:TslintExit'),
        \})
  if job <= 0
    echohl Error | echom 'Can''t run tslint command' | echohl None
  else
    let s:timer = timer_start(80, function('s:OnFrame'), {'repeat': -1})
  endif
endfunction

command! -nargs=0 Tslint :call tslint#lint()
