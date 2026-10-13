# Song JSON Format

Each song lives in its own JSON file in this folder.

Required top-level fields:

```json
{
  "id": 1,
  "slug": "song-slug",
  "title": "Song title",
  "artist": "Artist name",
  "key": "D",
  "capo": 0,
  "difficulty": "Beginner",
  "meter": "4/4",
  "tempo": 112,
  "style": "Lebanese dabke pop",
  "maqam": "Ajam feel",
  "liked": false,
  "charts": {
    "lyrics": {
      "defaultLanguage": "en",
      "locales": {
        "en": {
          "sections": [
            {
              "name": "Verse",
              "lines": [
                {
                  "segments": [
                    { "chord": "D", "text": "English lyric phrase " },
                    { "chord": "G", "text": "next phrase" }
                  ]
                }
              ]
            }
          ]
        },
        "ar": {
          "sections": [
            {
              "name": "مقطع",
              "lines": [
                {
                  "segments": [
                    { "chord": "D", "text": "كلمات عربية " },
                    { "chord": "G", "text": "تكملة الجملة" }
                  ]
                }
              ]
            }
          ]
        },
        "fr": {
          "sections": [
            {
              "name": "Couplet",
              "lines": [
                {
                  "segments": [
                    { "chord": "D", "text": "Parole française " },
                    { "chord": "G", "text": "suite de la phrase" }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    "ireal": {
      "sections": [
        {
          "name": "Verse",
          "repeat": 1,
          "bars": ["D", "D", "G", "A"]
        }
      ]
    }
  }
}
```

`ireal.sections[].bars` may contain either a single chord string or an array of up to four chord strings for one bar. The player will render and playback the first four chords in the array.

The chart reader uses the active app language (`en`, `ar`, or `fr`) and falls
back to `en` when a song does not have that locale yet.

After adding a new song file, import it in `src/data/songs.js` and add it to
`SAMPLE_SONGS`.
