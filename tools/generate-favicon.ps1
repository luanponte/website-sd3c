Add-Type -AssemblyName System.Drawing

$simboloDir = Join-Path $PSScriptRoot "..\assets\img\simbolo"
$fullDir = [System.IO.Path]::GetFullPath($simboloDir)
$rootDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))

Write-Host "Directory: $fullDir"

# Layer order: blocks first, then the 's', then the icons
$layers = @(
    "blk0.png", "blk1.png", "blk2.png", "blk3.png", "blk4.png", "blk5.png",
    "s.png",
    "ico0.png", "ico1.png", "ico2.png", "ico3.png", "ico4.png", "ico5.png"
)

# 1. Composite all layers into 490x630
$w = 490
$h = 630
$composite = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($composite)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

foreach ($layerName in $layers) {
    $layerPath = Join-Path $fullDir $layerName
    if (Test-Path $layerPath) {
        $img = [System.Drawing.Image]::FromFile($layerPath)
        $g.DrawImage($img, 0, 0, $w, $h)
        $img.Dispose()
    } else {
        Write-Warning "Layer not found: $layerName"
    }
}
$g.Dispose()

# Save the full composite symbol
$fullSymbolPath = Join-Path $fullDir "simbolo-completo.png"
$composite.Save($fullSymbolPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Created composite symbol: $fullSymbolPath"

# 2. Find bounding box of non-transparent pixels
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $h; $y += 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $p = $composite.GetPixel($x, $y)
        if ($p.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Symbol Bounding Box: ($minX, $minY) to ($maxX, $maxY)"
$boxW = $maxX - $minX + 1
$boxH = $maxY - $minY + 1

# Crop tight symbol
$cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $boxW, $boxH)
$tightSymbol = $composite.Clone($cropRect, $composite.PixelFormat)

# 3. Helper to create square favicon of size S with optical padding
function CreateSquareFavicon($sourceBitmap, [int]$size, [string]$outputPath) {
    $square = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g2 = [System.Drawing.Graphics]::FromImage($square)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Add 4% padding
    $pad = [int]($size * 0.04)
    $availSize = $size - ($pad * 2)

    # Scale maintaining aspect ratio
    $scale = [Math]::Min($availSize / $sourceBitmap.Width, $availSize / $sourceBitmap.Height)
    $destW = [int]($sourceBitmap.Width * $scale)
    $destH = [int]($sourceBitmap.Height * $scale)
    $destX = [int](($size - $destW) / 2)
    $destY = [int](($size - $destH) / 2)

    $g2.DrawImage($sourceBitmap, $destX, $destY, $destW, $destH)
    $g2.Dispose()

    $square.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created favicon ($size x $size): $outputPath"
    return $square
}

# Generate 512x512
$fav512Path = Join-Path $fullDir "favicon.png"
$fav512 = CreateSquareFavicon $tightSymbol 512 $fav512Path

# Generate 192x192
$fav192Path = Join-Path $fullDir "favicon-192.png"
$null = CreateSquareFavicon $tightSymbol 192 $fav192Path

# Generate 32x32
$fav32Path = Join-Path $fullDir "favicon-32.png"
$fav32 = CreateSquareFavicon $tightSymbol 32 $fav32Path

# Also copy to root as favicon.png and favicon.ico
$rootFavicon = Join-Path $rootDir "favicon.png"
Copy-Item $fav512Path -Destination $rootFavicon -Force

# Create valid Windows .ICO from 32x32 PNG
$rootIco = Join-Path $rootDir "favicon.ico"
$simboloIco = Join-Path $fullDir "favicon.ico"
$icon = [System.Drawing.Icon]::FromHandle($fav32.GetHicon())
$fileStream = New-Object System.IO.FileStream($rootIco, [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()
Copy-Item $rootIco -Destination $simboloIco -Force

Write-Host "Successfully generated all favicon assets!"

$composite.Dispose()
$tightSymbol.Dispose()
$fav512.Dispose()
$fav32.Dispose()
$icon.Dispose()
