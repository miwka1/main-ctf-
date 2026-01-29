/**
 * CTF Platform - SQL Injection Challenge (Updated)
 * Использует существующую логику начисления очков
 */

class SQLInjectionChallenge {
    constructor() {
        this.attempts = 0;
        this.maxAttempts = 3; // Изменено с 8 на 3
        this.isCompleted = false;
        this.maxAttemptsReached = false;
        this.init();
    }

    async init() {
        await this.loadChallengeStatus();
        this.initEventListeners();
        this.updateUI();
    }

    async loadChallengeStatus() {
        try {
            const response = await fetch('/challenges/sqli/status', {
                credentials: 'include'
            });

            if (response.ok) {
                const status = await response.json();

                if (!status.authenticated) {
                    window.location.href = '/auth';
                    return;
                }

                this.isCompleted = status.completed || false;
                this.attempts = status.attempts || 0;
                this.maxAttempts = status.maxAttempts || 3;
                this.maxAttemptsReached = status.maxAttemptsReached || false;

                console.log('Challenge status:', status);

                // Если попытки закончились, уведомляем WebChallengesManager
                if (this.maxAttemptsReached && window.webChallengesManager) {
                    setTimeout(() => {
                        window.webChallengesManager.checkChallengesStatus();
                        window.webChallengesManager.hideCompletedChallenges();
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error loading challenge status:', error);
        }
    }

    initEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const resetChallengeBtn = document.getElementById('resetChallengeBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (resetChallengeBtn) {
            resetChallengeBtn.addEventListener('click', () => {
                this.resetChallenge();
            });
        }
    }

    updateUI() {
        if (this.isCompleted) {
            this.showCompletedUI();
        } else if (this.maxAttemptsReached) {
            this.showMaxAttemptsUI();
        } else if (this.attempts > 0) {
            // Показываем предупреждение если осталось мало попыток
            const remaining = this.maxAttempts - this.attempts;
            if (remaining <= 2) {
                this.showWarningMessage();
            }
        }
    }

    showCompletedUI() {
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.innerHTML = `
                <div class="challenge-completed">
                    <div class="completed-icon">🎉</div>
                    <h3>Задание выполнено!</h3>
                    <p>Вы успешно прошли SQL Injection Challenge.</p>
                    <p class="points-earned">Получено: 5 очков</p>
                    <div class="flag-display">
                        <strong>Флаг:</strong>
                        <code>ctf{sql1nj3ct10n_b4s1c_2024}</code>
                    </div>
                    <button onclick="window.location.href='/category/web'" class="cta-btn primary">
                        Вернуться к заданиям
                    </button>
                </div>
            `;
        }
    }

    showMaxAttemptsUI() {
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            // Сохраняем текущую форму если она есть
            const existingForm = loginForm.querySelector('form');

            if (!loginForm.querySelector('.max-attempts-warning')) {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'max-attempts-warning';
                warningDiv.style.cssText = `
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: rgba(255, 68, 68, 0.2);
                    border: 1px solid rgba(255, 68, 68, 0.4);
                    border-radius: 8px;
                    text-align: center;
                `;
                warningDiv.innerHTML = `
                    <div class="warning-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <h4 style="color: #ff6b6b; margin-bottom: 0.5rem;">Превышено количество попыток</h4>
                    <p style="color: #ffaaaa; margin-bottom: 1rem;">Вы использовали все ${this.maxAttempts} попытки для этого задания.</p>
                    <button id="requestResetBtn" class="cta-btn secondary">
                        Запросить сброс
                    </button>
                `;

                loginForm.appendChild(warningDiv);

                document.getElementById('requestResetBtn').addEventListener('click', () => {
                    this.requestReset();
                });
            }

            // Блокируем форму
            if (existingForm) {
                const submitBtn = existingForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Попытки исчерпаны';
                    submitBtn.style.opacity = '0.5';
                    submitBtn.style.cursor = 'not-allowed';
                }

                const inputs = existingForm.querySelectorAll('input');
                inputs.forEach(input => {
                    input.disabled = true;
                    input.placeholder = 'Попытки исчерпаны';
                });
            }
        }
    }

