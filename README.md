
![Screenshot 1 (32)](https://github.com/user-attachments/assets/d3b278a4-6e72-4b5f-ae2e-816d81391a0e)

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
- Cover Art - /cover/image?corner=[square|round|circle]&size=[small(128px)|medium(512px)|large(1024px)]&spin=[true|false]

[Cider Collective](https://cider.sh)
