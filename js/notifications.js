// Notification System
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.initNotifications();
    }

    async initNotifications() {
        if (!window.Auth.isAuthenticated()) return;

        // Initialize UI elements
        this.notificationList = document.querySelector('#notification-list');
        this.notificationBadge = document.querySelector('#notification-badge');
        this.notificationButton = document.querySelector('#notification-button');

        // Request push notification permission
        this.requestNotificationPermission();

        // Load initial notifications
        await this.loadNotifications();

        // Setup WebSocket listener
        this.listenForNotifications();

        // Setup UI handlers
        if (this.notificationButton) {
            this.notificationButton.addEventListener('click', () => {
                this.toggleNotificationPanel();
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#notification-panel') && 
                !e.target.closest('#notification-button')) {
                this.closeNotificationPanel();
            }
        });
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.setupPushNotifications();
                }
            } catch (error) {
                console.error('Failed to request notification permission:', error);
            }
        }
    }

    async setupPushNotifications() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(
                        'YOUR_PUBLIC_VAPID_KEY' // Replace with your VAPID key
                    )
                });

                // Send subscription to server
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.Auth.token}`
                    },
                    body: JSON.stringify(subscription)
                });
            } catch (error) {
                console.error('Failed to setup push notifications:', error);
            }
        }
    }

    listenForNotifications() {
        if (window.Messaging && window.Messaging.socket) {
            window.Messaging.socket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    this.handleNewNotification(data.notification);
                }
            });
        }
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${window.Auth.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load notifications');

            const data = await response.json();
            this.notifications = data.notifications;
            this.unreadCount = data.unreadCount;

            this.updateNotificationList();
            this.updateUnreadCount();
        } catch (error) {
            window.Analytics.error.logError({
                type: 'notification_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    handleNewNotification(notification) {
        // Add to list
        this.notifications.unshift(notification);
        this.unreadCount++;

        // Update UI
        this.updateNotificationList();
        this.updateUnreadCount();

        // Show browser notification if permission granted
        this.showBrowserNotification(notification);

        // Play sound
        this.playNotificationSound();

        // Track notification
        window.Analytics.behavior.trackEvent('notification_received', {
            type: notification.type,
            timestamp: new Date().toISOString()
        });
    }

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body: notification.message,
                icon: '/logo.svg',
                badge: '/favicon.png',
                tag: notification.id,
                data: notification
            };

            const browserNotification = new Notification(notification.title, options);
            browserNotification.onclick = () => {
                window.focus();
                this.handleNotificationClick(notification);
            };
        }
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.Auth.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');

            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                notification.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateUnreadCount();
                this.updateNotificationList();
            }
        } catch (error) {
            window.Analytics.error.logError({
                type: 'notification_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.Auth.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to mark all notifications as read');

            // Update local state
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.updateUnreadCount();
            this.updateNotificationList();
        } catch (error) {
            window.Analytics.error.logError({
                type: 'notification_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    handleNotificationClick(notification) {
        // Mark as read
        this.markAsRead(notification.id);

        // Navigate to relevant page based on notification type
        switch (notification.type) {
            case 'message':
                window.location.href = `/messages/${notification.data.conversationId}`;
                break;
            case 'proposal':
                window.location.href = `/proposals/${notification.data.proposalId}`;
                break;
            case 'contract':
                window.location.href = `/contracts/${notification.data.contractId}`;
                break;
            default:
                if (notification.link) {
                    window.location.href = notification.link;
                }
        }

        // Close notification panel
        this.closeNotificationPanel();
    }

    toggleNotificationPanel() {
        const panel = document.querySelector('#notification-panel');
        if (panel) {
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                // Mark visible notifications as read
                const visibleNotifications = this.notifications
                    .filter(n => !n.read)
                    .slice(0, 5);
                visibleNotifications.forEach(n => this.markAsRead(n.id));
            }
        }
    }

    closeNotificationPanel() {
        const panel = document.querySelector('#notification-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    updateNotificationList() {
        if (!this.notificationList) return;

        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = this.getEmptyTemplate();
            return;
        }

        this.notificationList.innerHTML = this.notifications
            .slice(0, 10) // Show only last 10 notifications
            .map(notification => this.getNotificationTemplate(notification))
            .join('');

        // Add click handlers
        this.notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.notificationId;
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    this.handleNotificationClick(notification);
                }
            });
        });
    }

    updateUnreadCount() {
        if (this.notificationBadge) {
            this.notificationBadge.textContent = this.unreadCount;
            this.notificationBadge.classList.toggle('hidden', this.unreadCount === 0);
        }
    }

    getNotificationTemplate(notification) {
        return `
            <div class="notification-item ${notification.read ? '' : 'bg-blue-50'} hover:bg-gray-100 p-4 cursor-pointer"
                 data-notification-id="${notification.id}">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <img src="${notification.icon}" 
                             alt=""
                             class="h-8 w-8 rounded-full">
                    </div>
                    <div class="ml-3 flex-grow">
                        <p class="text-sm font-medium text-gray-900">
                            ${notification.title}
                        </p>
                        <p class="mt-1 text-sm text-gray-500">
                            ${notification.message}
                        </p>
                        <p class="mt-1 text-xs text-gray-400">
                            ${this.formatTimestamp(notification.timestamp)}
                        </p>
                    </div>
                    ${!notification.read ? `
                        <div class="ml-3 flex-shrink-0">
                            <div class="h-2 w-2 rounded-full bg-blue-600"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getEmptyTemplate() {
        return `
            <div class="text-center py-6">
                <p class="text-gray-500">No notifications</p>
            </div>
        `;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else if (diff < 604800000) { // Less than 1 week
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    playNotificationSound() {
        if (localStorage.getItem('notifications_enabled') === 'true') {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Initialize notifications
window.Notifications = new NotificationSystem(); 