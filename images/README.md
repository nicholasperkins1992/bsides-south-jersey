# Placeholder Image Notice

This directory contains placeholder images for sponsor logos.

## Sponsor Logo Guidelines

When adding actual sponsor logos, please follow these specifications:

### File Formats
- PNG (preferred for logos with transparency)
- JPG (acceptable for photographic content)
- SVG (excellent for scalable vector logos)

### Dimensions
- Recommended: 300x150 pixels (2:1 aspect ratio)
- Maximum: 600x300 pixels
- Minimum: 150x75 pixels

### File Naming Convention
- Use lowercase with hyphens: `sponsor-company-name.png`
- Include tier in filename: `platinum-sponsor-name.png`

### Optimization
- Optimize file size for web delivery
- Use appropriate compression settings
- Consider using WebP format for modern browsers

## Current Placeholders

The current website uses CSS-generated placeholder blocks that display:
- Sponsor tier level
- "LOGO PLACEHOLDER" text
- Consistent styling with the terminal theme

## Integration Instructions

To replace placeholders with actual logos:

1. Add logo files to this `/images` directory
2. Update the corresponding HTML files (index.html, sponsors.html)
3. Replace `<div class="sponsor-logo">` content with `<img>` tags
4. Maintain the existing CSS classes for consistent styling

Example replacement:
```html
<!-- Current placeholder -->
<div class="sponsor-logo">
    PLATINUM SPONSOR 1
    <br>LOGO PLACEHOLDER
</div>

<!-- Replace with actual logo -->
<div class="sponsor-logo">
    <img src="images/platinum-cybersecure-enterprise.png" 
         alt="CyberSecure Enterprise Solutions Logo"
         style="max-width: 100%; height: auto;">
</div>
```

## Terminal Theme Considerations

- Logos should work well against dark (#000000) backgrounds
- Consider providing light/inverted versions of logos if needed
- Maintain the retro/terminal aesthetic where possible
- Ensure good contrast with terminal green (#00FF00) accents
