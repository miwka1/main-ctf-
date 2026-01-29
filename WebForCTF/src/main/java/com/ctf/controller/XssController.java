package com.ctf.controller;

import com.ctf.model.Challenge;
import com.ctf.service.ChallengeService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/challenges/xss")
public class XssController {

    @Autowired
    private ChallengeService challengeService;

    @GetMapping
    public String xssChallengePage(Model model) {
        challengeService.getChallengeByTitle("XSS Challenge")
                .ifPresent(challenge -> {
                    model.addAttribute("challenge", challenge);
                    model.addAttribute("points", challenge.getPoints());
                });
        return "challenges/xss";
    }

    @GetMapping("/info")
    @ResponseBody
    public String getChallengeInfo() {
        return challengeService.getChallengeByTitle("XSS Challenge")
                .map(challenge -> String.format(
                        "{\"title\": \"%s\", \"points\": %d, \"difficulty\": \"%s\"}",
                        challenge.getTitle(),
                        challenge.getPoints(),
                        challenge.getDifficulty()
                ))
                .orElse("{\"title\": \"XSS Challenge\", \"points\": 10, \"difficulty\": \"medium\"}");
    }

    @GetMapping("/hint")
    @ResponseBody
    public String getHint() {
        return challengeService.getChallengeByTitle("XSS Challenge")
                .map(challenge -> "{\"hint\": \"" + challenge.getHints() + "\"}")
                .orElse("{\"hint\": \"Попробуйте использовать разные типы XSS payload'ов: script теги, обработчики событий (onerror, onload), и JavaScript URLs. Нужно найти 4 разных типа для успешного прохождения.\"}");
    }

    @GetMapping("/status")
    @ResponseBody
    public ResponseEntity<?> getXSSStatus(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        }

        // Получаем прогресс из ChallengeProgressController через внутренний вызов
        // В реальном приложении лучше использовать сервис
        Map<String, Object> status = new HashMap<>();
        status.put("authenticated", true);
        status.put("challengeName", "XSS Challenge");

        // Значения по умолчанию
        status.put("completed", false);
        status.put("attempts", 0);
        status.put("maxAttempts", 5);
        status.put("maxAttemptsReached", false);

        // Попытка получить реальные данные из сессии или других источников
        Map<String, Object> sessionProgress = (Map<String, Object>) session.getAttribute("xssProgress");
        if (sessionProgress != null) {
            if (sessionProgress.containsKey("completed")) {
                status.put("completed", sessionProgress.get("completed"));
            }
            if (sessionProgress.containsKey("attempts")) {
                status.put("attempts", sessionProgress.get("attempts"));
            }
            if (sessionProgress.containsKey("maxAttemptsReached")) {
                status.put("maxAttemptsReached", sessionProgress.get("maxAttemptsReached"));
            }
        }

        // Проверяем, не исчерпаны ли попытки
        int attempts = (int) status.get("attempts");
        int maxAttempts = 5;
        boolean completed = (boolean) status.get("completed");
        boolean maxAttemptsReached = attempts >= maxAttempts && !completed;

        if (maxAttemptsReached) {
            status.put("maxAttemptsReached", true);
        }

        return ResponseEntity.ok(status);
    }
}