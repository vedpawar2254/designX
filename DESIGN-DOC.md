# DesignX - Design Document

## Overview
DesignX is a mobile-first interactive scavenger hunt game where a character named **Neero** guides users to find letters D-E-S-I-G-N-X through AR scanning and riddle hints. Target viewport: **393x852px** (iPhone).

---

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#8B1A6B` | Deep magenta background |
| `--bg-secondary` | `#C2185B` | Magenta gradient end |
| `--bg-dark` | `#2D0A3E` | Dark purple overlay |
| `--text-primary` | `#FFFFFF` | Headings, body text on dark |
| `--text-dark` | `#1A1A2E` | Text on light backgrounds |
| `--accent-gold` | `#D4A843` | Pixel X logo base |
| `--accent-gold-light` | `#F0D68A` | Pixel X logo highlight |
| `--header-navy` | `#1A1A3E` | Top header bar |
| `--bubble-white` | `#FFFFFF` | Speech bubble background |
| `--bubble-shadow` | `rgba(0,0,0,0.15)` | Speech bubble shadow |
| `--btn-primary` | `#2D0A3E` | Play/CTA button |
| `--grid-line` | `rgba(255,255,255,0.08)` | Background grid pattern |

## Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Logo "DESIGN" (splash) | System/Impact | 900 | 72px |
| Logo "DESIGN" (screens) | System/Impact | 900 | 48px |
| "WELCOME TO" | System/Sans | 700 | 24px |
| Neero dialogue | System/Sans | 400 | 18px |
| Bold words in dialogue | System/Sans | 700 | 18px |
| Button text | System/Sans | 700 | 18px |
| "scan to find X" | System/Sans | 500 | 16px |
| Hint riddles | System/Serif (italic) | 400 | 15px |
| Auth labels | System/Sans | 500 | 14px |

---

## Screen-by-Screen Specification

### Screen 1: Welcome Splash
**Purpose:** First impression, brand reveal.

**Layout:**
- Full-screen purple-magenta gradient background
- Pixel grid overlay (decorative lines ~52 thin vectors)
- "WELCOME TO" — white, centered, upper area (y:217)
- "DESIGN" — large white bold text below
- Gold pixel-art X — centered bottom area (101,631) 185x283px
- No navigation buttons

**Behavior:** Auto-advances after 2s or tap to continue.

---

### Screen 2: Meet Neero
**Purpose:** Introduce mascot character.

**Layout:**
- Dark navy header strip at top
- "DESIGN" logo top-center (79,40) 235x72
- Neero character — large, left-aligned (bleeds left edge)
- Speech bubble (89,160) 274x259: *"Hey!! I am your buddy **Neero**"*
- Pixel X in background (right side)
- Back arrow (top-left) / Forward arrows (bottom-right)

**Behavior:** Tap forward to advance, back to return.

---

### Screen 3: Challenge Introduction
**Purpose:** Present the game objective.

**Layout:** Same as Screen 2 but:
- Speech bubble text: *"I have a challenge for you to find the 'X' !!!"*
- Neero in pointing pose

**Behavior:** Tap forward to advance.

---

### Screen 4: Misdirection 1
**Purpose:** Humor — wrong "X" reference.

**Layout:** Same template as Screen 2-3 but:
- Speech bubble text: *"well not that ex though !!"*
- Neero amused pose

---

### Screen 5: Misdirection 2
**Purpose:** More humor — second wrong "X".

**Layout:** Same template:
- Speech bubble text: *"not that " " either!!"*
- Small additional vector element

---

### Screen 6: Play CTA
**Purpose:** Terminal onboarding screen, launches game.

**Layout:**
- Same header + character layout
- Speech bubble text: *"Let's Play !"*
- **Play button** — full-width CTA (34,678) 325x75, dark bg, white text "Play"
- No Fast Forward skip button (intentional — must commit)
- Back arrow only

**Behavior:** "Play" button navigates to Login (Screen 7) or first game screen.

---

### Screen 7: Login
**Purpose:** User authentication.

**Layout:**
- "DESIGN" logo + pixel X header
- Grid background
- **Form fields:**
  - User icon + "User Name" label + "demo" placeholder + underline
  - Lock icon + "Password" label + "enter your password" placeholder + view toggle icon + underline
- "Remember Me" checkbox + "Forgot Password?" link
- **"Login" button** (25,731) 343x49 — full-width CTA
- "Don't have an Account?" + "Sign up" link at bottom

