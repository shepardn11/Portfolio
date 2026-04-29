# Architecture Diagrams - Export Guide

This folder contains **11 individual Mermaid diagram files** ready for export to PNG, SVG, or PDF.

---

## 📁 Diagram Files

| File | Description | Best Export Size |
|------|-------------|------------------|
| `1-high-level-architecture.mmd` | Overall system architecture | 1920x1080 |
| `2-request-flow.mmd` | Detailed request flow (sequence) | 1200x1600 |
| `3-signup-flow.mmd` | User signup flow (sequence) | 1200x1400 |
| `4-login-flow.mmd` | User login flow (sequence) | 1200x1200 |
| `5-token-verification.mmd` | JWT token verification (sequence) | 1200x1400 |
| `6-payment-flow.mmd` | Payment & subscription flow (sequence) | 1200x1800 |
| `7-database-schema.mmd` | Database ER diagram | 1600x1200 |
| `8-technology-stack.mmd` | Tech stack overview | 1400x1000 |
| `9-external-services.mmd` | External integrations | 1600x1200 |
| `10-api-routes.mmd` | API endpoint map | 1400x1200 |
| `11-complete-architecture.mmd` | Complete system summary | 1920x1200 |

---

## 🚀 Quick Export Methods

### **Method 1: Online (Easiest)**

**For Single Diagram:**
1. Go to **https://mermaid.live/**
2. Copy content from any `.mmd` file
3. Paste into left panel
4. Click **"Actions" → "PNG"** or **"SVG"**
5. Download image

**For All Diagrams:**
- Repeat for each `.mmd` file (11 total)
- Takes ~5 minutes total

---

### **Method 2: VS Code**

**Prerequisites:**
```bash
# Install extension in VS Code
1. Press Ctrl+Shift+X
2. Search "Markdown Preview Mermaid Support"
3. Install by Matt Bierner
```

**Export Steps:**
```bash
# Option A: Individual diagram
1. Open any .mmd file
2. Wrap in markdown code block:
   ```mermaid
   [paste content here]
   ```
3. Preview (Ctrl+Shift+V)
4. Right-click → Copy Image

# Option B: Batch export
1. Create markdown file with all diagrams
2. Preview entire document
3. Print to PDF (Ctrl+P → Save as PDF)
```

---

### **Method 3: Command Line (Advanced)**

**Install Mermaid CLI:**
```bash
npm install -g @mermaid-js/mermaid-cli
```

**Convert Single Diagram:**
```bash
# PNG export
mmdc -i 1-high-level-architecture.mmd -o 1-high-level-architecture.png

# With options
mmdc -i 1-high-level-architecture.mmd -o output.png -t dark -w 1920 -H 1080 -b white
```

**Convert All Diagrams:**

**Windows (PowerShell):**
```powershell
# Export all to PNG
Get-ChildItem *.mmd | ForEach-Object {
    $output = $_.Name -replace '\.mmd$', '.png'
    mmdc -i $_.Name -o $output -w 1920 -H 1080
}
```

**Mac/Linux (Bash):**
```bash
# Export all to PNG
for f in *.mmd; do
    mmdc -i "$f" -o "${f%.mmd}.png" -w 1920 -H 1080
done
```

**CLI Options:**
- `-t` theme: `default`, `dark`, `forest`, `neutral`
- `-w` width in pixels (recommended: 1200-1920)
- `-H` height in pixels (auto if not specified)
- `-b` background color: `white`, `transparent`, `#hex`
- `-o` output format: `.png`, `.svg`, `.pdf`

---

## 🎨 Recommended Export Settings

### **For Presentations (PowerPoint, Keynote):**
```bash
mmdc -i [file].mmd -o [file].png -w 1920 -H 1080 -b white
```

### **For Documentation (Web, GitHub):**
```bash
mmdc -i [file].mmd -o [file].svg
# SVG = scalable, looks sharp at any size
```

### **For Printing:**
```bash
mmdc -i [file].mmd -o [file].pdf -w 2400 -H 1800
# Higher resolution for print quality
```

### **For Dark Mode Slides:**
```bash
mmdc -i [file].mmd -o [file].png -t dark -w 1920 -H 1080 -b transparent
```

