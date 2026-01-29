package com.ctf.controller;

import com.ctf.model.Challenge;
import com.ctf.service.ChallengeService;
import com.ctf.SessionRegistry;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequestMapping("/challenges/sqli")
public class SqlInjectionController {

    @Autowired
    private ChallengeService challengeService;

    @Autowired
    private SessionRegistry sessionRegistry;

    private static final String CHALLENGE_NAME = "SQL Injection Basic";
    private static final String EXPECTED_FLAG = "ctf{sql1nj3ct10n_b4s1c_2024}";
    private static final int MAX_ATTEMPTS = 3; // Изменено с 8 на 3

    // Временное хранилище для отслеживания попыток
    private final Map<String, Integer> userAttempts = new ConcurrentHashMap<>();
    private final Set<String> completedUsers = new HashSet<>();

    @GetMapping
    public String sqliChallengePage(Model model, HttpSession session) {
        String username = (String) session.getAttribute("username");

        if (username == null) {
            return "redirect:/auth";
        }

        // Проверяем, не завершено ли уже задание
        boolean isCompleted = completedUsers.contains(username);
        int attempts = userAttempts.getOrDefault(username, 0);
        boolean maxAttemptsReached = attempts >= MAX_ATTEMPTS && !isCompleted;

        if (isCompleted) {
            model.addAttribute("completed", true);
            model.addAttribute("message", "🎉 Вы уже успешно прошли это задание!");
            model.addAttribute("points", 5);
            return "challenges/sqli";
        }

        if (maxAttemptsReached) {
            model.addAttribute("maxAttemptsReached", true);
            model.addAttribute("attempts", attempts);
            model.addAttribute("maxAttempts", MAX_ATTEMPTS);
        }

        challengeService.getChallengeByTitle(CHALLENGE_NAME)
                .ifPresent(challenge -> {
                    model.addAttribute("challenge", challenge);
                    model.addAttribute("points", challenge.getPoints());
                });

        model.addAttribute("completed", false);
        model.addAttribute("attempts", attempts);
        model.addAttribute("maxAttempts", MAX_ATTEMPTS);
        return "challenges/sqli";
    }

    @GetMapping("/info")
    @ResponseBody
    public Map<String, Object> getChallengeInfo(HttpSession session) {
        String username = (String) session.getAttribute("username");
        Map<String, Object> response = new HashMap<>();

        if (username == null) {
            response.put("authenticated", false);
            return response;
        }

        boolean isCompleted = completedUsers.contains(username);
        int attempts = userAttempts.getOrDefault(username, 0);
        boolean maxAttemptsReached = attempts >= MAX_ATTEMPTS && !isCompleted;

        response.put("authenticated", true);
        response.put("completed", isCompleted);
        response.put("maxAttemptsReached", maxAttemptsReached);
        response.put("attempts", attempts);
        response.put("maxAttempts", MAX_ATTEMPTS);

        challengeService.getChallengeByTitle(CHALLENGE_NAME)
                .ifPresent(challenge -> {
                    response.put("title", challenge.getTitle());
                    response.put("points", challenge.getPoints());
                    response.put("difficulty", challenge.getDifficulty());
                });

        return response;
    }

