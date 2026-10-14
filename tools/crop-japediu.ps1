Add-Type -AssemblyName System.Drawing

$filePath = Join-Path $PSScriptRoot "..\assets\img\logo\japediu.png"
$fullPath = [System.IO.Path]::GetFullPath($filePath)

$src = [System.Drawing.Bitmap]::FromFile($fullPath)
$w = $src.Width
$h = $src.Height

$minX = $w
$minY = $h
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $h; $y += 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $pixel = $src.GetPixel($x, $y)
        if ($pixel.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Bounding box: ($minX, $minY) to ($maxX, $maxY)"
$cropW = [Math]::Max(1, $maxX - $minX + 1)
$cropH = [Math]::Max(1, $maxY - $minY + 1)

# Add 2% padding
$pad = [int]($cropH * 0.04)
$finalX = [Math]::Max(0, $minX - $pad)
$finalY = [Math]::Max(0, $minY - $pad)
$finalW = [Math]::Min($w - $finalX, $cropW + ($pad * 2))
$finalH = [Math]::Min($h - $finalY, $cropH + ($pad * 2))

$rect = New-Object System.Drawing.Rectangle($finalX, $finalY, $finalW, $finalH)
$cropped = $src.Clone($rect, $src.PixelFormat)
$src.Dispose()

$tempPath = Join-Path $PSScriptRoot "..\assets\img\logo\japediu_cropped.png"
$cropped.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

Move-Item -Path $tempPath -Destination $fullPath -Force
Write-Host "Successfully cropped japediu.png to $finalW x $finalH"
