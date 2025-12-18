# 🎨 Paxel Motion Framework

A lightweight **pixel art** and **environment simulation** framework for HTML Canvas, perfect for retro‑style visuals and smooth motion design animations.

---

## ✨ Features

- 🖌 **Pixel‑perfect rendering** for authentic retro aesthetics
- 🌦 **Environment simulation**: forces, collisions and physics
- 🧩 Modular API for drawing, animating, and composing scenes
- ⚡ Optimized for performance in modern browsers with webgl
- 📦 Typescript with zero runtime dependencies

## 📥 Installation & Build

This library is **not published on npm**. You can install it in two ways:

1. **Clone and build manually**
   ```bash
   git clone https://github.com/fpetcast/paxel-motion-framework
   cd paxel-motion-framework
   npm install
   npm run build
   ```
2. **Download the build folder directly** :
   the build folder is updated with the latest stable release.
   Copy it directly into your project and import from there.

The **build** folder contains the index file of the library, the minified version and the .d.ts for types.

## 💾 Usage

### 📋 Configuration

For an immediate start you can just import the renderer class and initialize
with a canvas html

```typescript
import { PaxelRenderer } from ".build";
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const paxelRenderer = new PaxelRenderer(canvas);
```

For advanced configuration, you can import the type to pass optional config object as second
argument to the class

```typescript
import { PaxelRenderer, type PaxelRendererConfig } from ".build";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

export const config: PaxelRendererConfig = {
  init: true, // initialize without calling the init method
  canExport: true, // let you export frames
  canvas: {
    width: 640, // will set canvas width
    height: 640, // will set canvas height
  },
  grid: {
    rows: 16, // number of rows
    columns: 16, // number of columns
  },
};

const paxelRenderer = new PaxelRenderer(canvas, config);
```

### 🎇 Rendering

Now let's begin to draw something on the screen: calling this function
after initialization to display a frame border around the canvas.

```typescript
function effect = (
  paxelRenderer: PaxelRenderer,
  config: PaxelRendererConfig,
  intervalDuration: number = 100,
  color: string = "#000000" //rgba or hex color
)  {
  const maxX = config.grid.rows;
  const maxY = config.grid.columns;
  let x = 0;
  let y = 0;

  const interval = setInterval(() => {
    if (x < maxX) {
      paxelRenderer.putPixel(x, 0, color);
      paxelRenderer.putPixel(maxX - x, maxY - 1, color);
      x++;
    }

    if (y < maxY) {
      paxelRenderer.putPixel(0, y, color);
      paxelRenderer.putPixel(maxX - 1, maxY - y, color);
      y++;
    }

    if (y >= maxX && x >= maxX) {
      clearInterval(interval);
    }
  }, intervalDuration);
}
```

Using **putPixel** method we can show pixels at specific positions
based on the grid defined in configuration.

It's also possible to draw using the position in pixel relative to
the screen, for example detecting the click and draw pixels
at grid positions using **drawAt** method

```typescript
import { PaxelRenderer } from ".build";
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const paxelRenderer = new PaxelRenderer(canvas);
const selectedColor = "#000000";
canvas.addEventListener("click", (e) => {
  paxelRenderer.drawAt(e.offsetX, e.offsetY, selectedColor);
});
```
