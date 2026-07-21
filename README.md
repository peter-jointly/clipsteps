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
| `num` / `title` / `detail` | Step label, bold title, body text |
| `warn` | Red ⚠ box — safety or common-mistake warnings |
| `adapt` | Blue/green box — "your car / our desk / your box" adaptations to the user's exact gear |
| `photo` / `photoCaption` | Image shown inside the step card (see crumble guide) |
| `file` | (multi-clip guides only) which video file the step plays from |
| `chapter` | (multi-clip guides only) renders a chapter divider above the step |

## Interaction model (all guides)

- **Single tap** on a step: jump video there / pause / resume (280 ms tap timer)
- **Double-tap** left half = back 5 s, right half = forward 5 s (`touch-action: manipulation` prevents zoom)
- **⚡ quick button**: seek to `q` and play
- **🚩 flag button**: marks "doesn't match mine" (localStorage; demo of the feedback loop)
- **Tick circle**: done state + progress bar; persists in localStorage keyed per guide
- **Landscape/wide (≥900 px or landscape ≥640 px)**: two-column grid — video pinned left, steps scroll right

## Rules learned in the field

- One video = one coherent world: never intercut different equipment/cars for the same step; patch gaps with text-only steps instead. Same-creator multi-clip chapters are fine.
- Verify safety-critical numbers (torques, temperatures, pressures) against the official manual/written recipe and label them as such.
- YouTube embeds refuse to play from `file://` (error 153) — pages must be served (the site, or `Open Guide.cmd` locally).
- Quick-step `q` placement comes from the transcript: the boundary between "let me tell you about..." and "now take your...".
