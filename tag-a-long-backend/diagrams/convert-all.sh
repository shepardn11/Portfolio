#!/bin/bash
# Bash script to convert all Mermaid diagrams to PNG
# Run: chmod +x convert-all.sh && ./convert-all.sh

echo "🎨 Converting Mermaid Diagrams to PNG..."
echo ""

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo "❌ Mermaid CLI not found!"
    echo ""
    echo "Install with: npm install -g @mermaid-js/mermaid-cli"
    echo "Or use npx: npx -p @mermaid-js/mermaid-cli mmdc -i [file].mmd -o [file].png"
    exit 1
fi

# Array of diagrams (name:width:height)
diagrams=(
    "1-high-level-architecture:1920:1080"
    "2-request-flow:1200:1600"
    "3-signup-flow:1200:1400"
    "4-login-flow:1200:1200"
    "5-token-verification:1200:1400"
    "6-payment-flow:1200:1800"
    "7-database-schema:1600:1200"
    "8-technology-stack:1400:1000"
    "9-external-services:1600:1200"
    "10-api-routes:1400:1200"
    "11-complete-architecture:1920:1200"
)

count=0
total=${#diagrams[@]}

for diagram in "${diagrams[@]}"; do
    count=$((count + 1))

    # Split by colon
    IFS=':' read -r name width height <<< "$diagram"

    input="${name}.mmd"
    output="${name}.png"

    echo "[$count/$total] Converting $input..."

    # Convert with custom dimensions and white background
    mmdc -i "$input" -o "$output" -w "$width" -H "$height" -b white

    if [ $? -eq 0 ]; then
        echo "  ✓ Saved to $output"
    else
        echo "  ✗ Failed to convert $input"
    fi
done

echo ""
echo "✅ All diagrams converted successfully!"
echo "📁 Output files are in the current directory"
