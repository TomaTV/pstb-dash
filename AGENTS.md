<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Info
This is the PST&B Dashboard, an interactive TV digital signage solution. 
- Stack: Next.js 16+, Tailwind v4, Framer Motion.
- Architecture: 
  - `data/db.json` persists the widget sequence, settings, and Wordle multiplayer state.
  - The Dashboard (`/`) cycles through widgets either in Scene mode (fullscreen) or Orbit mode (1 main + 4 satellites).
  - The Admin panel (`/admin`) allows managing the rotation sequence, view modes, and customizing each widget.
- Note: Use `FileToDataUrlInput` when uploading files in the admin panel to serialize them into the JSON db.
