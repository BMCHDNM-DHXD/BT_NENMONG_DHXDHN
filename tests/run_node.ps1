# Chạy script Node bằng Node đi kèm VS Code (máy không cài Node riêng): .\tests\run_node.ps1 tests\clo2_check.js [đối số]
$env:ELECTRON_RUN_AS_NODE = '1'
$code = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe"
$o = "$env:TEMP\nodeout.txt"; $e = "$env:TEMP\nodeerr.txt"
$p = Start-Process -FilePath $code -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $o -RedirectStandardError $e
Get-Content $o -Encoding UTF8; Get-Content $e -Encoding UTF8 | Select-Object -First 15; "exit $($p.ExitCode)"
