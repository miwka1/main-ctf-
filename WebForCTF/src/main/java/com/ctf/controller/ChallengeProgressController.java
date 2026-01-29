package com.ctf.controller;

import com.ctf.SessionRegistry;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/challenges")
public class ChallengeProgressController {

    @Autowired
    private SessionRegistry sessionRegistry;

    private static final Logger logger = LoggerFactory.getLogger(ChallengeProgressController.class);

    // Временное хранилище прогресса
    private final Map<String, Map<String, Object>> challengeProgress = new HashMap<>();

    @GetMapping("/status/{challengeName}")
    public ResponseEntity<?> getChallengeStatus(@PathVariable String challengeName,
                                                HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        }

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.get(userKey);

        boolean completed = false;
        int attempts = 0;
        int maxAttempts = getMaxAttemptsForChallenge(challengeName);
        boolean maxAttemptsReached = false;

        if (userProgress != null) {
            Object data = userProgress.get(challengeName);
            if (data instanceof Map) {
                Map<String, Object> challengeData = (Map<String, Object>) data;
                completed = Boolean.TRUE.equals(challengeData.get("completed"));

                Object attemptsObj = challengeData.get("attempts");
                if (attemptsObj instanceof Integer) {
                    attempts = (Integer) attemptsObj;
                } else if (attemptsObj instanceof String) {
                    try {
                        attempts = Integer.parseInt((String) attemptsObj);
                    } catch (NumberFormatException e) {
                        attempts = 0;
                    }
                }

                // Проверяем явный флаг maxAttemptsReached
                Object maxAttemptsReachedObj = challengeData.get("maxAttemptsReached");
                if (maxAttemptsReachedObj instanceof Boolean) {
                    maxAttemptsReached = (Boolean) maxAttemptsReachedObj;
                } else {
                    // Автоматически определяем по количеству попыток
                    maxAttemptsReached = attempts >= maxAttempts && !completed;
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);
        response.put("challengeName", challengeName);
        response.put("completed", completed);
        response.put("attempts", attempts);
        response.put("maxAttempts", maxAttempts);
        response.put("maxAttemptsReached", maxAttemptsReached);
        response.put("username", username);

        logger.debug("Status for {}: attempts={}, maxAttempts={}, maxAttemptsReached={}",
                challengeName, attempts, maxAttempts, maxAttemptsReached);

        return ResponseEntity.ok(response);
    }

    private int getMaxAttemptsForChallenge(String challengeName) {
        switch (challengeName) {
            case "XSS Challenge":
                return 5;
            case "SQL Injection Basic":
                return 3;
            case "Authentication Bypass":
                return 5;
            case "CSRF Challenge":
                return 3;
            case "Path Traversal":
                return 3;
            default:
                return 3;
        }
    }

    @PostMapping("/complete")
    public ResponseEntity<?> completeChallenge(@RequestBody Map<String, Object> request,
                                               HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String challengeName = (String) request.get("challengeName");
        Integer attempts = (Integer) request.get("attempts");

        // Валидация
        if (challengeName == null || challengeName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Challenge name is required"));
        }

        if (attempts != null && attempts < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Attempts cannot be negative"));
        }

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.computeIfAbsent(userKey, k -> new HashMap<>());

        // Проверяем, не завершен ли уже этот челлендж
        Object existingData = userProgress.get(challengeName);
        Map<String, Object> existingChallenge = null;
        if (existingData instanceof Map) {
            existingChallenge = (Map<String, Object>) existingData;
        }

        if (existingChallenge != null && Boolean.TRUE.equals(existingChallenge.get("completed"))) {
            logger.warn("User {} tried to complete already completed challenge: {}", username, challengeName);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Challenge already completed",
                    "completedAt", existingChallenge.get("completedAt")
            ));
        }

        Map<String, Object> challengeData = new HashMap<>();
        challengeData.put("challengeName", challengeName);
        challengeData.put("completed", true);
        challengeData.put("attempts", attempts != null ? attempts : 1);
        challengeData.put("completedAt", new Date().toString());
        challengeData.put("maxAttemptsReached", false); // При успешном завершении сбрасываем флаг

