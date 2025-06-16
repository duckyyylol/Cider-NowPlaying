
![Screenshot 1 (31)](https://github.com/user-attachments/assets/5f3ce219-dafe-4b5c-93a1-e003de2a0a62)

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
