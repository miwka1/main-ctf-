// tests.js - исправленная версия

// Инициализация теста
let currentQuestion = 1;
const totalQuestions = 25;
let userAnswers = {};
let startTime = Date.now();
let questionsElements = [];

const answers = {
    1: "c", 2: "c", 3: "c", 4: "c", 5: "c",
    6: "c", 7: "b", 8: "b", 9: "c", 10: "b",
    11: "b", 12: "c", 13: "c", 14: "b", 15: "b",
    16: "b", 17: "d", 18: "c", 19: "d", 20: "c",
    21: "c", 22: "d", 23: "b", 24: "b", 25: "b"
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeTest();
    setupEventListeners();
});

function initializeTest() {
    // Собираем все вопросы из HTML
    collectQuestionsFromHTML();
    
    // Проверяем, сколько вопросов найдено
    console.log(`Найдено вопросов: ${questionsElements.length}`);
    
    if (questionsElements.length === 0) {
        console.error("Вопросы не найдены! Проверьте HTML-разметку.");
        alert("Ошибка: вопросы не найдены на странице.");
        return;
    }
    
    // Показываем первый вопрос
    renderQuestions();
    updateProgress();
    updateIndicators();
    startTimer();
}

function collectQuestionsFromHTML() {
    // Находим все элементы вопросов в контейнере
    const container = document.getElementById('questionsContainer');
    if (!container) {
        console.error("Контейнер вопросов не найден!");
        return;
    }
    
    questionsElements = Array.from(container.querySelectorAll('.question-card'));
    
    // Сортируем вопросы по data-id
    questionsElements.sort((a, b) => {
        return parseInt(a.dataset.id) - parseInt(b.dataset.id);
    });
    
    console.log("Вопросы отсортированы:", questionsElements.map(q => q.dataset.id));
}

function renderQuestions() {
    // Скрываем все вопросы
    questionsElements.forEach(q => {
        q.style.display = 'none';
        q.classList.remove('active');
    });
    
    // Показываем только текущий вопрос
    const currentQuestionElement = questionsElements.find(q => parseInt(q.dataset.id) === currentQuestion);
    if (currentQuestionElement) {
        currentQuestionElement.style.display = 'block';
        currentQuestionElement.classList.add('active');
        
        // Восстанавливаем выбранный ответ, если он был
        const selectedValue = userAnswers[currentQuestion];
        if (selectedValue) {
            const radioInput = currentQuestionElement.querySelector(`input[type="radio"][value="${selectedValue}"]`);
            if (radioInput) {
                radioInput.checked = true;
            }
        }
    }
}

function setupEventListeners() {
    // Проверяем существование элементов перед добавлением обработчиков
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const checkTestBtn = document.getElementById('checkTestBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', goToPreviousQuestion);
    } else {
        console.error("Кнопка 'Назад' не найдена!");
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', goToNextQuestion);
    } else {
        console.error("Кнопка 'Далее' не найдена!");
    }

    if (checkTestBtn) {
        checkTestBtn.addEventListener('click', completeTest);
    } else {
        console.warn("Кнопка 'Завершить и получить очки' не найдена. Возможно, она еще не отображена.");
        // Добавим обработчик позже, когда кнопка появится
        setTimeout(() => {
            const btn = document.getElementById('checkTestBtn');
            if (btn) {
                btn.addEventListener('click', completeTest);
                console.log("Обработчик для checkTestBtn добавлен с задержкой");
            }
        }, 1000);
    }

    // Обработка выбора ответов
    document.addEventListener('change', (e) => {
        if (e.target.type === 'radio' && e.target.name.startsWith('q')) {
            const questionId = parseInt(e.target.name.substring(1));
            userAnswers[questionId] = e.target.value;
            console.log(`Вопрос ${questionId}: выбран ответ ${e.target.value}`);
            updateIndicators();
        }
    });

    // Обработка выбора индикаторов вопросов
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('indicator')) {
            const questionId = parseInt(e.target.dataset.id);
            goToQuestion(questionId);
        }
    });

    // Обработка клавиатуры
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToPreviousQuestion();
        } else if (e.key === 'ArrowRight') {
            goToNextQuestion();
        }
    });
}