        // Сохраняем специфические данные для разных типов челленджей
        switch (challengeName) {
            case "Authentication Bypass":
                List<String> methodsUsed = safeGetList(request, "methodsUsed");
                challengeData.put("methodsUsed", methodsUsed);
                challengeData.put("requiredMethods", 2);
                challengeData.put("foundMethods", methodsUsed.size());
                break;

            case "XSS Challenge":
                List<String> payloadsUsed = safeGetList(request, "payloadsUsed");
                List<String> successfulPayloads = safeGetList(request, "successfulPayloads");
                challengeData.put("payloadsUsed", payloadsUsed);
                challengeData.put("successfulPayloads", successfulPayloads);
                challengeData.put("requiredPayloads", 4);
                challengeData.put("foundPayloads", payloadsUsed.size());
                break;

            case "SQL Injection Basic":
                String injectionType = (String) request.get("injectionType");
                List<String> exploitedTables = safeGetList(request, "exploitedTables");
                challengeData.put("injectionType", injectionType != null ? injectionType : "unknown");
                challengeData.put("exploitedTables", exploitedTables);
                break;

            case "CSRF Challenge":
                List<String> csrfMethods = safeGetList(request, "csrfMethods");
                Integer successfulTransfers = (Integer) request.get("successfulTransfers");
                Boolean tokenBypassed = (Boolean) request.get("tokenBypassed");

                challengeData.put("csrfMethods", csrfMethods);
                challengeData.put("successfulTransfers", successfulTransfers != null ? successfulTransfers : 0);
                challengeData.put("tokenBypassed", tokenBypassed != null ? tokenBypassed : false);
                challengeData.put("requiredMethods", 3);
                challengeData.put("requiredTransfers", 2);
                challengeData.put("foundMethods", csrfMethods.size());
                break;

            case "Path Traversal":
                List<String> accessedFiles = safeGetList(request, "accessedFiles");
                Boolean rootAccessed = (Boolean) request.get("rootAccessed");
                challengeData.put("accessedFiles", accessedFiles);
                challengeData.put("rootAccessed", rootAccessed != null ? rootAccessed : false);
                break;

            default:
                // Общие данные для других челленджей
                challengeData.put("data", request);
        }

        userProgress.put(challengeName, challengeData);
        challengeProgress.put(userKey, userProgress);

