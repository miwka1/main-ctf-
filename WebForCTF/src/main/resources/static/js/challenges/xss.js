class XSSChallenge {
    constructor() {
        this.comments = [];
        this.isChallengeCompleted = false;
        this.challengeName = 'XSS Challenge';
        this.maxAttempts = 5;
        this.attemptCount = 0;
        this.successfulPayloads = new Set();
        this.detectedPayloads = new Set();
        this.maxAttemptsReached = false;
        this.init();
    }

    async init() {
        await this.loadChallengeStatus();
        this.initEventListeners();
        this.loadSampleComments();
        this.checkIfAlreadyCompleted();
        this.createAttemptsDisplay();
    }

    async loadChallengeStatus() {
        try {
            const response = await fetch('/challenges/xss/status', {
                credentials: 'include'
            });

            if (response.ok) {
                const status = await response.json();

                if (!status.authenticated) {
                    window.location.href = '/auth';
                    return;
                }

                this.isChallengeCompleted = status.completed || false;
                this.attemptCount = status.attempts || 0;
                this.maxAttempts = status.maxAttempts || 5;
                this.maxAttemptsReached = status.maxAttemptsReached || false;

                console.log('XSS Challenge status:', status);

                if (this.maxAttemptsReached) {
                    this.markAsHidden();
                    this.disableChallengeUI(true);
                }
            }
        } catch (error) {
            console.error('Error loading challenge status:', error);
        }
    }

    markAsHidden() {
        // Сохраняем в localStorage как запасной вариант
        localStorage.setItem('hide_xss_challenge', 'true');
        localStorage.setItem('xss_failed', JSON.stringify({
            timestamp: new Date().toISOString(),
            attempts: this.attemptCount,
            maxAttempts: this.maxAttempts
        }));

        // Добавляем в failedChallenges если менеджер доступен
        if (window.webChallengesManager) {
            window.webChallengesManager.failedChallenges.add(this.challengeName);
        }
    }

    initEventListeners() {
        document.getElementById('postCommentBtn')?.addEventListener('click', () => this.postComment());
        document.getElementById('commentInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.postComment();
        });
        document.getElementById('resetCommentsBtn')?.addEventListener('click', () => this.resetComments());
        document.getElementById('showExamplesBtn')?.addEventListener('click', () => this.showXSSExamples());
        document.getElementById('clearPayloadsBtn')?.addEventListener('click', () => this.clearDetectedPayloads());
    }

    async checkIfAlreadyCompleted() {
        try {
            const response = await fetch('/api/challenges/completed/XSS%20Challenge');
            if (response.ok) {
                const data = await response.json();
                if (data.completed) {
                    this.isChallengeCompleted = true;
                    this.disableChallengeUI();
                    this.showAlreadyCompletedMessage();
                    return true;
                }
            }
        } catch (error) {
            console.log('Не удалось проверить статус челленджа:', error);
        }
        return false;
    }

    createAttemptsDisplay() {
        const commentInputGroup = document.querySelector('.comment-input-group');
        if (commentInputGroup && !document.getElementById('attemptsCount')) {
            const attemptsDiv = document.createElement('div');
            attemptsDiv.className = 'attempts-counter';
            attemptsDiv.id = 'attemptsCount';
            attemptsDiv.innerHTML = `
                <span>Попытки: <span id="attemptCount">${this.attemptCount}</span>/${this.maxAttempts}</span>
                <span style="margin-left: 1rem; color: var(--primary-color);">
                    Найдено: <span id="foundCount">${this.detectedPayloads.size}</span>/4
                </span>
            `;
            commentInputGroup.parentNode.insertBefore(attemptsDiv, commentInputGroup.nextSibling);
        }
    }

    updateAttemptsDisplay() {
        const attemptCountElement = document.getElementById('attemptCount');
        const foundCountElement = document.getElementById('foundCount');

        if (attemptCountElement) {
            attemptCountElement.textContent = this.attemptCount;
        }
        if (foundCountElement) {
            foundCountElement.textContent = this.detectedPayloads.size;
        }
    }

    async postComment() {
        if (this.isChallengeCompleted) {
            this.showAlreadyCompletedMessage();
            return;
        }

        if (this.attemptCount >= this.maxAttempts || this.maxAttemptsReached) {
            this.showMaxAttemptsExceeded();
            return;
        }

        this.attemptCount++;
        this.updateAttemptsDisplay();

        const commentInput = document.getElementById('commentInput');
        if (!commentInput) return;

        const text = commentInput.value.trim();
        if (!text) {
            CTFPlatform.showNotification('Пожалуйста, введите комментарий', 'warning');
            return;
        }

        const newComment = {
            id: Date.now(),
            user: 'anonymous',
            text: text,
            timestamp: new Date(),
            isXSS: false
        };

        this.comments.push(newComment);
        this.renderComments();
        commentInput.value = '';

        const xssResult = this.analyzeForXSS(text);

        if (xssResult.isXSS) {
            this.detectedPayloads.add(xssResult.type);
            CTFPlatform.showNotification(
                `✅ XSS payload обнаружен! Тип: ${xssResult.type}`,
                'success'
            );

            this.highlightXSSComment(newComment.id);

            if (this.detectedPayloads.size >= 4) {
                await this.completeChallenge();
            } else {
                await this.saveProgress();
            }

            if (!this.successfulPayloads.has(xssResult.type)) {
                this.successfulPayloads.add(xssResult.type);
            }
        } else {
            CTFPlatform.showNotification('❌ XSS не обнаружен', 'error');
            await this.saveProgress();
        }

        this.updateAttemptsDisplay();

        if (this.attemptCount >= this.maxAttempts && !this.isChallengeCompleted) {
            this.showMaxAttemptsExceeded();
        }
    }

    analyzeForXSS(text) {
        const xssPatterns = [
            { type: 'script', pattern: /<script[^>]*>.*?<\/script>/i },
            { type: 'img_onerror', pattern: /<img[^>]*onerror\s*=/i },
            { type: 'svg_onload', pattern: /<svg[^>]*onload\s*=/i },
            { type: 'javascript_url', pattern: /javascript:/i },
            { type: 'body_onload', pattern: /<body[^>]*onload\s*=/i },
            { type: 'iframe_src', pattern: /<iframe[^>]*src\s*=/i },
            { type: 'alert', pattern: /alert\(/i },
            { type: 'prompt', pattern: /prompt\(/i },
            { type: 'confirm', pattern: /confirm\(/i },
            { type: 'cookie', pattern: /document\.cookie/i },
            { type: 'redirect', pattern: /window\.location/i },
            { type: 'keylogger', pattern: /onkeypress\s*=|onkeydown\s*=|onkeyup\s*=/i }
        ];

        for (const pattern of xssPatterns) {
            if (pattern.pattern.test(text)) {
                return { isXSS: true, type: pattern.type };
            }
        }

        const tagPatterns = [
            { type: 'script_tag', pattern: /<script>/i },
            { type: 'img_tag', pattern: /<img[^>]*>/i },
            { type: 'svg_tag', pattern: /<svg[^>]*>/i },
            { type: 'iframe_tag', pattern: /<iframe[^>]*>/i }
        ];

        for (const pattern of tagPatterns) {
            if (pattern.pattern.test(text)) {
                return { isXSS: true, type: pattern.type };
            }
        }

        return { isXSS: false, type: null };
    }

    highlightXSSComment(commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.classList.add('xss-detected');
            commentElement.style.animation = 'xssFlash 2s';
            setTimeout(() => {
                commentElement.style.animation = '';
            }, 2000);
        }
    }

    renderComments() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        container.innerHTML = '';

        this.comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            container.appendChild(commentElement);
        });

        container.scrollTop = container.scrollHeight;
    }

    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.setAttribute('data-comment-id', comment.id);

        if (comment.isXSS) {
            commentDiv.classList.add('xss-detected');
        }

        const metaDiv = document.createElement('div');
        metaDiv.className = 'comment-meta';
        metaDiv.innerHTML = `
            <strong>${CTFUtils.escapeHtml(comment.user)}</strong>
            <span>${this.formatTime(comment.timestamp)}</span>
        `;

        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';

        let displayText = comment.text;
        displayText = displayText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        displayText = displayText.replace(
            /(&lt;script.*?&gt;|javascript:|alert\(|onerror=|onload=|&lt;img|&lt;svg|&lt;iframe)/gi,
            '<span class="xss-highlight">$&</span>'
        );

        textDiv.innerHTML = displayText;

        commentDiv.appendChild(metaDiv);
        commentDiv.appendChild(textDiv);

        return commentDiv;
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async completeChallenge() {
        if (this.isChallengeCompleted) return;

        if (this.detectedPayloads.size < 4) {
            CTFPlatform.showNotification('Нужно найти 4 разных типа XSS payload\'ов', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/challenges/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    challengeName: this.challengeName,
                    payloadsUsed: Array.from(this.detectedPayloads),
                    attempts: this.attemptCount,
                    successfulPayloads: Array.from(this.successfulPayloads),
                    completed: true
                })
            });

            if (response.ok) {
                this.isChallengeCompleted = true;
                this.disableChallengeUI(false);

                await applyXSSPoints();

                if (window.CTFPlatform && window.CTFPlatform.showNotification) {
                    window.CTFPlatform.showNotification(
                        '🎉 XSS Challenge completed! +10 points',
                        'success'
                    );
                }

                setTimeout(() => {
                    if (window.webChallengesManager) {
                        window.webChallengesManager.updateChallengeProgress();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error completing challenge:', error);
        }
    }

    disableChallengeUI(isMaxAttempts = false) {
        const buttons = document.querySelectorAll('#postCommentBtn, #resetCommentsBtn, #showExamplesBtn, #clearPayloadsBtn');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        const commentInput = document.getElementById('commentInput');
        if (commentInput) {
            commentInput.disabled = true;
            commentInput.placeholder = isMaxAttempts ?
                'Maximum attempts reached' : 'Challenge completed!';
        }

        const commentSection = document.querySelector('.comment-section');
        if (commentSection && !commentSection.querySelector('.challenge-completed-message')) {
            const completionMessage = document.createElement('div');
            completionMessage.className = 'challenge-completed-message';

            if (isMaxAttempts) {
                completionMessage.innerHTML = `
                    <h4>❌ Maximum Attempts Reached</h4>
                    <div class="completion-details" style="background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.3);">
                        <p><strong>Status:</strong> Used all ${this.maxAttempts} attempts</p>
                        <p><strong>Payloads found:</strong> ${this.detectedPayloads.size}/4</p>
                        <p><strong>Note:</strong> This challenge is now hidden from the main page</p>
                        <button onclick="window.location.href='/category/web'" class="cta-btn secondary" style="margin-top: 1rem;">
                            Return to Challenges
                        </button>
                    </div>
                `;
            } else {
                completionMessage.innerHTML = `
                    <h4>✅ Challenge Completed</h4>
                    <div class="completion-details">
                        <p><strong>Found payload types:</strong> ${Array.from(this.detectedPayloads).join(', ')}</p>
                        <p><strong>Total attempts:</strong> ${this.attemptCount}</p>
                        <p><strong>Successful payloads:</strong> ${this.successfulPayloads.size}</p>
                        <p><strong>Status:</strong> 10 points awarded</p>
                    </div>
                `;
            }

            commentSection.appendChild(completionMessage);
        }
    }

    showAlreadyCompletedMessage() {
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('✅ This XSS challenge has already been completed!', 'info');
        }
    }

    showMaxAttemptsExceeded() {
        this.maxAttemptsReached = true;

        // Сохраняем флаг исчерпания попыток
        this.markAsHidden();
        this.saveProgress();

        // Уведомляем пользователя
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification(
                `❌ Maximum attempts (${this.maxAttempts}) exceeded. Challenge will be hidden from main page.`,
                'error'
            );
        }

        // Уведомляем WebChallengesManager
        setTimeout(() => {
            if (window.webChallengesManager) {
                window.webChallengesManager.checkChallengesStatus();
                window.webChallengesManager.hideCompletedChallenges();
            }
        }, 300);

        // Блокируем UI
        this.disableChallengeUI(true);
    }

    resetComments() {
        if (this.isChallengeCompleted) {
            this.showAlreadyCompletedMessage();
            return;
        }

        this.comments = [];
        this.loadSampleComments();

        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('Comments have been reset', 'info');
        }
    }

    clearDetectedPayloads() {
        if (this.isChallengeCompleted) return;

        this.detectedPayloads.clear();
        this.updateAttemptsDisplay();

        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('Detected payloads cleared', 'info');
        }
    }

    async saveProgress() {
        try {
            await fetch('/api/challenges/save-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    challengeName: this.challengeName,
                    attempts: this.attemptCount,
                    detectedPayloads: Array.from(this.detectedPayloads),
                    successfulPayloads: Array.from(this.successfulPayloads),
                    completed: this.isChallengeCompleted,
                    maxAttemptsReached: this.maxAttemptsReached
                })
            });
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    showXSSExamples() {
        // Оставлен для краткости - содержит тот же код, что и раньше
        // ... существующий код showXSSExamples() ...
    }

    loadSampleComments() {
        this.comments = [
            {
                id: 1,
                user: 'admin',
                text: 'Welcome to the XSS challenge! Try to find different types of XSS payloads.',
                timestamp: new Date(),
                isXSS: false
            },
            {
                id: 2,
                user: 'user123',
                text: 'This comment system might be vulnerable to XSS attacks...',
                timestamp: new Date(Date.now() - 300000),
                isXSS: false
            }
        ];
        this.renderComments();
    }
}

async function applyXSSPoints() {
    const points = 10;
    try {
        await fetch(`/points/add?amount=${points}`, {
            method: 'POST',
            credentials: 'include'
        });
        console.log(`✅ Начислено ${points} очков за XSS челлендж`);
    } catch (err) {
        console.error('Ошибка при начислении очков:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/xss')) {
        window.xssChallenge = new XSSChallenge();
    }
});