function goToQuestion(id) {
    if (id >= 1 && id <= totalQuestions) {
        currentQuestion = id;
        renderQuestions();
        updateProgress();
        updateIndicators();
        updateNavigationButtons();
    }
}

function goToPreviousQuestion() {
    if (currentQuestion > 1) {
        goToQuestion(currentQuestion - 1);
    }
}

function goToNextQuestion() {
    if (currentQuestion < totalQuestions) {
        goToQuestion(currentQuestion + 1);
    } else {
        showResults();
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const currentQuestionEl = document.getElementById('currentQuestion');

    if (progressFill) {
        const progress = (currentQuestion / totalQuestions) * 100;
        progressFill.style.width = `${progress}%`;
    }

    if (currentQuestionEl) {
        currentQuestionEl.textContent = currentQuestion;
        document.getElementById('totalQuestions').textContent = totalQuestions;
    }
}

function updateIndicators() {
    const container = document.getElementById('questionIndicators');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 1; i <= totalQuestions; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.dataset.id = i;

        if (i === currentQuestion) {
            indicator.classList.add('active');
        }

        if (userAnswers[i]) {
            indicator.classList.add('answered');
        } else if (i < currentQuestion && !userAnswers[i]) {
            indicator.classList.add('skipped');
        }

        container.appendChild(indicator);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.disabled = currentQuestion === 1;
    }

    if (nextBtn) {
        if (currentQuestion === totalQuestions) {
            nextBtn.innerHTML = 'Завершить тест <span class="nav-btn-icon">🏁</span>';
        } else {
            nextBtn.innerHTML = 'Далее <span class="nav-btn-icon">→</span>';
        }
    }
}

function startTimer() {
    const timerText = document.getElementById('timerText');
    if (!timerText) return;

    const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    setInterval(updateTimer, 1000);
    updateTimer();
}

function showResults() {
    const questionsContainer = document.getElementById('questionsContainer');
    const resultsSection = document.getElementById('resultsSection');
    const navigation = document.querySelector('.test-navigation');

    if (questionsContainer) questionsContainer.style.display = 'none';
    if (navigation) navigation.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';

    calculateResults();

    // Теперь кнопки точно должны существовать, добавляем обработчики
    setTimeout(() => {
        const checkTestBtn = document.getElementById('checkTestBtn');


        if (checkTestBtn) {
            // Удаляем старый обработчик, если он был
            checkTestBtn.removeEventListener('click', completeTest);
            // Добавляем новый
            checkTestBtn.addEventListener('click', completeTest);
            console.log("Обработчик для checkTestBtn добавлен после showResults");
        }
    }, 100);
}

