/**
 * Guahh AI - Interface Controller (Dashboard Version)
 * Wires the Chat and Log panels to the Engine.
 */

// Feedback Collection
const feedbackData = [];

document.addEventListener('DOMContentLoaded', () => {
    // Refs
    const chatView = document.getElementById('chat-viewport');
    const logView = document.getElementById('neural-log');
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    const statusText = document.getElementById('status-text');

    // Logging Bridge
    function logToTerminal(msg, type = "info") {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        // Timestamp
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        div.innerHTML = `<span style="opacity:0.5">[${time}]</span> ${msg}`;
        logView.appendChild(div);
        logView.scrollTop = logView.scrollHeight;
    }

    // Auto-resize
    input.addEventListener('input', function () {
        this.style.height = '48px';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Boot Sequence
    let bootInterval = setInterval(() => {
        if (window.GUAHH_MEMORY) {
            clearInterval(bootInterval);
            statusText.textContent = "Booting Core...";

            // Pass the log bridge to engine
            setTimeout(() => {
                const ok = GuahhEngine.init(window.GUAHH_MEMORY, logToTerminal);
                if (ok) statusText.textContent = "Online";
            }, 500);
        }
    }, 200);

    // Messaging
    let lastUserQuery = '';
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        lastUserQuery = text; // Store for feedback

        // UI Reset
        input.value = '';
        input.style.height = '48px';
        input.focus();
        btn.disabled = true;

        // Render User Msg
        addBubble(text, 'user');

        // Thought simulation delay
        await new Promise(r => setTimeout(r, 600));

        // Generate (NOW ASYNC!)
        const result = await GuahhEngine.generateResponse(text);

        // Render AI Msg with feedback buttons
        addBubble(result.text, 'ai', lastUserQuery);

        btn.disabled = false;
    }

    function addBubble(text, type, userQuery = null) {
        const div = document.createElement('div');
        div.className = `message ${type}`;

        if (type === 'ai') {
            div.innerHTML = `
                <div class="ai-header">
                    <span>◆</span> GUAHH GENERATION
                </div>
                <div class="ai-response-content">${formatMarkdown(text)}</div>
                <div class="feedback-buttons">
                    <button class="feedback-btn good" data-feedback="good" title="Good response">
                        <span>👍</span> Good
                    </button>
                    <button class="feedback-btn bad" data-feedback="bad" title="Bad response">
                        <span>👎</span> Bad
                    </button>
                </div>
            `;

            // Attach feedback handlers
            const feedbackBtns = div.querySelectorAll('.feedback-btn');
            feedbackBtns.forEach(btn => {
                btn.addEventListener('click', function () {
                    const rating = this.dataset.feedback;
                    logFeedback(userQuery, text, rating);

                    // Visual feedback
                    this.classList.add('selected');
                    this.disabled = true;

                    // Disable the other button
                    feedbackBtns.forEach(b => {
                        if (b !== this) {
                            b.disabled = true;
                            b.style.opacity = '0.3';
                        }
                    });
                });
            });
        } else {
            div.textContent = text;
        }

        chatView.appendChild(div);
        chatView.scrollTop = chatView.scrollHeight;
    }

    function formatMarkdown(text) {
        return text
            .replace(/\n\n/g, '<br><br>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    }

    /**
     * Feedback Logging System
     */
    function logFeedback(query, response, rating) {
        const feedback = {
            timestamp: new Date().toISOString(),
            query: query,
            response: response,
            rating: rating,
            id: feedbackData.length + 1
        };

        feedbackData.push(feedback);

        // Log to console in a structured format
        console.group(`%c📊 FEEDBACK #${feedback.id} - ${rating.toUpperCase()}`,
            `color: ${rating === 'good' ? '#4ade80' : '#f87171'}; font-weight: bold; font-size: 14px;`);
        console.log('%c⏰ Timestamp:', 'font-weight: bold;', feedback.timestamp);
        console.log('%c❓ User Query:', 'font-weight: bold;', query);
        console.log('%c🤖 AI Response:', 'font-weight: bold;', response);
        console.log('%c⭐ Rating:', 'font-weight: bold;', rating);
        console.groupEnd();

        // Also log a copy/paste friendly version
        console.log(
            `\n━━━ FEEDBACK DATA ━━━\n` +
            `ID: ${feedback.id}\n` +
            `Time: ${feedback.timestamp}\n` +
            `Query: ${query}\n` +
            `Response: ${response}\n` +
            `Rating: ${rating}\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n`
        );

        // Make export function available globally
        window.exportFeedback = exportFeedback;

        // Notify user
        console.log('%c💡 TIP: Call exportFeedback() to get all feedback as JSON', 'color: #60a5fa; font-style: italic;');
    }

    function exportFeedback() {
        if (feedbackData.length === 0) {
            console.warn('No feedback data collected yet.');
            return null;
        }

        const jsonStr = JSON.stringify(feedbackData, null, 2);
        console.log('\n📦 EXPORTED FEEDBACK DATA:\n');
        console.log(jsonStr);
        console.log('\n✅ Copy the JSON above to share with your AI developer!\n');

        return feedbackData;
    }

    btn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
