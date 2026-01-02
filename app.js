const STORAGE_KEYS = {
    COLUMNS: 'startpage_columns',
    READ: 'startpage_read',
    CACHE: 'startpage_cache',
    ORDER: 'startpage_order'
};

const CACHE_DURATION = 2 * 60 * 60 * 1000;
const STORAGE_WARNING_THRESHOLD = 0.8;

const Storage = {
    getColumns() {
        const data = localStorage.getItem(STORAGE_KEYS.COLUMNS);
        return data ? JSON.parse(data) : [];
    },

    saveColumns(columns) {
        localStorage.setItem(STORAGE_KEYS.COLUMNS, JSON.stringify(columns));
        this.checkStorageUsage();
    },

    getReadItems() {
        const data = localStorage.getItem(STORAGE_KEYS.READ);
        return data ? JSON.parse(data) : [];
    },

    addReadItem(itemId) {
        const readItems = this.getReadItems();
        if (!readItems.includes(itemId)) {
            readItems.push(itemId);
            localStorage.setItem(STORAGE_KEYS.READ, JSON.stringify(readItems));
            this.checkStorageUsage();
        }
    },

    addReadItems(itemIds) {
        const readItems = new Set(this.getReadItems());
        itemIds.forEach(id => readItems.add(id));
        localStorage.setItem(STORAGE_KEYS.READ, JSON.stringify([...readItems]));
        this.checkStorageUsage();
    },

    getCache() {
        const data = localStorage.getItem(STORAGE_KEYS.CACHE);
        return data ? JSON.parse(data) : {};
    },

    setCache(key, items) {
        const cache = this.getCache();
        cache[key] = {
            items,
            cachedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
        this.checkStorageUsage();
    },

    isCacheValid(key) {
        const cache = this.getCache();
        if (!cache[key]) return false;
        return (Date.now() - cache[key].cachedAt) < CACHE_DURATION;
    },

    getCachedItems(key) {
        const cache = this.getCache();
        return cache[key]?.items || null;
    },

    getColumnOrder() {
        const data = localStorage.getItem(STORAGE_KEYS.ORDER);
        return data ? JSON.parse(data) : [];
    },

    saveColumnOrder(order) {
        localStorage.setItem(STORAGE_KEYS.ORDER, JSON.stringify(order));
        this.checkStorageUsage();
    },

    checkStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        
        const maxSize = 5 * 1024 * 1024;
        const usage = total / maxSize;
        
        const warningEl = document.getElementById('storage-warning');
        if (usage > STORAGE_WARNING_THRESHOLD) {
            warningEl.classList.remove('hidden');
        } else {
            warningEl.classList.add('hidden');
        }
    }
};

const RedditAPI = {
    buildRedditUrl(subreddit, sort, timeframe) {
        let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=20`;
        if ((sort === 'top' || sort === 'controversial') && timeframe) {
            url += `&t=${timeframe}`;
        }
        return url;
    },

    async fetchSubreddit(subreddit, sort, timeframe, forceRefresh = false) {
        const cacheKey = `${subreddit}_${sort}_${timeframe}`;
        
        if (!forceRefresh && Storage.isCacheValid(cacheKey)) {
            const cached = Storage.getCachedItems(cacheKey);
            if (cached) return cached;
        }

        try {
            const url = this.buildRedditUrl(subreddit, sort, timeframe);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch r/${subreddit}`);
            }

            const data = await response.json();
            const items = data.data.children.map(child => ({
                id: child.data.name,
                title: child.data.title,
                score: child.data.score,
                thumbnail: child.data.thumbnail,
                url: `https://www.reddit.com${child.data.permalink}`,
                created: child.data.created_utc
            }));

            Storage.setCache(cacheKey, items);
            return items;
        } catch (error) {
            console.error('Reddit API Error:', error);
            throw error;
        }
    }
};

