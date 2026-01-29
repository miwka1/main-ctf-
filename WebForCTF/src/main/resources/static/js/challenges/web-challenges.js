class WebChallengesManager {
    constructor() {
        this.currentChallenge = null;
        this.completedChallenges = new Set();
        this.failedChallenges = new Set();
        this.challengesStatus = new Map();
        this.init();
    }

    async init() {
        console.log('🔧 WebChallengesManager initialized');
        this.initGlobalHandlers();
        await this.loadChallengeProgress();
        await this.checkChallengesStatus();
        this.hideCompletedChallenges();
        this.setupPeriodicCheck();
    }

    initGlobalHandlers() {
        console.log('🔧 Initializing global handlers');

        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            if (button.closest('.challenge-modal')) {
                return;
            }

            const buttonText = button.textContent;
            if (buttonText.includes('Подсказка') || buttonText.includes('Hint')) {
                const challengeName = this.getCurrentChallengeName();
                this.showHint(challengeName);
                e.preventDefault();
                e.stopPropagation();
            }
        });

        this.fixLegacyButtons();
    }

    fixLegacyButtons() {
        const buttons = document.querySelectorAll('button[onclick*="showChallengeHint"]');
        buttons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            if (onclick.includes('showChallengeHint')) {
                const match = onclick.match(/showChallengeHint\('([^']+)'\)/);
                if (match) {
                    const challengeName = match[1];
                    button.onclick = null;
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showHint(challengeName);
                    });
                }
            }
        });
    }

    getCurrentChallengeName() {
        const path = window.location.pathname;
        if (path.includes('/xss')) return 'XSS Challenge';
        else if (path.includes('/sqli')) return 'SQL Injection Basic';
        else if (path.includes('/auth-bypass')) return 'Authentication Bypass';
        else if (path.includes('/csrf')) return 'CSRF Challenge';
        else if (path.includes('/path-traversal')) return 'Path Traversal';
        return 'Unknown Challenge';
    }

    async loadChallengeProgress() {
        console.log('📊 Loading challenge progress');
        try {
            const response = await fetch('/api/challenges/progress');
            if (response.ok) {
                const progress = await response.json();
                progress.forEach(challenge => {
                    if (challenge.completed) {
                        this.completedChallenges.add(challenge.challengeName);
                    }
                    if (challenge.maxAttemptsReached && !challenge.completed) {
                        this.failedChallenges.add(challenge.challengeName);
                    }
                });
            }
        } catch (error) {
            console.log('📋 Using localStorage as fallback');
        }
    }

    async checkChallengesStatus() {
        console.log('📊 Checking challenges status...');

        const webChallenges = [
            {
                name: 'SQL Injection Basic',
                endpoint: '/challenges/sqli/status',
                displayName: 'SQL Injection Basic'
            },
            {
                name: 'Authentication Bypass',
                endpoint: '/challenges/auth-bypass/status',
                displayName: 'Authentication Bypass'
            },
            {
                name: 'XSS Challenge',
                endpoint: '/challenges/xss/status', // Используем endpoint из XssController
                displayName: 'XSS Challenge'
            },
            {
                name: 'CSRF Challenge',
                endpoint: '/challenges/csrf/status',
                displayName: 'CSRF Challenge'
            }
        ];

        for (const challenge of webChallenges) {
            try {
                const response = await fetch(challenge.endpoint, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const status = await response.json();

                    if (status.authenticated) {
                        this.challengesStatus.set(challenge.name, status);

                        if (status.completed) {
                            this.completedChallenges.add(challenge.name);
                            console.log(`✅ ${challenge.name}: Задание завершено`);
                        } else if (status.maxAttemptsReached) {
                            this.failedChallenges.add(challenge.name);
                            console.log(`❌ ${challenge.name}: Попытки исчерпаны (${status.attempts}/${status.maxAttempts})`);
                        } else {
                            console.log(`📊 ${challenge.name}: В процессе, попыток: ${status.attempts}/${status.maxAttempts}`);
                        }
                    } else {
                        console.log(`🔐 ${challenge.name}: Не авторизован`);
                    }
                } else {
                    console.log(`⚠️ ${challenge.name}: Ошибка HTTP ${response.status}`);

                    // Fallback: проверяем localStorage
                    const localStorageKey = `failed_${challenge.name.replace(/\s+/g, '_')}`;
                    if (localStorage.getItem(localStorageKey) === 'true') {
                        this.failedChallenges.add(challenge.name);
                        console.log(`🗑️ ${challenge.name}: Скрыто через localStorage`);
                    }
                }
            } catch (error) {
                console.log(`❌ Не удалось проверить статус ${challenge.name}:`, error);
            }
        }

        console.log('📋 Final status:', {
            completed: Array.from(this.completedChallenges),
            failed: Array.from(this.failedChallenges)
        });
    }

    async hideCompletedChallenges() {
        console.log('🔍 Hiding completed and failed challenges...');

        const challengeCards = document.querySelectorAll('.challenge-card');
        const challengesGrid = document.getElementById('challengesGrid');

        if (!challengesGrid || challengeCards.length === 0) {
            return;
        }

        // Проверяем localStorage для XSS как fallback
        if (localStorage.getItem('hide_xss_challenge') === 'true') {
            this.failedChallenges.add('XSS Challenge');
        }

        challengeCards.forEach(card => {
            const challengeName = this.extractChallengeName(card);
            const isCompleted = this.completedChallenges.has(challengeName);
            const isFailed = this.failedChallenges.has(challengeName);

            if (isCompleted || isFailed) {
                card.style.display = 'none';
                card.dataset.hiddenReason = isCompleted ? 'completed' : 'failed';

                if (isCompleted) {
                    console.log(`🗑️ Hiding completed challenge: ${challengeName}`);
                } else {
                    console.log(`🗑️ Hiding failed challenge (max attempts): ${challengeName}`);
                }
            } else {
                card.style.display = 'block';
            }
        });

        this.showAllHiddenMessage();
    }

    showAllHiddenMessage() {
        const challengesGrid = document.getElementById('challengesGrid');
        if (!challengesGrid) return;

        // Удаляем старые сообщения
        const oldMessages = challengesGrid.querySelectorAll('.all-hidden-message, .challenges-status-message');
        oldMessages.forEach(msg => msg.remove());

        const challengeCards = document.querySelectorAll('.challenge-card');
        const hiddenCount = Array.from(challengeCards).filter(card => card.style.display === 'none').length;
        const totalCount = challengeCards.length;

        if (hiddenCount > 0 && hiddenCount >= totalCount) {
            const message = document.createElement('div');
            message.className = 'all-hidden-message';
            message.innerHTML = `
                <div class="no-challenges-message" style="background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.3);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <h3 style="color: #ff6b6b;">Все задания недоступны</h3>
                    <p>Вы либо завершили все веб-челленджи, либо исчерпали попытки для них.</p>
                    <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px; text-align: left;">
                        <p style="margin: 0.5rem 0;"><small>✅ Завершено: ${Array.from(this.completedChallenges).length}</small></p>
                        <p style="margin: 0.5rem 0;"><small>❌ Попытки исчерпаны: ${Array.from(this.failedChallenges).length}</small></p>
                        <p style="margin: 0.5rem 0;"><small>ℹ️ Задания автоматически скрываются после завершения или исчерпания попыток.</small></p>
                    </div>
                </div>
            `;
            challengesGrid.appendChild(message);
        } else if (hiddenCount > 0) {
            const statusMessage = document.createElement('div');
            statusMessage.className = 'challenges-status-message';
            statusMessage.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: 1.5rem;
                margin: 1rem 0;
                background: rgba(255, 68, 68, 0.1);
                border-radius: 12px;
                border: 1px solid rgba(255, 68, 68, 0.3);
            `;
            statusMessage.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">ℹ️</span>
                    <strong style="color: #ffaaaa;">${hiddenCount} из ${totalCount} заданий скрыто</strong>
                </div>
                <div style="font-size: 0.9rem; color: #ffaaaa;">
                    <div style="display: inline-flex; gap: 1rem; margin-top: 0.5rem;">
                        <span>✅ Завершено: ${Array.from(this.completedChallenges).length}</span>
                        <span>❌ Попытки исчерпаны: ${Array.from(this.failedChallenges).length}</span>
                    </div>
                </div>
            `;
            challengesGrid.insertBefore(statusMessage, challengesGrid.firstChild);
        }
    }

    extractChallengeName(card) {
        const titleElement = card.querySelector('h3');
        if (titleElement) {
            return titleElement.textContent.trim();
        }

        const onclick = card.getAttribute('onclick');
        if (onclick) {
            if (onclick.includes('auth-bypass')) return 'Authentication Bypass';
            if (onclick.includes('sqli')) return 'SQL Injection Basic';
            if (onclick.includes('xss')) return 'XSS Challenge';
            if (onclick.includes('csrf')) return 'CSRF Challenge';
        }

        return '';
    }

    async updateChallengeProgress() {
        await this.loadChallengeProgress();
        await this.checkChallengesStatus();
        await this.hideCompletedChallenges();
    }

    setupPeriodicCheck() {
        setInterval(async () => {
            if (window.location.pathname.includes('/category/web')) {
                await this.checkChallengesStatus();
                await this.hideCompletedChallenges();
            }
        }, 10000);
    }

    createChallengeModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'challenge-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'challenge-modal-content';
        modalContent.style.cssText = `
            background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(40, 40, 40, 0.95));
            border: 2px solid var(--primary-color);
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            color: var(--text-primary);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 2rem;
            cursor: pointer;
        `;

        closeBtn.addEventListener('click', () => modal.remove());

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            color: var(--primary-color);
            font-family: 'Orbitron', sans-serif;
            margin-bottom: 1.5rem;
            text-align: center;
        `;

        const contentElement = document.createElement('div');
        contentElement.className = 'modal-content';
        contentElement.innerHTML = content;

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(titleElement);
        modalContent.appendChild(contentElement);

        if (buttons.length > 0) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'modal-buttons';
            buttonsContainer.style.cssText = `
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            `;

            buttons.forEach(buttonConfig => {
                const button = document.createElement('button');
                button.textContent = buttonConfig.text;
                button.className = buttonConfig.className || 'cta-btn primary';

                button.addEventListener('click', () => {
                    if (buttonConfig.onClick) {
                        buttonConfig.onClick();
                    }
                    if (buttonConfig.closeModal !== false) {
                        modal.remove();
                    }
                });

                buttonsContainer.appendChild(button);
            });

            modalContent.appendChild(buttonsContainer);
        }

        modal.appendChild(modalContent);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
        return modal;
    }

    async showHint(challengeName) {
        try {
            const endpoint = this.getChallengeEndpoint(challengeName);
            const response = await fetch(`/challenges/${endpoint}/hint`);

            if (response.ok) {
                const result = await response.json();
                this.createChallengeModal(
                    '💡 Подсказка',
                    `
                        <div style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">💡</div>
                            <p style="color: var(--text-secondary); line-height: 1.6;">
                                ${result.hint || 'Подсказка не найдена'}
                            </p>
                        </div>
                    `,
                    [{
                        text: 'Понятно',
                        className: 'cta-btn primary',
                        onClick: () => console.log('Hint acknowledged')
                    }]
                );
            }
        } catch (error) {
            console.error('❌ Hint loading error:', error);
        }
    }

    getChallengeEndpoint(challengeName) {
        const endpoints = {
            'SQL Injection Basic': 'sqli',
            'Authentication Bypass': 'auth-bypass',
            'XSS Challenge': 'xss',
            'CSRF Challenge': 'csrf',
            'Path Traversal': 'path-traversal'
        };
        return endpoints[challengeName] || challengeName.toLowerCase().replace(' ', '-');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/category/web') ||
        window.location.pathname.includes('/challenges/')) {
        window.webChallengesManager = new WebChallengesManager();
    }
});