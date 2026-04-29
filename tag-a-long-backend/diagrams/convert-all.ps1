# PowerShell script to convert all Mermaid diagrams to PNG
# Run: .\convert-all.ps1

Write-Host "🎨 Converting Mermaid Diagrams to PNG..." -ForegroundColor Cyan
Write-Host ""

# Check if mmdc is installed
$mmdcInstalled = Get-Command mmdc -ErrorAction SilentlyContinue

if (-not $mmdcInstalled) {
    Write-Host "❌ Mermaid CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install with: npm install -g @mermaid-js/mermaid-cli" -ForegroundColor Yellow
    Write-Host "Or use npx: Replace 'mmdc' with 'npx -p @mermaid-js/mermaid-cli mmdc'" -ForegroundColor Yellow
    exit 1
}

# Diagram configurations (name, width, height)
$diagrams = @(
    @{name="1-high-level-architecture"; width=1920; height=1080},
    @{name="2-request-flow"; width=1200; height=1600},
    @{name="3-signup-flow"; width=1200; height=1400},
    @{name="4-login-flow"; width=1200; height=1200},
    @{name="5-token-verification"; width=1200; height=1400},
    @{name="6-payment-flow"; width=1200; height=1800},
    @{name="7-database-schema"; width=1600; height=1200},
    @{name="8-technology-stack"; width=1400; height=1000},
    @{name="9-external-services"; width=1600; height=1200},
    @{name="10-api-routes"; width=1400; height=1200},
    @{name="11-complete-architecture"; width=1920; height=1200}
)

$count = 0
$total = $diagrams.Count

foreach ($diagram in $diagrams) {
    $count++
    $input = "$($diagram.name).mmd"
    $output = "$($diagram.name).png"

    Write-Host "[$count/$total] Converting $input..." -ForegroundColor Green

    # Convert with custom dimensions and white background
    mmdc -i $input -o $output -w $diagram.width -H $diagram.height -b white

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Saved to $output" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Failed to convert $input" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ All diagrams converted successfully!" -ForegroundColor Green
Write-Host "📁 Output files are in the current directory" -ForegroundColor Cyan
