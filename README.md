![Screenshot 1 (33)](https://github.com/user-attachments/assets/dc6b6d9c-5c47-49be-9b81-05fa43f34519)
![Screenshot 1 (32)](https://github.com/user-attachments/assets/047cbece-2e22-4967-afc7-a83e8e15f002)

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
- Last 30 Tracks (Grid View) - /cover/grid
- Vinyl Record Overlay - /cover/vinyl
- Cover Art - /cover/image&size=[small(128px)|medium(512px)|large(1024px)]&spin=[1-Clockwise|2-CounterClockwise]
- COVER ART URL OPTS
1. ?corner=[square|round|circle] - Controls the border radius of the image (default: round)
2. ?size=[small(128px)|medium(512px)|large(1024px)] - Controls the size of the image itself (default: medium)
3. ?spin=[1-Clockwise|2-CounterClockwise] - Whether or not the cover image will constantly spin in either direction (omit to disable)

## Discord Bot 
This overlay comes with a built-in Discord client to send now playing messages to a certain channel
![image](https://github.com/user-attachments/assets/2daa7bc7-c3fd-4a82-ad03-1f307e82a460)

### Bot Commands
- /last5 - View the last 5 tracks played
- /somethingbroke - Send an incident report to .env/ADMIN_CHANNEL

## Other Features
- Users can report the current track using /somethingbroke. A successful report will skip the current track.
- (WIP) Cider API Wrapper

Special thanks to [Cider Collective](https://cider.sh). This project is not affiliated with Cider Collective