---

## 📊 Batch Conversion Scripts

### **Convert All to PNG (High Quality)**

Save as `convert-all.ps1` (Windows) or `convert-all.sh` (Mac/Linux):

**PowerShell:**
```powershell
# convert-all.ps1
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

foreach ($diagram in $diagrams) {
    $input = "$($diagram.name).mmd"
    $output = "$($diagram.name).png"
    Write-Host "Converting $input..."
    mmdc -i $input -o $output -w $diagram.width -H $diagram.height -b white
}

Write-Host "✅ All diagrams converted!"
```

**Run:**
```powershell
.\convert-all.ps1
```

---

## 🎯 Usage Examples

### **Example 1: Export for Presentation**
```bash
# Export complete architecture in dark theme
mmdc -i 11-complete-architecture.mmd -o slide-architecture.png -t dark -w 1920 -H 1080 -b transparent

# Result: Perfect for dark background slides
```

### **Example 2: Export Database Schema for Documentation**
```bash
# Export as SVG for GitHub README
mmdc -i 7-database-schema.mmd -o database-schema.svg

# Embed in markdown:
# ![Database Schema](./diagrams/database-schema.svg)
```

### **Example 3: Print-Quality PDF**
```bash
# Export all sequence diagrams as PDFs
mmdc -i 3-signup-flow.mmd -o signup-flow.pdf -w 2400 -H 1800
mmdc -i 4-login-flow.mmd -o login-flow.pdf -w 2400 -H 1800
mmdc -i 6-payment-flow.mmd -o payment-flow.pdf -w 2400 -H 1800
```

---

## 💡 Pro Tips

### **Tip 1: Transparent Backgrounds**
```bash
# For overlaying on slides
mmdc -i [file].mmd -o [file].png -b transparent
```

### **Tip 2: Custom Themes**
Create `config.json`:
```json
{
  "theme": "dark",
  "themeVariables": {
    "primaryColor": "#ff6b6b",
    "primaryTextColor": "#fff",
    "primaryBorderColor": "#ff6b6b",
    "lineColor": "#f0f0f0",
    "secondaryColor": "#4ecdc4",
    "tertiaryColor": "#ffe66d"
  }
}
```

Use:
```bash
mmdc -i [file].mmd -o [file].png -c config.json
```

### **Tip 3: Optimize File Size**
```bash
# Export as PNG, then optimize
mmdc -i [file].mmd -o [file].png
# Then use https://tinypng.com/ to compress
```

---

## 🔧 Troubleshooting

### **"mmdc: command not found"**
```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Or use npx (no install)
npx -p @mermaid-js/mermaid-cli mmdc -i [file].mmd -o [file].png
```

### **Diagram looks cut off**
```bash
# Increase dimensions
mmdc -i [file].mmd -o [file].png -w 2400 -H 1800
```

### **Text too small**
```bash
# Increase width to scale up
mmdc -i [file].mmd -o [file].png -w 3000
```

### **Rendering fails**
```bash
# Check syntax at https://mermaid.live/
# Look for missing quotes, brackets, or arrows
```

---

## 📚 Additional Resources

- **Mermaid Documentation:** https://mermaid.js.org/
- **Mermaid Live Editor:** https://mermaid.live/
- **CLI Documentation:** https://github.com/mermaid-js/mermaid-cli
- **Theme Gallery:** https://mermaid.js.org/config/theming.html

---

## ✅ Quick Checklist

**For Interview Presentations:**
- [ ] Export `11-complete-architecture.mmd` as PNG (1920x1080)
- [ ] Export `6-payment-flow.mmd` as PNG (1200x1800)
- [ ] Export `7-database-schema.mmd` as PNG (1600x1200)
- [ ] Use white background for light slides
- [ ] Use dark theme + transparent background for dark slides

**For GitHub README:**
- [ ] Export all diagrams as SVG
- [ ] Embed with `![Alt Text](./diagrams/filename.svg)`
- [ ] Test rendering in GitHub preview

**For Technical Documentation:**
- [ ] Export all as PNG (1920x1080)
- [ ] Create `/assets/diagrams/` folder
- [ ] Link from documentation sections

---

**Happy exporting! 🚀**