---

### Screen 8: Sign Up
**Purpose:** New user registration.

**Layout:**
- "Sign up" header text
- **Form fields:**
  - User icon + "Username" + "demo" placeholder
  - "Password" + "enter your password" + view toggle
  - "Confirm Password" + "Confirm your password" + view toggle
- **"Create Acount" button** (25,731) 343x49 (note: typo "Acount" in original)
- "Already have an Account!" + "Login" link

---

### Letter Scan Screens (D, E, S, I, G, N, X)
**Purpose:** AR scanning interface to find each letter.

**Shared Layout (all 7 identical except letter):**
- "DESIGN" logo (37,185) + small pixel X (366,253)
- **Scan viewfinder box** — Rectangle (30,290) 334x387, bordered area
- **User_scan_light** overlay instance (13,255) 366x452
- "scan to find [LETTER]" label below scan area (68,691)
- Navigation squares (left/right) + back arrow

**Per-letter text:**
| Screen | Label |
|--------|-------|
| D new | "scan to find D" |
| E new | "scan to find E" |
| S new | "scan to find S" |
| I new | "scan to find I" |
| G new | "scan to find G" |
| N new | "scan to find N" |
| X new | "scan to find X" |

---

### Hint Screens (D, E, S, I, G, N, X)
**Purpose:** Riddle clues to help find each letter's location.

**Shared Layout:**
- "DESIGN" logo + pixel X (same positions as scan screens)
- Neero character (bleeds left, except Hint for X where Neero is on right)
- **Speech bubble** — wide horizontal pill (38,264) 334x178
- Riddle text inside bubble
- Navigation squares + skip button (bottom-right)

**Riddles:**
| Letter | Riddle |
|--------|--------|
| D | *"Before the real beginning, one stands still... But the true entrance waits further, if you will."* |
| E | *"Gate said Hi, pickup said wait... I'm just vibing in between, mate"* |
| S | *"No lectures here, no entry line, Just people waiting, that's my sign"* |
| I | *"I'm not inside where brains attack, I'm just chilling outside the block"* |
| G | *"Turn right, the pillar will show you the path you need to follow next"* |
| N | *"I don't go up, I don't go down, But I'm where the magic box is found"* |
| X | *"Press a button, take a ride, I'm the little box you step inside"* |

---

### Screen 23: DESIGNX Completion
**Purpose:** Victory/congratulations screen.

**Layout:**
- "DESIGN" logo + pixel X component (Default variant, 133x210)
- Neero character celebrating
- **"CONGRATULATIONS!"** — large text
- Navigation squares

---

## Component Library

### Pixel X Logo (3 variants)
| Variant | Size | Usage |
|---------|------|-------|
| Default | 133x210 | Completion screen, small displays |
| Variant 2 | 192x302 | Medium displays |
| Variant 3 | 245x319 | Splash screen, large displays |

### Neero Character
- AI-generated character (Gemini_Generated_Image) with background removed
- Indian boy in traditional kurta/sherwani
- Multiple poses: waving, pointing, amused, celebrating

### UI Elements
| Element | Description |
|---------|-------------|
| Less Than (back) | `<` arrow, top-left, 38-46x30-37 |
| Fast Forward (skip) | `>>` arrows, bottom-right, 35-47x51-55 |
| Square up/down | Navigation arrow containers, 134x134 |
| Speech bubble | Rounded white shape with tail |
| Scan viewfinder | Bordered rectangle with scan overlay |
| Form inputs | Underlined fields with icons |

---

## Interaction Flow

```
Screen 1 (Splash)
    |
Screen 2 (Meet Neero)
    |
Screen 3 (Challenge intro)
    |
Screen 4 (Misdirection 1)
    |
Screen 5 (Misdirection 2)
    |
Screen 6 (Play CTA)
    |
Screen 7 (Login) <--> Screen 8 (Sign Up)
    |
[Game Loop for each letter: D → E → S → I → G → N → X]
    |
    ├── Hint Screen (riddle clue)
    |       |
    └── Scan Screen (AR viewfinder)
            |
            [Letter found → next letter]
    |
DESIGNX (Congratulations!)
```

---

## Assets Required
1. Neero character images (multiple poses) — AI-generated, background-removed
2. Pixel-art X logo (3 size variants) — gold gradient
3. Background grid pattern
4. Navigation icons (back, forward, skip)
5. Form field icons (user, lock, eye/view)
6. Scan viewfinder overlay graphic