    @PostMapping("/submit")
    @ResponseBody
    public Map<String, Object> submitSolution(@RequestParam String username,
                                              @RequestParam String password,
                                              HttpSession session) {

        String currentUser = (String) session.getAttribute("username");
        Map<String, Object> response = new HashMap<>();

        if (currentUser == null) {
            response.put("success", false);
            response.put("message", "Требуется авторизация");
            return response;
        }

        // Проверяем, не завершено ли уже задание
        if (completedUsers.contains(currentUser)) {
            response.put("success", false);
            response.put("message", "Вы уже завершили это задание");
            response.put("completed", true);
            return response;
        }

        // Получаем количество попыток
        int attempts = userAttempts.getOrDefault(currentUser, 0);

        // Проверяем количество попыток (теперь 3 вместо 8)
        if (attempts >= MAX_ATTEMPTS) {
            response.put("success", false);
            response.put("message", "❌ Превышено максимальное количество попыток (" + MAX_ATTEMPTS + ")");
            response.put("maxAttemptsReached", true);
            return response;
        }

        // Увеличиваем счетчик попыток
        userAttempts.put(currentUser, attempts + 1);

        // Логируем попытку
        System.out.println("SQL Injection attempt - User: " + currentUser +
                ", Attempt: " + (attempts + 1) + "/" + MAX_ATTEMPTS + ", " +
                "Username: " + username + ", Password: " + password);

        // Проверяем SQL инъекцию с помощью существующего метода
        boolean isSuccessful = challengeService.validateSqlInjection(username, password);

        if (isSuccessful) {
            // Помечаем задание как выполненное
            completedUsers.add(currentUser);

            response.put("success", true);
            response.put("message", "✅ SQL Injection успешен! Флаг: " + EXPECTED_FLAG);
            response.put("flag", EXPECTED_FLAG);
            response.put("points", 5);
            response.put("completed", true);

        } else {
            int remainingAttempts = MAX_ATTEMPTS - (attempts + 1);
            response.put("success", false);
            response.put("message", "❌ Неверные учетные данные. Осталось попыток: " + remainingAttempts);
            response.put("remainingAttempts", remainingAttempts);

            // Если попытки закончились
            if (remainingAttempts <= 0) {
                response.put("maxAttemptsReached", true);
            }
        }

        return response;
    }

    @GetMapping("/hint")
    @ResponseBody
    public Map<String, Object> getHint(HttpSession session) {
        String username = (String) session.getAttribute("username");
        Map<String, Object> response = new HashMap<>();

        if (username == null) {
            response.put("hint", "Требуется авторизация");
            return response;
        }

        // Проверяем, не исчерпаны ли попытки
        int attempts = userAttempts.getOrDefault(username, 0);
        boolean isCompleted = completedUsers.contains(username);

        if (attempts >= MAX_ATTEMPTS && !isCompleted) {
            response.put("hint", "❌ Вы исчерпали все попытки для этого задания.");
            return response;
        }

        String hint = challengeService.getChallengeByTitle(CHALLENGE_NAME)
                .map(Challenge::getHints)
                .orElse("Используйте SQL инъекцию для обхода аутентификации. Попробуйте ' OR '1'='1");

        response.put("hint", hint);
        return response;
    }

    @PostMapping("/reset")
    @ResponseBody
    public Map<String, Object> resetChallenge(HttpSession session) {
        String username = (String) session.getAttribute("username");
        Map<String, Object> response = new HashMap<>();

        if (username == null) {
            response.put("success", false);
            response.put("message", "Требуется авторизация");
            return response;
        }

        // Сбрасываем прогресс для этого пользователя
        userAttempts.remove(username);
        completedUsers.remove(username);

        response.put("success", true);
        response.put("message", "Прогресс сброшен. Вы можете попробовать снова.");
        return response;
    }

    @GetMapping("/status")
    @ResponseBody
    public Map<String, Object> getChallengeStatus(HttpSession session) {
        String username = (String) session.getAttribute("username");
        Map<String, Object> response = new HashMap<>();

        if (username == null) {
            response.put("authenticated", false);
            return response;
        }

        boolean isCompleted = completedUsers.contains(username);
        int attempts = userAttempts.getOrDefault(username, 0);
        boolean maxAttemptsReached = attempts >= MAX_ATTEMPTS && !isCompleted;

        response.put("authenticated", true);
        response.put("completed", isCompleted);
        response.put("maxAttemptsReached", maxAttemptsReached);
        response.put("attempts", attempts);
        response.put("maxAttempts", MAX_ATTEMPTS);
        response.put("remainingAttempts", Math.max(0, MAX_ATTEMPTS - attempts));

        return response;
    }
}