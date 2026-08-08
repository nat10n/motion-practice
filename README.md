# motion-practice

A notebook for learning motion by building it. Each study isolates one variable; the notes are what I actually saw when I ran it.

## Notes

### Easing

Three balls, same drop, same duration. The linear one (`none`) hits the floor still at full speed and stops dead — it looks wrong straight away. `power2.in` gathers speed on the way down, which is what falling actually looks like. `bounce.out` overshoots and settles.

Study: [compositions/balls-1200.html](compositions/balls-1200.html)

### Duration

Same three curves at 0.25s instead of 1.2s. The differences mostly vanish. There isn't enough time for a curve to show itself, so everything reads as a snap.

Study: [compositions/balls-250.html](compositions/balls-250.html)

## Studies

| Study | Variable | File |
| --- | --- | --- |
| Easing | `none` vs `power2.in` vs `bounce.out`, 1.2s drop | [compositions/balls-1200.html](compositions/balls-1200.html) |
| Duration | same three curves at 0.25s | [compositions/balls-250.html](compositions/balls-250.html) |

## Commands

```bash
npm run dev      # live preview in the browser (long-running)
npm run check    # lint + runtime + layout + motion + contrast
npm run render   # render to MP4 (outputs to renders/)
```
