// Messaging System
class Messaging {
    constructor() {
        this.conversations = new Map();
        this.activeConversation = null;
        this.unreadCount = 0;
        this.socket = null;
        this.initMessaging();
    }

    async initMessaging() {
        if (!window.Auth.isAuthenticated()) return;

        // Initialize WebSocket connection
        this.initWebSocket();
        
        // Initialize UI elements
        this.messageContainer = document.querySelector('#message-container');
        this.conversationList = document.querySelector('#conversation-list');
        this.messageInput = document.querySelector('#message-input');
        this.unreadBadge = document.querySelector('#unread-badge');

        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(this.messageInput.value);
                }
            });
        }

        // Load initial conversations
        await this.loadConversations();
    }

    initWebSocket() {
        this.socket = new WebSocket(`wss://${window.location.host}/ws/messages`);
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.socket.onclose = () => {
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.initWebSocket(), 5000);
        };

        this.socket.onerror = (error) => {
            window.Analytics.error.logError({
                type: 'websocket_error',
                message: error.message
            });
        };
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/messages/conversations', {
                headers: {
                    'Authorization': `Bearer ${window.Auth.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load conversations');

            const data = await response.json();
            this.conversations.clear();
            data.conversations.forEach(conv => {
                this.conversations.set(conv.id, conv);
            });

            this.updateConversationList();
            this.updateUnreadCount();
        } catch (error) {
            window.Analytics.error.logError({
                type: 'messaging_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async loadMessages(conversationId) {
        try {
            const response = await fetch(`/api/messages/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${window.Auth.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load messages');

            const data = await response.json();
            this.activeConversation = conversationId;
            this.updateMessageContainer(data.messages);
            this.markConversationAsRead(conversationId);
        } catch (error) {
            window.Analytics.error.logError({
                type: 'messaging_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async sendMessage(content) {
        if (!content.trim() || !this.activeConversation) return;

        try {
            const response = await fetch(`/api/messages/${this.activeConversation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.Auth.token}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error('Failed to send message');

            // Clear input
            this.messageInput.value = '';

            // Track message sent
            window.Analytics.behavior.trackEvent('message_sent', {
                conversation_id: this.activeConversation
            });
        } catch (error) {
            window.Analytics.error.logError({
                type: 'messaging_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_message':
                this.handleNewMessage(data.message);
                break;
            case 'message_read':
                this.handleMessageRead(data.conversationId);
                break;
            case 'typing':
                this.handleTypingIndicator(data.conversationId, data.userId);
                break;
        }
    }

    handleNewMessage(message) {
        // Add message to conversation
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
            conversation.messages.push(message);
            conversation.lastMessage = message;
            
            if (message.conversationId === this.activeConversation) {
                this.appendMessage(message);
                this.markConversationAsRead(message.conversationId);
            } else {
                conversation.unreadCount++;
                this.updateUnreadCount();
            }

            this.updateConversationList();
        }

        // Play notification sound if not active conversation
        if (message.conversationId !== this.activeConversation) {
            this.playNotificationSound();
        }
    }

    handleMessageRead(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
            this.updateUnreadCount();
            this.updateConversationList();
        }
    }

    handleTypingIndicator(conversationId, userId) {
        const typingIndicator = document.querySelector(`#typing-${conversationId}`);
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                typingIndicator.classList.add('hidden');
            }, 3000);
        }
    }

    markConversationAsRead(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (conversation && conversation.unreadCount > 0) {
            conversation.unreadCount = 0;
            this.updateUnreadCount();
            this.updateConversationList();

            // Notify server
            this.socket.send(JSON.stringify({
                type: 'mark_read',
                conversationId
            }));
        }
    }

    updateUnreadCount() {
        this.unreadCount = Array.from(this.conversations.values())
            .reduce((total, conv) => total + (conv.unreadCount || 0), 0);

        if (this.unreadBadge) {
            this.unreadBadge.textContent = this.unreadCount;
            this.unreadBadge.classList.toggle('hidden', this.unreadCount === 0);
        }
    }

    updateConversationList() {
        if (!this.conversationList) return;

        const sortedConversations = Array.from(this.conversations.values())
            .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

        this.conversationList.innerHTML = sortedConversations
            .map(conv => this.getConversationTemplate(conv))
            .join('');

        // Add click handlers
        this.conversationList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                this.loadMessages(conversationId);
            });
        });
    }

    updateMessageContainer(messages) {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = messages
            .map(msg => this.getMessageTemplate(msg))
            .join('');

        // Scroll to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    appendMessage(message) {
        if (!this.messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.innerHTML = this.getMessageTemplate(message);
        this.messageContainer.appendChild(messageElement.firstChild);

        // Scroll to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    getConversationTemplate(conversation) {
        const unread = conversation.unreadCount > 0;
        return `
            <div class="conversation-item ${unread ? 'bg-blue-50' : ''} hover:bg-gray-100 p-4 cursor-pointer"
                 data-conversation-id="${conversation.id}">
                <div class="flex items-center">
                    <img src="${conversation.participant.avatar}"
                         alt="${conversation.participant.name}"
                         class="w-12 h-12 rounded-full">
                    <div class="ml-4 flex-grow">
                        <div class="flex justify-between">
                            <h4 class="font-semibold ${unread ? 'text-blue-600' : ''}">${conversation.participant.name}</h4>
                            <span class="text-sm text-gray-500">${this.formatTimestamp(conversation.lastMessage.timestamp)}</span>
                        </div>
                        <p class="text-gray-600 truncate">${conversation.lastMessage.content}</p>
                    </div>
                    ${unread ? `<span class="ml-2 bg-blue-600 text-white rounded-full px-2 py-1 text-xs">${conversation.unreadCount}</span>` : ''}
                </div>
            </div>
        `;
    }

    getMessageTemplate(message) {
        const isOwn = message.userId === window.Auth.getUser().id;
        return `
            <div class="message ${isOwn ? 'flex justify-end' : 'flex justify-start'} mb-4">
                <div class="${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                    <p>${message.content}</p>
                    <div class="text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} mt-1">
                        ${this.formatTimestamp(message.timestamp)}
                    </div>
                </div>
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
        // Only play if user has enabled notifications
        if (localStorage.getItem('notifications_enabled') === 'true') {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }
}

// Initialize messaging
window.Messaging = new Messaging(); 