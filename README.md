# ClipSteps guide template — feature reference

Every guide on this site is a single self-contained HTML file built from the same template.
**Reference implementation: `fluffy-pancakes.html`** (YouTube-based) and `apple-rhubarb-crumble.html` (self-hosted multi-clip). Copy from these when creating or upgrading a guide.

## STEPS data format

Each step in the `STEPS` array supports:

| Field | Meaning |
|---|---|
| `t` | Start time (seconds) — where the step's explanation begins. `null` = text-only step (grey "📝 not in clip" chip, no video jump) |
| `end` | End time — used for the yellow "now playing" highlight |
| `q` | **Quick-step**: the second the *action* starts, skipping intro chat. Renders the "⚡ straight to it" button. Only add when there's ≥ ~8s of chat worth skipping — no `q` on already-tight steps |
| `brief` | **Short-&-sharp version**: array of bullet strings (2–3, imperative, no filler). Shown instead of `detail` when the reader turns on the "⚡ Short & sharp" toggle (`localStorage` key `howto-brief`, shared across guides). `warn`/`adapt` boxes are NEVER hidden by brief mode — safety text always shows. Write both versions at capture time |
| `num` / `title` / `detail` | Step label, bold title, body text |
| `warn` | Red ⚠ box — safety or common-mistake warnings |
| `adapt` | Blue/green box — "your car / our desk / your box" adaptations to the user's exact gear |
| `photo` / `photoCaption` | Image shown inside the step card (see crumble guide) |
| `file` | (multi-clip guides only) which video file the step plays from |
| `chapter` | (multi-clip guides only) renders a chapter divider above the step |

## Interaction model (all guides)

- **Tap zones** (standard since 26 Sep 2026; the shared player in `platform/` still uses the older double-tap ∓5 s): tap a step to jump the video there. While that step is playing: left third = back 10 s, middle = pause / play, right third = forward 10 s. No tap timer, so taps respond instantly (`touch-action: manipulation` prevents zoom)
- **First play comes from YouTube's own play button** (YouTube guides): YouTube counts a view only when playback starts from its native button, so until the video has played once, a step tap or ⚡ tap cues the video at that point (`cueVideoById` with `startSeconds`) and the reader taps YouTube's ▶ to start. An `onStateChange` → playing sets `started`; from then on, taps seek and play directly. Never call `playVideo()` before `started`
- **⚡ quick button**: seek to `q` and play (cues it instead until the first play, as above)
- **⚡ Short & sharp toggle** (progress row): swaps `detail` prose for `brief` bullets on steps that have them; preference persists across guides
- **🚩 flag button**: marks "doesn't match mine" (localStorage; demo of the feedback loop)
- **Tick circle**: done state + progress bar; persists in localStorage keyed per guide
- **Landscape/wide (≥900 px or landscape ≥640 px)**: still one column. The video is big and centred (16:9, up to 960 px wide, capped by the viewport height) and stays pinned at the top; the title, progress row and steps sit in a centred column (max 880 px) below it

## Shared player engine (master)

`platform/clipsteps-player.js` + `platform/clipsteps-player.css` are the **master** of the reusable ClipSteps player: a page supplies `window.GUIDE` (video + steps) and mounts it into `<div id="clipsteps-guide"></div>`. They hold no customer content. Other products use synced copies: change the player here first, bump the version line in both headers, then copy both files across unchanged. Never edit a copy.

## Rules learned in the field

- One video = one coherent world: never intercut different equipment/cars for the same step; patch gaps with text-only steps instead. Same-creator multi-clip chapters are fine.
- Verify safety-critical numbers (torques, temperatures, pressures) against the official manual/written recipe and label them as such.
- YouTube embeds refuse to play from `file://` (error 153) — pages must be served (the site, or `Open Guide.cmd` locally).
- Always set `playsinline: 1` in the YouTube `playerVars` (and the `playsinline` attribute on self-hosted `<video>`). Without it, iPhone Safari opens the clip in native fullscreen and the steps are hidden.
- Quick-step `q` placement comes from the transcript: the boundary between "let me tell you about..." and "now take your...".
