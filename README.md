![Screenshot 1 (32)](https://github.com/user-attachments/assets/e858247a-3285-4f98-8dca-b5d1e5a28a2e)

## This is a web-based overlay.

BASE URL: http://localhost:1234

### API URLS 
- /nowplaying - Current playing Track
- /tracks/history - All previously played tracks (tracks.json)

- /debug/tracklist - Full contents of tracks.json

## OVERLAY URLS

- Now Playing (Pretty) - /nowplaying/overlay
- Inline Song Details - /nowplaying/overlay?inline=true
- Marquee - /nowplaying/overlay?inline=scroll
- Genre Tracker - /nowplaying/genres/overlay
- Last 5 Tracks - /tracks/history/overlay
- Cover Art - /cover/image?corner=[square|round|circle]&size=[small(128px)|medium(512px)|large(1024px)]&spin=[1-Clockwise|2-CounterClockwise]

[Cider Collective](https://cider.sh)