const Render = {
    formatTimeAgo(timestamp) {
        const seconds = Math.floor(Date.now() / 1000 - timestamp);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
        return `${Math.floor(seconds / 31536000)}y ago`;
    },

    renderItem(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        itemEl.dataset.itemId = item.id;

        let thumbnailHtml;
        if (item.thumbnail && item.thumbnail.startsWith('http')) {
            thumbnailHtml = `<img src="${item.thumbnail}" class="item-thumbnail" alt="">`;
        } else {
            thumbnailHtml = '<div class="item-thumbnail placeholder">📄</div>';
        }

        itemEl.innerHTML = `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="item-link">
                ${thumbnailHtml}
                <div class="item-content">
                    <div class="item-title">${item.title}</div>
                    <div class="item-meta">
                        <span class="item-score">↑${item.score}</span>
                        <span class="item-time">${this.formatTimeAgo(item.created)}</span>
                    </div>
                </div>
            </a>
        `;

        return itemEl;
    },

    renderColumn(column) {
        const columnEl = document.createElement('div');
        columnEl.className = 'column';
        columnEl.dataset.columnId = column.id;
        columnEl.draggable = true;

        const showTimeframe = column.sort === 'top' || column.sort === 'controversial';
        const timeframeHtml = showTimeframe ? `
            <select class="timeframe-select" data-column-id="${column.id}">
                <option value="hour" ${column.timeframe === 'hour' ? 'selected' : ''}>Hour</option>
                <option value="day" ${column.timeframe === 'day' ? 'selected' : ''}>Day</option>
                <option value="week" ${column.timeframe === 'week' ? 'selected' : ''}>Week</option>
                <option value="month" ${column.timeframe === 'month' ? 'selected' : ''}>Month</option>
                <option value="year" ${column.timeframe === 'year' ? 'selected' : ''}>Year</option>
                <option value="all" ${column.timeframe === 'all' ? 'selected' : ''}>All</option>
            </select>
        ` : '';

        columnEl.innerHTML = `
            <div class="column-header">
                <div class="column-title">r/${column.subreddit}</div>
                <div class="column-controls">
                    <select class="sort-select" data-column-id="${column.id}">
                        <option value="hot" ${column.sort === 'hot' ? 'selected' : ''}>Hot</option>
                        <option value="new" ${column.sort === 'new' ? 'selected' : ''}>New</option>
                        <option value="rising" ${column.sort === 'rising' ? 'selected' : ''}>Rising</option>
                        <option value="top" ${column.sort === 'top' ? 'selected' : ''}>Top</option>
                        <option value="controversial" ${column.sort === 'controversial' ? 'selected' : ''}>Controversial</option>
                    </select>
                    ${timeframeHtml}
                    <button class="btn-refresh" data-column-id="${column.id}">↻</button>
                    <button class="btn-mark-read" data-column-id="${column.id}">✓</button>
                    <button class="btn-remove" data-column-id="${column.id}">×</button>
                </div>
            </div>
            <div class="column-body" data-column-id="${column.id}">
                <div style="text-align: center; padding: 20px; color: #666;">Loading...</div>
            </div>
        `;

        return columnEl;
    },

    async renderColumnItems(columnId) {
        const columns = Storage.getColumns();
        const column = columns.find(c => c.id === columnId);
        if (!column) return;

        const columnBodyEl = document.querySelector(`.column-body[data-column-id="${columnId}"]`);
        if (!columnBodyEl) return;

        try {
            const items = await RedditAPI.fetchSubreddit(column.subreddit, column.sort, column.timeframe);
            const readItems = new Set(Storage.getReadItems());
            const unreadItems = items.filter(item => !readItems.has(item.id));

            columnBodyEl.innerHTML = '';

            if (unreadItems.length === 0) {
                columnBodyEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No unread items</div>';
                return;
            }

            unreadItems.forEach(item => {
                const itemEl = this.renderItem(item);
                columnBodyEl.appendChild(itemEl);
            });
        } catch (error) {
            columnBodyEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff6b6b;">Error: ${error.message}</div>`;
        }
    },

    renderAddButton() {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'add-column-btn';
        btnContainer.innerHTML = `
            <button id="add-column-btn" class="btn-add">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        `;
        return btnContainer;
    },

    async renderApp() {
        const container = document.getElementById('columns-container');
        container.innerHTML = '';

        const columns = Storage.getColumns();
        const order = Storage.getColumnOrder();

        const orderedColumns = order.length > 0
            ? order.map(id => columns.find(c => c.id === id)).filter(Boolean)
            : columns;

        if (orderedColumns.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.style.padding = '20px';
            emptyState.style.color = '#666';
            emptyState.textContent = 'Click + to add your first subreddit';
            container.appendChild(emptyState);
            container.appendChild(this.renderAddButton());
            return;
        }

        orderedColumns.forEach(column => {
            const columnEl = this.renderColumn(column);
            container.appendChild(columnEl);
        });

        container.appendChild(this.renderAddButton());

        orderedColumns.forEach(column => {
            this.renderColumnItems(column.id);
        });
    }
};

