package com.ctf.repository;

import com.ctf.model.ChallengeProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChallengeProgressRepository extends JpaRepository<ChallengeProgress, Long> {
    Optional<ChallengeProgress> findByUsernameAndChallengeName(String username, String challengeName);
    List<ChallengeProgress> findByUsername(String username);
    void deleteByUsernameAndChallengeName(String username, String challengeName);
    List<ChallengeProgress> findByUsernameAndCompleted(String username, boolean completed);
}