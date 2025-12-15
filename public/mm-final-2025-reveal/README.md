# Marathon Match Tournament 2025 - Champions Announcement

A professional, auto-advancing presentation celebrating the Topcoder Marathon Match Tournament Finals. Inspired by Olympic and FIFA World Cup ceremonies, featuring dramatic reveals, podium presentations, and a complete leaderboard transition.

## ✨ Features

- 🎬 **Auto-Advancing Presentation**: Automatically progresses through all sections - no scrolling needed
- 🎨 **Topcoder Brand Design**: Matches official Topcoder color scheme and styling
- 🏆 **Olympic/FIFA-Inspired**: Ceremonial presentation style with dramatic reveals
- 📊 **Leaderboard Transition**: Animated transition from provisional to final scores
- 📸 **Photo Support**: Display finalist and winner photos
- 🎯 **Problem Showcase**: Beautiful presentation of the challenge
- 👥 **Finalists Grid**: Staggered animations for all finalists
- 🥇 **Podium Presentation**: Gold, silver, bronze podium with celebration effects
- ✨ **Smooth Animations**: Professional CSS animations throughout
- 📱 **Fully Responsive**: Works beautifully on all devices

## 🎨 Design

The design uses Topcoder's official brand colors:
- **Primary Blue**: `#0066FF`
- **Secondary Blue**: `#00CCFF`
- **Accent Purple**: `#7C3AED`
- **Gradients**: Professional blue-to-purple gradients throughout

## 🚀 Setup Instructions

### 1. Add Finalist Photos

Create a `photos` folder in the project directory and add photos for each finalist:

```
MM Champion Announcement/
├── photos/
│   ├── wleite.jpg
│   ├── Daiver19.jpg
│   ├── sullyper.jpg
│   ├── gaha.jpg
│   └── ... (all finalist photos)
```

**Photo Requirements:**
- Format: JPG or PNG
- Recommended size: 400x400px minimum
- Square aspect ratio works best
- If a photo is missing, initials will be displayed as fallback

### 2. Update Configuration

Open `script.js` and update the `CONFIG` object:

```javascript
const CONFIG = {
    winners: {
        first: {
            name: "wleite",
            country: "Country",  // Update with actual country
            score: "96.50406762453507",
            photo: "photos/wleite.jpg"
        },
        // ... update second and third
    },
    finalists: [
        { name: "wleite", country: "Country", photo: "photos/wleite.jpg" },
        // ... add all finalists with photos
    ]
};
```

### 3. Adjust Timing (Optional)

Customize the presentation timing in `script.js`:

```javascript
timing: {
    intro: 3000,              // Intro screen duration
    hero: 5000,               // Hero section display time
    problem: 6000,            // Problem section display time
    finalists: 8000,          // Finalists grid display time
    leaderboardProvisional: 5000,    // Provisional scores display
    leaderboardTransition: 2500,     // Transition animation
    leaderboardFinal: 5000,          // Final scores display
    countdown: 4000,         // Countdown duration
    podium: 8000,           // Podium reveal time
    celebration: 5000,      // Celebration message
    cta: 5000               // Final CTA section
}
```

## 📁 File Structure

```
MM Champion Announcement/
├── photos/              # Finalist photos (create this folder)
│   ├── wleite.jpg
│   ├── Daiver19.jpg
│   └── ...
├── index.html           # Main HTML structure
├── styles.css           # All styling and animations
├── script.js            # Auto-advancing logic and data
└── README.md            # This file
```

## 🎬 Presentation Flow

The presentation automatically advances through these sections:

1. **Intro Screen** (3s)
   - Topcoder logo animation
   - Loading bar

2. **Hero Section** (5s)
   - "Tournament Final Has Concluded" reveal
   - Gradient text animations

3. **Problem Section** (6s)
   - Challenge description
   - Feature highlights
   - Problem setter credits

4. **Finalists Section** (8s)
   - Grid of all finalists with photos
   - Staggered card animations

5. **Leaderboard Section** (12.5s total)
   - Shows provisional scores (5s)
   - Transition animation (2.5s)
   - Shows final scores with ranking changes (5s)

6. **Countdown** (4s)
   - Dramatic 3-2-1 countdown

7. **Podium Section** (8s)
   - Top 3 winners revealed
   - Gold, silver, bronze podium
   - Celebration animations

8. **Final CTA** (5s)
   - Link to full leaderboard

**Total Duration**: ~51.5 seconds

## 🎨 Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --tc-primary: #0066FF;        /* Topcoder primary blue */
    --tc-secondary: #00CCFF;     /* Topcoder secondary blue */
    --tc-accent: #7C3AED;         /* Topcoder purple accent */
    --gold: #FFD700;              /* Gold medal color */
    --silver: #C0C0C0;            /* Silver medal color */
    --bronze: #CD7F32;            /* Bronze medal color */
}
```

### Animations

All animations are CSS-based. Key animations include:
- `logoPulse`: Intro logo animation
- `heroReveal`: Hero text reveal
- `finalistReveal`: Finalist card animations
- `revealPodium`: Podium reveal
- `countdownPulse`: Countdown animation

## 📸 Photo Setup

### Option 1: Local Photos
1. Create `photos/` folder
2. Add photos named exactly as in the CONFIG (e.g., `wleite.jpg`)
3. Photos will automatically load

### Option 2: Remote Photos
Update photo paths in CONFIG to use URLs:
```javascript
photo: "https://example.com/photos/wleite.jpg"
```

### Fallback
If a photo fails to load, the system automatically shows:
- Initials for finalists
- Medal emoji (🥇🥈🥉) for winners

## 🌐 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox required
- CSS custom properties (variables) required
- ES6 JavaScript features

## 🔧 Integration

### Standalone Page
Simply open `index.html` in a browser - the presentation will auto-advance.

### Embed in Topcoder Site
1. Copy HTML structure into your template
2. Include CSS (inline or external)
3. Include JavaScript (inline or external)
4. Ensure `photos/` folder is accessible
5. Update CONFIG with actual data

### Performance Tips
- Optimize photos (compress to ~100-200KB each)
- Use WebP format for better compression
- Consider lazy loading for large photo sets

## 🎯 Key Features Explained

### Auto-Advancing System
- Sections automatically transition
- No user interaction required
- Smooth fade in/out animations
- Each section has customizable display duration

### Leaderboard Transition
- Shows provisional scores first
- Animated transition indicator
- Smooth fade to final scores
- Highlights ranking changes with colors:
  - 🟢 Green: Rank improved
  - 🔴 Red: Rank decreased
  - 🔵 Blue: New entry
  - ⚪ Gray: No change

### Podium Presentation
- Olympic-style podium design
- Gold, silver, bronze gradients
- Crown animation for champion
- Glow effects and shadows
- Winner photos or medal emojis

## 📝 Notes

- All timing is configurable in the `CONFIG.timing` object
- Photos are optional - initials/emojis display if missing
- The presentation loops or ends based on your preference
- Mobile-responsive with adjusted layouts for smaller screens

## 🎉 Credits

- **Design Inspiration**: Olympics & FIFA World Cup ceremonies
- **Brand Colors**: Topcoder official palette
- **Problem**: Grid Puzzle Game by dimkadimon
- **Testers**: JacoCronje and nika

---

**Ready to celebrate the champions!** 🏆
