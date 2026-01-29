package com.ctf.service;

import com.ctf.model.ChallengeProgress;
import com.ctf.repository.ChallengeProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChallengeProgressService {

    @Autowired
    private ChallengeProgressRepository progressRepository;

    public boolean isChallengeCompleted(String username, String challengeName) {
        return progressRepository.findByUsernameAndChallengeName(username, challengeName)
                .map(ChallengeProgress::isCompleted)
                .orElse(false);
    }

    public Optional<ChallengeProgress> getProgress(String username, String challengeName) {
        return progressRepository.findByUsernameAndChallengeName(username, challengeName);
    }

    public List<ChallengeProgress> getUserProgress(String username) {
        return progressRepository.findByUsername(username);
    }

    public void saveProgress(ChallengeProgress progress) {
        progressRepository.save(progress);
    }

    public void deleteProgress(String username, String challengeName) {
        progressRepository.deleteByUsernameAndChallengeName(username, challengeName);
    }
}