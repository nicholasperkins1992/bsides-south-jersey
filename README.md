# BSides South Jersey - Conference Website

A vintage terminal-themed static website for BSides South Jersey, a one-day cybersecurity conference. The site features a retro computing aesthetic inspired by classic CRT monitors and DOS terminals.

## 🎨 Design Theme

- **Color Scheme**: Black background (#000000) with terminal green (#00FF00)
- **Typography**: VT323 and Courier New monospace fonts
- **Aesthetic**: Vintage terminal interface with CRT effects
- **Features**: Typing animations, blinking cursors, scanline effects, and ASCII art

## 📁 Project Structure

```
BSides-SouthJersey/
├── index.html              # Home page with event information
├── about.html              # About page with mission and community info
├── sponsors.html           # Sponsors page with partner information
├── css/
│   └── style.css           # Main styling with terminal theme
├── js/
│   └── terminal.js         # Terminal effects and animations
├── images/
│   └── README.md           # Guidelines for sponsor logos
└── README.md               # This file
```

## 🚀 Getting Started

### Local Development

1. **Clone or download the repository**
   ```bash
   git clone [repository-url]
   cd BSides-SouthJersey
   ```

### Customizing Colors

1. **Edit CSS variables in `css/style.css`**:
   ```css
   :root {
       --terminal-green: #00FF00;      /* Main terminal color */
       --terminal-bg: #000000;         /* Background color */
       --terminal-light-green: #33FF33; /* Lighter green */
       --terminal-dim-green: #00AA00;   /* Dimmer green */
   }
   ```

### Adding New Pages

1. **Copy existing page structure** from `about.html` or `sponsors.html`
2. **Update navigation menu** in all HTML files
3. **Follow terminal theme conventions**

## 🛠️ Technical Features

### Terminal Effects

- **Blinking cursors**: Animated terminal cursors in header
- **CRT scanlines**: Moving horizontal lines for CRT effect
- **Flicker effect**: Subtle screen flicker animation
- **Improved legibility**: Enhanced green colors for better readability

### Interactive Elements

- **Navigation hover effects**: Terminal-style button interactions
- **Sponsor card animations**: Click effects and highlighting
- **Konami Code easter egg**: Hidden matrix rain effect
- **Mobile-optimized interface**: Touch-friendly responsive design

### Performance Optimizations

- **Font preloading**: Faster font rendering
- **CSS animations**: Hardware-accelerated effects
- **Optimized images**: Placeholder system for logos
- **Clean HTML structure**: Semantic and accessible markup
- **Mobile-first responsive design**: Optimized for all screen sizes

## 🔧 Browser Compatibility

- **Modern browsers**: Full feature support (Chrome, Firefox, Safari, Edge)
- **Older browsers**: Graceful degradation with basic styling
- **Mobile devices**: Responsive design with terminal aesthetics

## 📱 Mobile Considerations

The site is fully responsive with mobile-specific optimizations:
- Simplified navigation for smaller screens
- Adjusted font sizes for readability
- Touch-friendly interactive elements
- Maintained terminal aesthetic on all devices

## 🎉 Easter Eggs

- **Konami Code**: `↑↑↓↓←→←→BA` activates matrix rain effect
- **Console logging**: Interactive elements log terminal-style messages
- **Hidden messages**: Various terminal prompts with cybersecurity references

## 📞 Support & Contact

For technical issues or customization help:
- Create issues in the project repository
- Follow BSides development best practices
- Maintain the vintage terminal aesthetic
- Test thoroughly across devices and browsers

## 📄 License

This project is created for BSides South Jersey. Please respect trademark and branding guidelines when adapting for other events.

## 🤝 Contributing

Contributions welcome! Please:
1. Maintain the terminal theme aesthetic
2. Test all changes across devices
3. Follow existing code conventions
4. Document any new features

---

**Built with vintage terminal aesthetics for the modern cybersecurity community.**

*Ready to jack into the matrix? See you at BSides South Jersey!*