        // Логирование завершения
        logger.info("Challenge completed: {} - {}", username, challengeName);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Challenge marked as completed",
                "challenge", challengeName,
                "attempts", attempts,
                "completedAt", challengeData.get("completedAt")
        ));
    }

    @GetMapping("/progress")
    public ResponseEntity<List<Map<String, Object>>> getUserProgress(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build();
        }

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.getOrDefault(userKey, new HashMap<>());

        List<Map<String, Object>> result = new ArrayList<>();

        // Все веб-челленджи
        String[] challenges = {
                "Authentication Bypass",
                "SQL Injection Basic",
                "XSS Challenge",
                "CSRF Challenge",
                "Path Traversal"
        };

        for (String challenge : challenges) {
            Object data = userProgress.get(challenge);
            Map<String, Object> challengeData;

            if (data instanceof Map) {
                challengeData = (Map<String, Object>) data;
            } else {
                challengeData = new HashMap<>();
                challengeData.put("challengeName", challenge);
                challengeData.put("completed", false);
                challengeData.put("attempts", 0);
                challengeData.put("maxAttemptsReached", false);

                // Добавляем специфичные поля по умолчанию
                switch (challenge) {
                    case "Authentication Bypass":
                        challengeData.put("methodsUsed", new ArrayList<>());
                        challengeData.put("requiredMethods", 2);
                        challengeData.put("foundMethods", 0);
                        challengeData.put("maxAttempts", 5);
                        break;
                    case "XSS Challenge":
                        challengeData.put("payloadsUsed", new ArrayList<>());
                        challengeData.put("successfulPayloads", new ArrayList<>());
                        challengeData.put("requiredPayloads", 4);
                        challengeData.put("foundPayloads", 0);
                        challengeData.put("maxAttempts", 5);
                        break;
                    case "SQL Injection Basic":
                        challengeData.put("injectionType", "none");
                        challengeData.put("exploitedTables", new ArrayList<>());
                        challengeData.put("maxAttempts", 3);
                        break;
                    case "CSRF Challenge":
                        challengeData.put("csrfMethods", new ArrayList<>());
                        challengeData.put("successfulTransfers", 0);
                        challengeData.put("tokenBypassed", false);
                        challengeData.put("requiredMethods", 3);
                        challengeData.put("requiredTransfers", 2);
                        challengeData.put("foundMethods", 0);
                        challengeData.put("maxAttempts", 3);
                        break;
                    case "Path Traversal":
                        challengeData.put("accessedFiles", new ArrayList<>());
                        challengeData.put("rootAccessed", false);
                        challengeData.put("maxAttempts", 3);
                        break;
                }
            }

            // Добавляем информацию о maxAttemptsReached если её нет
            if (!challengeData.containsKey("maxAttemptsReached")) {
                int attempts = (int) challengeData.getOrDefault("attempts", 0);
                boolean completed = (boolean) challengeData.getOrDefault("completed", false);
                int maxAttempts = getMaxAttemptsForChallenge(challenge);
                challengeData.put("maxAttemptsReached", attempts >= maxAttempts && !completed);
            }

            result.add(challengeData);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/save-progress")
    public ResponseEntity<?> saveProgress(@RequestBody Map<String, Object> request,
                                          HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String challengeName = (String) request.get("challengeName");
        if (challengeName == null || challengeName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Challenge name is required"));
        }

        Integer attempts = (Integer) request.get("attempts");
        Boolean completed = (Boolean) request.get("completed");
        Boolean maxAttemptsReached = (Boolean) request.get("maxAttemptsReached");

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.computeIfAbsent(userKey, k -> new HashMap<>());

        Object data = userProgress.get(challengeName);
        Map<String, Object> challengeData;
        if (data instanceof Map) {
            challengeData = (Map<String, Object>) data;
        } else {
            challengeData = new HashMap<>();
        }

        // Обновляем общие данные
        if (attempts != null) {
            challengeData.put("attempts", attempts);
        }

        if (completed != null) {
            challengeData.put("completed", completed);
            if (completed) {
                challengeData.put("completedAt", new Date().toString());
                // При успешном завершении сбрасываем флаг исчерпания попыток
                challengeData.put("maxAttemptsReached", false);
            }
        }

        // Сохраняем флаг исчерпания попыток
        if (maxAttemptsReached != null) {
            challengeData.put("maxAttemptsReached", maxAttemptsReached);
            if (maxAttemptsReached) {
                challengeData.put("maxAttemptsReachedAt", new Date().toString());
                logger.info("Max attempts reached for user {} - challenge {}", username, challengeName);
            }
        }

        challengeData.put("lastAttempt", new Date().toString());
        challengeData.put("challengeName", challengeName);

        // Сохраняем специфические данные
        switch (challengeName) {
            case "Authentication Bypass":
                List<String> methodsUsed = safeGetList(request, "methodsUsed");
                if (!methodsUsed.isEmpty()) {
                    challengeData.put("methodsUsed", methodsUsed);
                    challengeData.put("foundMethods", methodsUsed.size());
                }
                break;

            case "XSS Challenge":
                List<String> payloadsUsed = safeGetList(request, "payloadsUsed");
                List<String> successfulPayloads = safeGetList(request, "successfulPayloads");
                if (!payloadsUsed.isEmpty()) {
                    challengeData.put("payloadsUsed", payloadsUsed);
                    challengeData.put("foundPayloads", payloadsUsed.size());
                }
                if (!successfulPayloads.isEmpty()) {
                    challengeData.put("successfulPayloads", successfulPayloads);
                }
                break;

            case "SQL Injection Basic":
                List<String> exploitedTables = safeGetList(request, "exploitedTables");
                if (!exploitedTables.isEmpty()) {
                    challengeData.put("exploitedTables", exploitedTables);
                }
                break;

            case "CSRF Challenge":
                List<String> csrfMethods = safeGetList(request, "csrfMethods");
                Integer successfulTransfers = (Integer) request.get("successfulTransfers");
                Boolean tokenBypassed = (Boolean) request.get("tokenBypassed");

                if (!csrfMethods.isEmpty()) {
                    challengeData.put("csrfMethods", csrfMethods);
                    challengeData.put("foundMethods", csrfMethods.size());
                }
                if (successfulTransfers != null) {
                    challengeData.put("successfulTransfers", successfulTransfers);
                }
                if (tokenBypassed != null) {
                    challengeData.put("tokenBypassed", tokenBypassed);
                }
                break;

            case "Path Traversal":
                List<String> accessedFiles = safeGetList(request, "accessedFiles");
                Boolean rootAccessed = (Boolean) request.get("rootAccessed");
                if (!accessedFiles.isEmpty()) {
                    challengeData.put("accessedFiles", accessedFiles);
                }
                if (rootAccessed != null) {
                    challengeData.put("rootAccessed", rootAccessed);
                }
                break;
        }

        userProgress.put(challengeName, challengeData);
        challengeProgress.put(userKey, userProgress);

        logger.debug("Progress saved for user {} - challenge {}: attempts={}, maxAttemptsReached={}",
                username, challengeName, attempts, maxAttemptsReached);

        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/completed/{challengeName}")
    public ResponseEntity<?> checkCompleted(@PathVariable String challengeName,
                                            HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build();
        }

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.get(userKey);

        boolean completed = false;
        Map<String, Object> challengeData = null;

        if (userProgress != null) {
            Object data = userProgress.get(challengeName);
            if (data instanceof Map) {
                challengeData = (Map<String, Object>) data;
                completed = Boolean.TRUE.equals(challengeData.get("completed"));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("completed", completed);
        if (challengeData != null) {
            response.put("data", challengeData);
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/reset/{challengeName}")
    public ResponseEntity<?> resetChallenge(@PathVariable String challengeName,
                                            HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build();
        }

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.get(userKey);

        if (userProgress != null) {
            userProgress.remove(challengeName);
            challengeProgress.put(userKey, userProgress);
            logger.info("Challenge {} reset for user {}", challengeName, username);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Challenge progress reset",
                "challenge", challengeName
        ));
    }

    @DeleteMapping("/reset-all")
    public ResponseEntity<?> resetAllChallenges(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build();
        }

        String userKey = username.toLowerCase();
        challengeProgress.remove(userKey);
        logger.info("All challenges reset for user {}", username);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All challenge progress reset",
                "username", username
        ));
    }

    @GetMapping("/stats/{username}")
    public ResponseEntity<?> getUserStats(@PathVariable String username,
                                          HttpSession session) {
        // Проверяем права доступа
        String currentUser = (String) session.getAttribute("username");
        if (currentUser == null || (!currentUser.equals(username) && !"Karlapingus".equalsIgnoreCase(currentUser))) {
            return ResponseEntity.status(403).build();
        }

        String userKey = username.toLowerCase();
        Map<String, Object> userProgress = challengeProgress.get(userKey);

        if (userProgress == null) {
            return ResponseEntity.ok(Map.of(
                    "username", username,
                    "totalChallenges", 5,
                    "completed", 0,
                    "totalPoints", 0,
                    "challenges", new ArrayList<>()
            ));
        }

        int completed = 0;
        int totalPoints = 0;
        List<Map<String, Object>> challengesList = new ArrayList<>();

        // Подсчитываем статистику
        for (Map.Entry<String, Object> entry : userProgress.entrySet()) {
            Object data = entry.getValue();
            if (data instanceof Map) {
                Map<String, Object> challenge = (Map<String, Object>) data;
                boolean isCompleted = Boolean.TRUE.equals(challenge.get("completed"));

                if (isCompleted) {
                    completed++;
                    // Добавляем очки в зависимости от челленджа
                    switch (entry.getKey()) {
                        case "Authentication Bypass":
                            totalPoints += 3;
                            break;
                        case "SQL Injection Basic":
                            totalPoints += 5;
                            break;
                        case "XSS Challenge":
                            totalPoints += 10;
                            break;
                        case "CSRF Challenge":
                            totalPoints += 10;
                            break;
                        case "Path Traversal":
                            totalPoints += 8;
                            break;
                        default:
                            totalPoints += 5;
                    }
                }

                challengesList.add(challenge);
            }
        }

        return ResponseEntity.ok(Map.of(
                "username", username,
                "totalChallenges", 5,
                "completed", completed,
                "totalPoints", totalPoints,
                "challenges", challengesList
        ));
    }

    // Вспомогательный метод для безопасного получения списка
    private List<String> safeGetList(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value instanceof List) {
            try {
                return (List<String>) value;
            } catch (ClassCastException e) {
                logger.warn("Failed to cast {} to List<String>", key);
            }
        }
        return new ArrayList<>();
    }
}