function calculateResults() {
    let score = 0;

    console.log("Проверка ответов:");
    console.log("Ответы пользователя:", userAnswers);
    console.log("Правильные ответы:", answers);

    for (let i = 1; i <= totalQuestions; i++) {
        const userAnswer = userAnswers[i];
        const correctAnswer = answers[i];

        console.log(`Вопрос ${i}: пользователь - ${userAnswer}, правильный - ${correctAnswer}`);

        if (userAnswer && userAnswer.toLowerCase() === correctAnswer) {
            score++;
            console.log(`Вопрос ${i}: ПРАВИЛЬНО!`);
        } else {
            console.log(`Вопрос ${i}: НЕПРАВИЛЬНО!`);
        }
    }

    console.log(`Итоговый счет: ${score}/${totalQuestions}`);

    const percent = Math.round((score / totalQuestions) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    // Определение уровня
    let level = "Дно лоускильное";
    let levelDesc = "Нужно подтянуть знания";
    let levelClass = "dno";

    if (score >= 9 && score <= 17) {
        level = "Medium";
        levelDesc = "Хорошие знания";
        levelClass = "medium";
    } else if (score >= 18) {
        level = "GRANDMASTER";
        levelDesc = "Отличные знания!";
        levelClass = "grandmaster";
    }

    // Обновляем UI
    const finalScoreEl = document.getElementById('finalScore');
    const finalPercentageEl = document.getElementById('finalPercentage');
    const timeSpentEl = document.getElementById('timeSpent');
    const levelNameEl = document.getElementById('levelName');
    const levelDescEl = document.getElementById('levelDesc');
    const levelBadge = document.getElementById('levelBadge');

    if (finalScoreEl) finalScoreEl.textContent = `${score}/${totalQuestions}`;
    if (finalPercentageEl) finalPercentageEl.textContent = `${percent}%`;
    if (timeSpentEl) timeSpentEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (levelNameEl) levelNameEl.textContent = level;
    if (levelDescEl) levelDescEl.textContent = levelDesc;

    if (levelBadge) {
        levelBadge.classList.remove('dno', 'medium', 'grandmaster');
        levelBadge.classList.add(levelClass);
    }
}

async function completeTest() {
    let score = 0;

    // Перепроверяем ответы
    for (let i = 1; i <= totalQuestions; i++) {
        if (userAnswers[i] && userAnswers[i].toLowerCase() === answers[i]) {
            score++;
        }
    }

    const percent = Math.round((score / totalQuestions) * 100);

    let level = "ДНО";
    if (score >= 9 && score <= 17) level = "Medium";
    else if (score >= 18) level = "GRANDMASTER";

    console.log("=== ФИНАЛЬНАЯ ПРОВЕРКА ===");
    console.log("Все ответы пользователя:", userAnswers);
    console.log("Количество вопросов:", totalQuestions);
    console.log("Правильных ответов:", score);

    try {
        // Отправляем результат на сервер
        await fetch("/tests/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score: score })
        });

        // Начисляем очки
        await applyTestsPoints(score);

        // Показываем финальное сообщение
        alert(`Тест завершён! Ваш результат: ${score}/${totalQuestions} (${percent}%) — Уровень: ${level}\n\nВы получили ${score} очков!`);

        // Перенаправляем на главную
        window.location.href = "/";
    } catch (err) {
        console.error("Ошибка при завершении теста:", err);
        alert("Произошла ошибка при отправке результата. Попробуйте снова.");
    }
}

function restartTest() {
    currentQuestion = 1;
    userAnswers = {};
    startTime = Date.now();

    const questionsContainer = document.getElementById('questionsContainer');
    const resultsSection = document.getElementById('resultsSection');
    const navigation = document.querySelector('.test-navigation');

    if (questionsContainer) questionsContainer.style.display = 'block';
    if (navigation) navigation.style.display = 'flex';
    if (resultsSection) resultsSection.style.display = 'none';

    // Сбрасываем все радио-кнопки
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // Сбрасываем таймер
    const timerText = document.getElementById('timerText');
    if (timerText) timerText.textContent = '0:00';

    initializeTest();
}

// Функция начисления очков
async function applyTestsPoints(points) {
    try {
        const sessionsResponse = await fetch('/api/sessions', { credentials: 'include' });
        if (!sessionsResponse.ok) return;

        const sessions = await sessionsResponse.json();
        const currentSession = sessions.find(s => s.username);
        if (!currentSession) return;

        await fetch(`/points/add?amount=${points}`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error('Ошибка при начислении очков:', err);
    }
}

// Добавим функцию для отладки - выведем все элементы с ID
function debugElements() {
    console.log("=== ОТЛАДКА ЭЛЕМЕНТОВ ===");

    const elementsToCheck = [
        'prevBtn', 'nextBtn', 'checkTestBtn',
        'questionsContainer', 'resultsSection', 'questionIndicators',
        'progressFill', 'currentQuestion', 'totalQuestions', 'timerText'
    ];

    elementsToCheck.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? "Найден" : "Не найден");
    });
}

// Вызовем отладку после загрузки
setTimeout(debugElements, 500);