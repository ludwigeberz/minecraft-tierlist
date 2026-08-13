# ============================================================
#  Baut aus index.html + css + js eine einzige Datei:
#  dist/index.html
#
#  Die wird ins Netz gestellt. Nach jeder Aenderung an den
#  Quelldateien einmal ausfuehren:
#      powershell -ExecutionPolicy Bypass -File build.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-Utf8($relative) {
  $path = Join-Path $root $relative
  if (-not (Test-Path $path)) { throw "Datei fehlt: $relative" }
  return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

$html = Read-Utf8 'index.html'

# --- CSS einbetten ---
$css = Read-Utf8 'css/style.css'
$html = $html.Replace(
  '<link rel="stylesheet" href="css/style.css">',
  "<style>`n$css`n</style>")

# --- JavaScript einbetten (Reihenfolge zaehlt) ---
foreach ($file in @('config', 'data', 'app', 'admin')) {
  $js = Read-Utf8 "js/$file.js"
  $html = $html.Replace(
    "<script src=""js/$file.js""></script>",
    "<script>`n$js`n</script>")
}

# --- Schreiben ---
$dist = Join-Path $root 'dist'
if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist | Out-Null }

$out = Join-Path $dist 'index.html'
[System.IO.File]::WriteAllText($out, $html, (New-Object System.Text.UTF8Encoding($false)))

$kb = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Output "dist/index.html geschrieben - $kb KB"

# --- Kontrolle: nichts vergessen? ---
if ($html -match 'href="css/') { Write-Warning 'CSS wurde NICHT eingebettet.' }
if ($html -match 'src="js/')   { Write-Warning 'JavaScript wurde NICHT eingebettet.' }
