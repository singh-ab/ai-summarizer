Add-Type -AssemblyName System.Drawing

$iconPath = $PSScriptRoot
$sizes = @(16, 32, 48, 128)

Write-Host "Creating icon placeholders..." -ForegroundColor Cyan

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    $backgroundColor = [System.Drawing.Color]::FromArgb(66, 133, 244)
    $brush = New-Object System.Drawing.SolidBrush($backgroundColor)
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    
    $fontSize = [Math]::Max(8, [int]($size / 2.5))
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $graphics.DrawString("AI", $font, $textBrush, $rect, $format)
    
    $outputPath = Join-Path $iconPath "icon$size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created icon$size.png" -ForegroundColor Green
    
    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    $brush.Dispose()
}

Write-Host "All icons created successfully!" -ForegroundColor Green