    showWarningMessage() {
        const remaining = this.maxAttempts - this.attempts;
        if (remaining > 0) {
            const loginForm = document.querySelector('.login-form');
            if (loginForm && !loginForm.querySelector('.attempt-warning')) {
                const warning = document.createElement('div');
                warning.className = 'attempt-warning';
                warning.style.cssText = `
                    padding: 0.75rem;
                    margin: 1rem 0;
                    background: rgba(255, 165, 0, 0.2);
                    border: 1px solid orange;
                    border-radius: 8px;
                    text-align: center;
                `;
                warning.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <small><strong>Внимание!</strong> Осталось попыток: ${remaining}. Будьте осторожны!</small>
                    </div>
                `;

                const form = loginForm.querySelector('form');
                if (form) {
                    loginForm.insertBefore(warning, form.nextSibling);

                    // Удаляем предупреждение через 10 секунд
                    setTimeout(() => {
                        if (warning.parentNode) {
                            warning.parentNode.removeChild(warning);
                        }
                    }, 10000);
                }
            }
        }
    }

    async handleLogin() {
        if (this.isCompleted) {
            this.showMessage('Вы уже завершили это задание', 'info');
            return;
        }

        if (this.maxAttemptsReached) {
            this.showMessage(`Превышено максимальное количество попыток (${this.maxAttempts})`, 'error');
            return;
        }

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('Введите имя пользователя и пароль', 'error');
            return;
        }

        try {
            const response = await this.submitSolution(username, password);
            this.processResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Ошибка соединения', 'error');
        }
    }

    async submitSolution(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('/challenges/sqli/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
            body: formData
        });

        return await response.json();
    }

    async processResponse(response) {
        if (response.success) {
            this.isCompleted = true;
            this.showMessage(response.message, 'success');
            this.celebrateSuccess();
            this.showCompletedUI();

            // Начисляем очки через вашу существующую систему
            await this.awardPoints(5);

            // Обновляем прогресс на странице с заданиями
            if (window.webChallengesManager) {
                setTimeout(() => {
                    window.webChallengesManager.checkChallengesStatus();
                    window.webChallengesManager.hideCompletedChallenges();
                }, 1500);
            }
        } else {
            if (response.maxAttemptsReached) {
                this.attempts = this.maxAttempts;
                this.maxAttemptsReached = true;
                this.showMaxAttemptsUI();
                this.showMessage(response.message, 'error');

                // Уведомляем WebChallengesManager о том, что попытки закончились
                if (window.webChallengesManager) {
                    setTimeout(() => {
                        window.webChallengesManager.checkChallengesStatus();
                        window.webChallengesManager.hideCompletedChallenges();
                    }, 1500);
                }
            } else if (response.completed) {
                this.isCompleted = true;
                this.showCompletedUI();
            } else {
                this.attempts++;
                this.showMessage(response.message, 'error');

                // Если осталось мало попыток, показываем предупреждение
                if (this.maxAttempts - this.attempts <= 2) {
                    this.showWarningMessage();
                }
            }
        }
    }

    async awardPoints(points) {
        try {
            // Используем вашу существующую систему начисления очков
            const response = await fetch(`/points/add?amount=${points}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                console.log(`✅ Начислено ${points} очков за SQL Injection Challenge`);

                // Показываем уведомление
                if (typeof CTFPlatform !== 'undefined' && CTFPlatform.showNotification) {
                    CTFPlatform.showNotification(`+${points} очков за SQL Injection Challenge!`, 'success');
                }
            } else {
                console.error('Ошибка при начислении очков');
            }
        } catch (error) {
            console.error('Ошибка при начислении очков:', error);
        }
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('message');
        if (!messageElement) return;

        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';

        // Стили для разных типов сообщений
        if (type === 'success') {
            messageElement.style.cssText = `
                display: block;
                padding: 1rem;
                margin: 1rem 0;
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
                border-radius: 8px;
                color: #00ff88;
            `;
        } else if (type === 'error') {
            messageElement.style.cssText = `
                display: block;
                padding: 1rem;
                margin: 1rem 0;
                background: rgba(255, 68, 68, 0.2);
                border: 1px solid #ff4444;
                border-radius: 8px;
                color: #ff6b6b;
            `;
        } else {
            messageElement.style.cssText = `
                display: block;
                padding: 1rem;
                margin: 1rem 0;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: var(--text-secondary);
            `;
        }

        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        }
    }

    celebrateSuccess() {
        this.createConfetti();

        // Звуковой эффект успеха (если нужно)
        try {
            const audio = new Audio('/sounds/success.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio not available');
        }
    }

    createConfetti() {
        const colors = ['#00ff88', '#0088ff', '#ff0088', '#ffa500', '#ffff00', '#8000ff'];
        const confettiCount = 100;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                const size = Math.random() * 10 + 5;
                const color = colors[Math.floor(Math.random() * colors.length)];

                confetti.style.cssText = `
                    position: fixed;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                    top: -20px;
                    left: ${Math.random() * 100}%;
                    animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
                    z-index: 10000;
                    pointer-events: none;
                    opacity: ${Math.random() * 0.5 + 0.5};
                    transform: rotate(${Math.random() * 360}deg);
                `;
                document.body.appendChild(confetti);

                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 4000);
            }, i * 30);
        }

        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async resetChallenge() {
        try {
            const response = await fetch('/challenges/sqli/reset', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.attempts = 0;
                    this.isCompleted = false;
                    this.maxAttemptsReached = false;
                    this.showMessage(result.message, 'info');

                    // Перезагружаем страницу для сброса UI
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            }
        } catch (error) {
            console.error('Error resetting challenge:', error);
            this.showMessage('Ошибка при сбросе задания', 'error');
        }
    }

    async requestReset() {
        const confirmed = confirm('Запросить сброс задания у администратора?\n\nПосле сброса вы сможете попробовать снова.');
        if (confirmed) {
            this.showMessage('Запрос отправлен администратору. Ожидайте ответа.', 'info');

            // В реальном приложении здесь был бы запрос к API
            setTimeout(() => {
                this.showMessage('Администратор пока не ответил на запрос. Попробуйте позже.', 'info');
            }, 3000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/sqli')) {
        console.log('🚀 Initializing SQL Injection Challenge');
        window.sqliChallenge = new SQLInjectionChallenge();
    }
});

// Экспорт для отладки
if (typeof window !== 'undefined') {
    window.SQLInjectionChallenge = SQLInjectionChallenge;
}