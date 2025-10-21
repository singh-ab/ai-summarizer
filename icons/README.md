# Icon Files Needed

This extension requires icon files in the following sizes:

- 16x16 pixels (icon16.png)
- 32x32 pixels (icon32.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

## How to Create Icons

You can create icons using any image editor or online tool. Here are some options:

### Option 1: Online Icon Generator

1. Visit https://www.favicon-generator.org/ or similar tool
2. Upload an image or create a simple design
3. Download the generated icons in different sizes
4. Rename them to match the required names above

### Option 2: Simple Text Icons

For a quick start, you can create simple colored squares with "AI" text:

- Use any image editor (Paint, GIMP, Photoshop, etc.)
- Create a square canvas
- Add a solid color background (e.g., #4285f4 - Google Blue)
- Add white "AI" text in the center
- Save in the required sizes

### Option 3: Use Emoji/Unicode

Create PNG files with an emoji (🤖 or 📝) as the icon

### Temporary Solution

Until you create proper icons, you can use placeholder images. The extension will still work, just with broken icon display in Chrome's toolbar and extensions page.

## Quick Setup with PowerShell

You can generate simple colored placeholder icons using this PowerShell script:

```powershell
# This creates simple solid-color PNG files as placeholders
# For proper icons, use an image editor

Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)
$color = [System.Drawing.Color]::FromArgb(66, 133, 244) # Google Blue

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $brush = New-Object System.Drawing.SolidBrush($color)
    $graphics.FillRectangle($brush, 0, 0, $size, $size)

    # Add "AI" text
    $font = New-Object System.Drawing.Font("Arial", [int]($size/3), [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $text = "AI"
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($size - $textSize.Width) / 2
    $y = ($size - $textSize.Height) / 2
    $graphics.DrawString($text, $font, $textBrush, $x, $y)

    $bitmap.Save("$PSScriptRoot\icon$size.png")
    $graphics.Dispose()
    $bitmap.Dispose()
}

Write-Host "Icon placeholders created successfully!"
```

Save this as `create-icons.ps1` in the icons folder and run it.
