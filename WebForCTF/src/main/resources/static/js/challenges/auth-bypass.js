class AuthBypassChallenge {
    constructor() {
        this.accessLog = [];
        this.isAdmin = false;
        this.isChallengeCompleted = false;
        this.challengeName = 'Authentication Bypass';
        this.maxAttempts = 5;
        this.attemptCount = 0;
        this.usedMethods = new Set();
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadAccessLog();
        this.checkIfAlreadyCompleted();
        this.createAttemptsDisplay();
    }

    initEventListeners() {
        document.getElementById('checkAccessBtn')?.addEventListener('click', () => this.checkAccess());
        document.getElementById('resetAccessBtn')?.addEventListener('click', () => this.resetChallenge());
        
        document.getElementById('cookieMethodBtn')?.addEventListener('click', () => this.setAdminCookie());
        document.getElementById('localStorageBtn')?.addEventListener('click', () => this.setAdminLocalStorage());
        document.getElementById('sessionStorageBtn')?.addEventListener('click', () => this.setAdminSessionStorage());
        document.getElementById('urlMethodBtn')?.addEventListener('click', () => this.setAdminURLParams());
    }

    async checkIfAlreadyCompleted() {
        try {
            const response = await fetch('/api/challenges/completed/Authentication%20Bypass');
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
        const accessControl = document.querySelector('.access-control');
        if (accessControl && !document.getElementById('attemptsCount')) {
            const attemptsDiv = document.createElement('div');
            attemptsDiv.className = 'attempts-counter';
            attemptsDiv.id = 'attemptsCount';
            attemptsDiv.innerHTML = `<span>Попытки: <span id="attemptCount">${this.attemptCount}</span>/${this.maxAttempts}</span>`;
            accessControl.appendChild(attemptsDiv);
        }
    }

    updateAttemptsDisplay() {
        const attemptCountElement = document.getElementById('attemptCount');
        if (attemptCountElement) {
            attemptCountElement.textContent = this.attemptCount;
        }
    }

    async checkAccess() {
        if (this.isChallengeCompleted) {
            this.showAlreadyCompletedMessage();
            return;
        }

        if (this.attemptCount >= this.maxAttempts) {
            this.showMaxAttemptsExceeded();
            return;
        }

        this.attemptCount++;
        this.updateAttemptsDisplay();

        const bypassMethods = this.detectBypassMethods();
        
        if (bypassMethods.length > 0) {
            bypassMethods.forEach(method => this.usedMethods.add(method));
            
            // Показываем успешный доступ
            this.grantAdminAccess(bypassMethods);
            
            // Проверяем, использовано ли достаточно методов
            if (this.usedMethods.size >= 2) {
                await this.completeChallenge();
            }
        } else {
            this.denyAccess();
        }

        this.logAccessAttempt(bypassMethods.length > 0, bypassMethods.join(', ') || 'NONE');
        await this.saveProgress();
    }

    detectBypassMethods() {
        const methods = [];
        
        // Проверка cookie
        if (this.getCookie('isAdmin') === 'true') {
            methods.push('cookie');
        }
        
        // Проверка URL параметров
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true' || urlParams.get('debug') === '1') {
            methods.push('url');
        }
        
        // Проверка localStorage
        if (localStorage.getItem('admin') === 'true') {
            methods.push('localStorage');
        }
        
        // Проверка sessionStorage
        if (sessionStorage.getItem('privileges') === 'admin') {
            methods.push('sessionStorage');
        }
        
        return methods;
    }

    grantAdminAccess(methods) {
        this.isAdmin = true;
        this.showAdminContent();
        
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = 'Access: GRANTED';
            statusText.style.color = '#00ff88';
        }
        
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification(
                `✅ Admin access granted! Methods: ${methods.join(', ')}`,
                'success'
            );
        }
    }

    denyAccess() {
        this.isAdmin = false;
        this.hideAdminContent();
        
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = 'Access: DENIED';
            statusText.style.color = '#ff4444';
        }
        
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            const remaining = this.maxAttempts - this.attemptCount;
            window.CTFPlatform.showNotification(
                `❌ Access denied. Attempts left: ${remaining}`,
                'error'
            );
        }
    }

    async completeChallenge() {
        if (this.isChallengeCompleted) return;

        try {
            const response = await fetch('/api/challenges/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    challengeName: this.challengeName,
                    methodsUsed: Array.from(this.usedMethods),
                    attempts: this.attemptCount
                })
            });

            if (response.ok) {
                this.isChallengeCompleted = true;
                this.disableChallengeUI();
                
                // Начисляем очки
                await applyAuthBypassPoints();
                
                if (window.CTFPlatform && window.CTFPlatform.showNotification) {
                    window.CTFPlatform.showNotification(
                        '🎉 Challenge completed successfully! +3 points',
                        'success'
                    );
                }
                
                // Обновляем UI на главной странице
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

    disableChallengeUI() {
        const buttons = document.querySelectorAll('#checkAccessBtn, #cookieMethodBtn, #localStorageBtn, #sessionStorageBtn, #urlMethodBtn, #resetAccessBtn');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        const adminContent = document.getElementById('adminContent');
        if (adminContent) {
            adminContent.style.display = 'block';
            adminContent.innerHTML = `
                <h4>✅ Challenge Completed</h4>
                <div class="challenge-completed">
                    <p>This challenge has been completed successfully!</p>
                    <p><strong>Methods used:</strong> ${Array.from(this.usedMethods).join(', ')}</p>
                    <p><strong>Total attempts:</strong> ${this.attemptCount}</p>
                    <p><strong>Status:</strong> 3 points awarded</p>
                </div>
            `;
        }
    }

    showAlreadyCompletedMessage() {
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('✅ This challenge has already been completed!', 'info');
        }
    }

    showMaxAttemptsExceeded() {
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification(
                `❌ Maximum attempts (${this.maxAttempts}) exceeded. Challenge locked.`,
                'error'
            );
        }
    }

    setAdminCookie() {
        document.cookie = "isAdmin=true; path=/; max-age=3600";
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('🍪 Admin cookie set', 'info');
        }
    }

    setAdminLocalStorage() {
        localStorage.setItem('admin', 'true');
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('💾 Admin flag set in localStorage', 'info');
        }
    }

    setAdminSessionStorage() {
        sessionStorage.setItem('privileges', 'admin');
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('🔐 Admin privileges set in sessionStorage', 'info');
        }
    }

    setAdminURLParams() {
        const url = new URL(window.location);
        url.searchParams.set('admin', 'true');
        window.history.replaceState({}, '', url);
        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('🔗 URL parameters set', 'info');
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
                    methodsUsed: Array.from(this.usedMethods),
                    completed: this.isChallengeCompleted
                })
            });
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    showAdminContent() {
        const adminContent = document.getElementById('adminContent');
        if (adminContent) {
            adminContent.style.display = 'block';
        }
    }

    hideAdminContent() {
        const adminContent = document.getElementById('adminContent');
        if (adminContent) {
            adminContent.style.display = 'none';
        }
    }

    logAccessAttempt(success, method) {
        const timestamp = new Date();
        const userAgent = navigator.userAgent;

        this.accessLog.unshift({
            timestamp: timestamp,
            success: success,
            method: method,
            userAgent: userAgent.substring(0, 50) + '...'
        });

        this.updateAccessLog();
    }

    updateAccessLog() {
        const logEntries = document.getElementById('logEntries');
        if (!logEntries) return;

        logEntries.innerHTML = '';

        this.accessLog.slice(0, 10).forEach(entry => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${entry.success ? 'success' : 'failed'}`;
            
            const time = entry.timestamp.toLocaleTimeString('ru-RU');
            logElement.innerHTML = `
                <span class="log-time">[${time}]</span>
                <span class="log-method">${entry.method}</span>
                <span class="log-status">${entry.success ? '✅ GRANTED' : '❌ DENIED'}</span>
            `;
            
            logEntries.appendChild(logElement);
        });
    }

    loadAccessLog() {
        this.accessLog = [
            {
                timestamp: new Date(Date.now() - 300000),
                success: false,
                method: 'NONE',
                userAgent: 'Mozilla/5.0...'
            }
        ];
        this.updateAccessLog();
    }

    resetChallenge() {
        if (this.isChallengeCompleted) {
            this.showAlreadyCompletedMessage();
            return;
        }

        this.accessLog = [];
        this.hideAdminContent();
        this.loadAccessLog();

        // Сбрасываем все методы обхода
        document.cookie = "isAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('admin');
        sessionStorage.removeItem('privileges');

        const url = new URL(window.location);
        url.searchParams.delete('admin');
        url.searchParams.delete('debug');
        window.history.replaceState({}, '', url);

        if (window.CTFPlatform && window.CTFPlatform.showNotification) {
            window.CTFPlatform.showNotification('🔄 Challenge reset', 'info');
        }
    }
}

async function applyAuthBypassPoints() {
    const points = 3;
    try {
        await fetch(`/points/add?amount=${points}`, {
            method: 'POST',
            credentials: 'include'
        });
        
        console.log(`✅ Начислено ${points} очков за Auth Bypass челлендж`);
    } catch (err) {
        console.error('Ошибка при начислении очков:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/auth-bypass')) {
        window.authBypassChallenge = new AuthBypassChallenge();
    }
});