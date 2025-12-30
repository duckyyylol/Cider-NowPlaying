The repository name has lost the plot.

BASE URL: http://localhost:1234

### API URLS `/api`
- GET /tracks/nowplaying - Current playing Track
- GET /tracks/history - All previously played tracks (tracks.json)

### Service URLs `/api/service`
- GET /:service/nowplaying - Raw song data for a certain platform (cider, lastfm, icecast)

## Overlays `/overlay`

### `/nowplaying?<align><&inline>` W 800px x H 175px
- ?<align>: ?left, ?right - Defaults to middle, defines flex alignment for the overlay page content
- &inline - Include to use the inline "now playing" overlay (text-based) (W 1000px x H 75px)
