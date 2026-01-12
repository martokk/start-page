# Start Page

A simple, self-hosted Reddit aggregator start page for browsing multiple subreddits in a clean, distraction-free interface. Now backed by PostgreSQL for persistent data storage.

## Features

- **Multiple Subreddit Columns**: Add unlimited subreddit feeds side-by-side
- **Drag & Drop Reordering**: Rearrange columns to your preference
- **Sort Options**: Choose from hot, new, rising, top, or controversial
- **Timeframe Filters**: For top/controversial posts, filter by hour, day, week, month, year, or all time
- **Read Tracking**: Click posts to open in new tab and automatically mark as read
- **Mark All Read**: Clear entire columns with one click
- **Smart Caching**: 2-hour cache per subreddit/sort combination (browser storage)
- **Dark Theme**: Easy on the eyes for extended browsing
- **PostgreSQL Persistence**: Settings and read items saved to database (syncs across devices)
- **Optimistic UI**: Instant interactions with background syncing

## Quick Start

### Docker (Recommended)

```bash
docker-compose up -d
```

Access at http://localhost:8080

### GitHub Container Registry

Run the pre-built image (requires PostgreSQL connection):

```bash
docker run -d -p 8080:3000 \
  -e STARTPAGE_POSTGRES_HOST=your-postgres-host \
  -e STARTPAGE_POSTGRES_PASSWORD=your-password \
  ghcr.io/<your-username>/start-page:latest
```

## Installation

### Prerequisites

- Docker and Docker Compose

### Docker Deployment

1. Clone or download this repository:
```bash
git clone <repository-url>
cd start-page
```

2. Build and start the containers:
```bash
docker-compose up -d
```

3. Access the application at http://localhost:8080

4. To stop the containers:
```bash
docker-compose down
```

## Configuration

### Environment Variables

The application requires a PostgreSQL database. Configure connection details in `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `STARTPAGE_POSTGRES_HOST` | Database host | `postgres` |
| `STARTPAGE_POSTGRES_PORT` | Database port | `5432` |
| `STARTPAGE_POSTGRES_USER` | Database user | `startpage` |
| `STARTPAGE_POSTGRES_PASSWORD` | Database password | `startpage` |
| `STARTPAGE_POSTGRES_DB` | Database name | `startpage` |

### Changing the Port

Edit `docker-compose.yml` and change the port mapping:

```yaml
ports:
  - "3000:3000"  # Change host port (left side)
```

Then restart: `docker-compose up -d`

## Data Persistence

- **Settings & Read Items**: Stored in PostgreSQL (`user_storage` table).
- **Cache**: Stored in browser LocalStorage (transient).

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Container**: Docker (Node.js Alpine)

## Development

The project is structured as a unified monorepo:

- `/`: Frontend assets (`index.html`, `styles.css`, `app.js`)
- `/server`: Backend code (`server.js`)

The `Dockerfile` builds a single container serving both API and static files.

## Contributing

This is a private project, but feel free to fork and customize for your own needs.
