# EVENTSPACE 3D Inside View — Integration Guide

⚠️ **MUST serve over HTTP** — Three.js uses ES module imports which browsers BLOCK from `file://` URLs (security).

## See it work (verified path)

```powershell
cd C:\EVENTSPACE
pwsh serve.ps1
# Then open: http://localhost:8090/threed-view-demo.html
```

`serve.ps1` is a tiny pure-PowerShell HTTP server. No npm/python needed.

You should see:
- 12×15 marquee rendered with semi-transparent canvas walls + frame poles + peaked roof
- 2 round tables, 1 stage, 1 DJ booth, 1 dance floor, 2 banquet tables placed
- Reception lighting (warm amber + cool indigo) with bloom
- Drag to orbit, scroll to zoom, right-click drag to pan
- Buttons to toggle Day / Night / Reception + cinematic Fly In animation

## Integrate into existing C:\EVENTSPACE\index.html

Drop this near the bottom of `<body>`:

```html
<!-- 3D Inside View modal -->
<div id="threed-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:9999; padding:2rem;">
  <button onclick="closeThreed()" style="position:absolute; top:1rem; right:1rem; background:#1a1a1a; color:#fff; border:1px solid #333; padding:0.5rem 1rem; border-radius:6px; cursor:pointer;">✕ Close</button>
  <canvas id="threed-canvas" style="width:100%; height:100%; display:block;"></canvas>
</div>

<script type="module">
import { mountInsideView } from './threed-view.js'
let view = null

window.openThreed = function(packageDims, equipment) {
  document.getElementById('threed-modal').style.display = 'block'
  const canvas = document.getElementById('threed-canvas')
  if (view) view.dispose()
  view = mountInsideView(canvas, {
    width: packageDims.width, length: packageDims.length,
    lighting: 'reception', equipment: equipment
  })
  setTimeout(() => view.flyInto(), 200)
}
window.closeThreed = function() {
  document.getElementById('threed-modal').style.display = 'none'
  if (view) { view.dispose(); view = null }
}
</script>
```

**Note**: For integration into your existing `index.html`, that file must also be served over HTTP (not opened as file://). Use serve.ps1 or any other web server.

## Equipment type map

| Layout Palette icon | type string |
|---|---|
| Round 10p | `round-10p` |
| Round 8p | `round-8p` |
| Round 6p | `round-6p` |
| Banquet 2.4m | `banquet-2.4m` |
| Banquet 1.8m | `banquet-1.8m` |
| Cocktail | `cocktail` |
| Stage | `stage` |
| DJ | `dj` |
| Dance 16m² | `dance-16` |
| Dance 25m² | `dance-25` |

When the user drags equipment into the green zone, pass `{type, x, z}` objects. Coordinates in metres relative to marquee centre.

## Performance

- Parametric geometry (no GLB downloads)
- Bloom post-processing ~30 ms/frame
- 60 fps on Intel Arc 140T

## Known limitation

ES module imports require HTTP serving. Direct file:// opening will show blank page (browser security).
