# Start Page

A simple, self-hosted Reddit aggregator start page for browsing multiple subreddits in a clean, distraction-free interface.

## Features

- **Multiple Subreddit Columns**: Add unlimited subreddit feeds side-by-side
- **Drag & Drop Reordering**: Rearrange columns to your preference
- **Sort Options**: Choose from hot, new, rising, top, or controversial
- **Timeframe Filters**: For top/controversial posts, filter by hour, day, week, month, year, or all time
- **Read Tracking**: Click posts to open in new tab and automatically mark as read
- **Mark All Read**: Clear entire columns with one click
- **Smart Caching**: 2-hour cache per subreddit/sort combination with manual refresh option
- **Dark Theme**: Easy on the eyes for extended browsing
- **LocalStorage Persistence**: All settings and read items saved locally in your browser
- **Storage Monitoring**: Visual warning when LocalStorage usage is high

## Quick Start

### Docker (Recommended)

```bash
docker-compose up -d
```

Access at http://localhost:8080

### Local Development

```bash
python -m http.server 8080
```

Access at http://localhost:8080

## Installation

### Prerequisites

- Docker and Docker Compose (recommended)
- OR any web server (nginx, Apache, Python's http.server, etc.)

### Docker Deployment

1. Clone or download this repository:
```bash
git clone <repository-url>
cd start-page
```

2. Build and start the container:
```bash
docker-compose up -d
```

3. Access the application at http://localhost:8080

4. To stop the container:
```bash
docker-compose down
```

### Manual Deployment

Simply serve the files using any static web server. The application consists of:
- `index.html`
- `styles.css`
- `app.js`

No build process required.

## Configuration

### Changing the Port

Edit `docker-compose.yml` and change the port mapping:

```yaml
ports:
  - "3000:80"  # Change 3000 to your preferred port
```

Then restart the container:
```bash
docker-compose down
docker-compose up -d
```

### Data Persistence

All data is stored in your browser's LocalStorage:

- **Columns Configuration**: Subreddits, sort options, and timeframes
- **Column Order**: Your custom column arrangement
- **Read Items**: Posts you've already viewed
- **Cache**: Fetched Reddit data (expires after 2 hours)

To reset everything, clear your browser's LocalStorage for the site.

## Usage

### Adding a Subreddit Column

1. Click the **+** button on the right side
2. Enter the subreddit name (without the "r/" prefix)
3. Click **Add**

The column will appear with default settings (hot, day).

### Customizing a Column

Each column has controls in its header:

- **Sort Dropdown**: Choose hot, new, rising, top, or controversial
- **Timeframe Dropdown**: (Visible for top/controversial) Choose hour, day, week, month, year, or all
- **↻ (Refresh)**: Force fetch latest posts, bypassing the 2-hour cache
- **✓ (Mark All Read)**: Mark all visible posts in the column as read and hide them
- **× (Remove)**: Delete the column

### Reading Posts

Click any post to:
- Open the Reddit discussion in a new tab
- Automatically mark the post as read
- Hide the post from the column

### Reordering Columns

Click and drag any column header to reorder. The new order is automatically saved.

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, and JavaScript (no frameworks)
- **Server**: nginx:alpine (Docker)
- **Data Source**: Reddit's public JSON API
- **Storage**: Browser LocalStorage

## Reddit API

This application uses Reddit's public JSON endpoints, which:
- Require no authentication or API key
- Have rate limits (usually sufficient for personal use)
- Return data in JSON format

Endpoint format: `https://www.reddit.com/r/{subreddit}/{sort}.json?limit=20&t={timeframe}`

## Storage Limits

LocalStorage has a ~5MB limit per domain. The app will show a warning banner when usage exceeds 80%. If you reach the limit, consider clearing old read items by clearing your browser's LocalStorage for the site.

## Browser Compatibility

Tested and working on:
- Chrome/Chromium
- Firefox
- Safari
- Edge

Requires a modern browser with:
- ES6 JavaScript support
- LocalStorage
- Fetch API

## Troubleshooting

### Posts not loading

- Check browser console for errors
- Verify the subreddit name is correct
- Reddit's API may be rate-limiting your requests (wait a few minutes)

### Columns not saving

- Ensure LocalStorage is enabled in your browser
- Check that you're not in private/incognito mode
- Clear browser cache and reload

### CORS errors (when not using Docker)

If running locally without a server, some browsers may block Reddit API calls due to CORS. Use Docker or run a local web server (e.g., `python -m http.server`).

## License

This is a personal project. Use freely for personal use.

## Contributing

This is a private project, but feel free to fork and customize for your own needs.
