# Post audio + transcripts

To add a narrated audio player + word-synced transcript to a post, drop the
audio file and a word-timing JSON file in here, then reference them from the
post's front matter:

```yaml
---
layout: post
title:  "Welcome to Coding Beyond!"
audio: /assets/audio/welcome-to-coding-beyond.mp3
transcript: /assets/audio/welcome-to-coding-beyond.json
---
```

Both fields are optional — posts without `audio` set render exactly as
before, with no player.

## Transcript JSON format

A flat array of words in playback order, each with a start/end time in
seconds:

```json
[
  { "word": "For", "start": 0.00, "end": 0.32 },
  { "word": "the", "start": 0.32, "end": 0.50 },
  { "word": "last", "start": 0.50, "end": 0.78 }
]
```

- `word` is the exact text to display (punctuation included, e.g. `"beyond."`).
- `start`/`end` are seconds from the beginning of the audio file.
- Entries must be sorted by `start` and shouldn't overlap.

This matches the shape produced by most forced-alignment tools (e.g.
Gentle, aeneas) and can be derived from Whisper's `--word_timestamps` output
by flattening the `words` arrays across all `segments`.
