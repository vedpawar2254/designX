Both deliverables built. Here's what's done:

  1. Design Doc (DESIGN-DOC.md)

  - Full color palette with CSS variables
  - Typography spec per element
  - Screen-by-screen breakdown (all 24 frames)
  - Layout positions from Figma metadata
  - All text content (dialogue, riddles, form labels)
  - Component library (pixel X variants, Neero poses, UI elements)
  - Interaction flow diagram
  - Assets checklist

  2. Website (index.html + styles.css + script.js)

  All screens implemented:
  - Splash — purple gradient, pixel grid, "WELCOME TO DESIGN X" with CSS pixel-art gold X
  - Screens 2-5 — Neero character + speech bubbles with exact dialogue
  - Screen 6 — Play CTA button
  - Login/Signup — full forms with password toggle, remember me, switch links
  - 7 Hint screens — Neero + riddle bubbles (all riddles verbatim from Figma)
  - 7 Scan screens — AR viewfinder with animated scan line, tap-to-find mechanic
  - Completion — "CONGRATULATIONS!" with letter tiles + confetti

  Features:
  - Swipe navigation (touch support)
  - Screen transitions (slide animations)
  - Progress bar during letter game
  - Scan animation + letter reveal effect
  - Form validation with shake feedback
  - Play Again reset
  - Responsive — phone-sized container centered on desktop

  Site should be open in browser now at http://localhost:8080.

  Note: Neero character uses emoji placeholders since actual AI-generated images weren't exportable from Figma. Replace .neero CSS with actual <img> tags
  when you have character assets.




- scan a qr -> go to "/"
- on "/" once user clicks something the X appears
- after that the animation takes you to nero
- the flow with animation and all happens
  - the QR codes if specific QR's are scanned the letter is achieved and then you move on to next page
- happends till the end and then you celebrate