const Events = {
    init() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.item-link')) {
                const itemEl = e.target.closest('.item');
                if (itemEl) {
                    this.handleItemClick(itemEl);
                }
            }

            if (e.target.classList.contains('btn-mark-read')) {
                this.handleMarkAllRead(e.target.dataset.columnId);
            }

            if (e.target.classList.contains('btn-refresh')) {
                this.handleRefresh(e.target.dataset.columnId);
            }

            if (e.target.classList.contains('btn-remove')) {
                this.handleRemoveColumn(e.target.dataset.columnId);
            }
        });

        document.addEventListener('auxclick', (e) => {
            if (e.button === 1) {
                if (e.target.closest('.item-link')) {
                    const itemEl = e.target.closest('.item');
                    if (itemEl) {
                        this.handleItemClick(itemEl);
                    }
                }
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('sort-select')) {
                this.handleSortChange(e.target.dataset.columnId, e.target.value);
            }

            if (e.target.classList.contains('timeframe-select')) {
                this.handleTimeframeChange(e.target.dataset.columnId, e.target.value);
            }
        });
    },

    handleItemClick(itemEl) {
        const itemId = itemEl.dataset.itemId;
        Storage.addReadItem(itemId);
        itemEl.style.display = 'none';
    },

    handleMarkAllRead(columnId) {
        const columnBodyEl = document.querySelector(`.column-body[data-column-id="${columnId}"]`);
        const items = columnBodyEl.querySelectorAll('.item');
        const itemIds = Array.from(items).map(item => item.dataset.itemId);

        Storage.addReadItems(itemIds);
        items.forEach(item => item.style.display = 'none');

        columnBodyEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No unread items</div>';
    },

    handleRefresh(columnId) {
        const columns = Storage.getColumns();
        const column = columns.find(c => c.id === columnId);
        if (!column) return;

        const columnBodyEl = document.querySelector(`.column-body[data-column-id="${columnId}"]`);
        columnBodyEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Refreshing...</div>';

        RedditAPI.fetchSubreddit(column.subreddit, column.sort, column.timeframe, true)
            .then(() => Render.renderColumnItems(columnId));
    },

    handleSortChange(columnId, newSort) {
        const columns = Storage.getColumns();
        const column = columns.find(c => c.id === columnId);
        if (!column) return;

        column.sort = newSort;
        if (newSort !== 'top' && newSort !== 'controversial') {
            column.timeframe = 'day';
        }

        Storage.saveColumns(columns);
        Render.renderApp();
    },

    handleTimeframeChange(columnId, newTimeframe) {
        const columns = Storage.getColumns();
        const column = columns.find(c => c.id === columnId);
        if (!column) return;

        column.timeframe = newTimeframe;
        Storage.saveColumns(columns);
        Render.renderColumnItems(columnId);
    },

    handleRemoveColumn(columnId) {
        let columns = Storage.getColumns();
        columns = columns.filter(c => c.id !== columnId);
        Storage.saveColumns(columns);

        let order = Storage.getColumnOrder();
        order = order.filter(id => id !== columnId);
        Storage.saveColumnOrder(order);

        Render.renderApp();
    }
};

const DragDrop = {
    draggedElement: null,

    init() {
        const container = document.getElementById('columns-container');

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('column')) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('column')) {
                e.target.classList.remove('dragging');
                this.draggedElement = null;
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientX);
            const dragging = document.querySelector('.dragging');
            
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.saveOrder();
        });
    },

    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.column:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    saveOrder() {
        const container = document.getElementById('columns-container');
        const columns = container.querySelectorAll('.column');
        const order = Array.from(columns).map(col => col.dataset.columnId);
        Storage.saveColumnOrder(order);
    }
};

const Modal = {
    init() {
        const modal = document.getElementById('add-modal');
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('modal-cancel');
        const submitBtn = document.getElementById('modal-submit');
        const input = document.getElementById('subreddit-input');

        document.addEventListener('click', (e) => {
            if (e.target.closest('#add-column-btn')) {
                this.open();
            }
        });

        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        submitBtn.addEventListener('click', () => this.submit());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submit();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    },

    open() {
        const modal = document.getElementById('add-modal');
        const input = document.getElementById('subreddit-input');
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
    },

    close() {
        const modal = document.getElementById('add-modal');
        modal.classList.add('hidden');
    },

    submit() {
        const input = document.getElementById('subreddit-input');
        const subreddit = input.value.trim();

        if (!subreddit) return;

        const columns = Storage.getColumns();
        const newColumn = {
            id: `col_${Date.now()}`,
            subreddit: subreddit,
            sort: 'hot',
            timeframe: 'day'
        };

        columns.push(newColumn);
        Storage.saveColumns(columns);

        const order = Storage.getColumnOrder();
        order.push(newColumn.id);
        Storage.saveColumnOrder(order);

        this.close();
        Render.renderApp();
    }
};

function init() {
    Storage.checkStorageUsage();
    Events.init();
    DragDrop.init();
    Modal.init();
    Render.renderApp();
}

document.addEventListener('DOMContentLoaded', init);
