package com.ctf.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_progress")
public class ChallengeProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String challengeName;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(nullable = false)
    private int attempts = 0;

    private String methodsUsed;

    @Column(nullable = false)
    private LocalDateTime lastAttempt = LocalDateTime.now();

    private LocalDateTime completedAt;

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getChallengeName() { return challengeName; }
    public void setChallengeName(String challengeName) { this.challengeName = challengeName; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) {
        this.completed = completed;
        if (completed) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public String getMethodsUsed() { return methodsUsed; }
    public void setMethodsUsed(String methodsUsed) { this.methodsUsed = methodsUsed; }

    public LocalDateTime getLastAttempt() { return lastAttempt; }
    public void setLastAttempt(LocalDateTime lastAttempt) { this.lastAttempt = lastAttempt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}