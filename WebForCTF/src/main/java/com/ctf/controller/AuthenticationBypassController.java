package com.ctf.controller;

import com.ctf.model.Challenge;
import com.ctf.service.ChallengeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/challenges/auth-bypass")
public class AuthenticationBypassController {

    @Autowired
    private ChallengeService challengeService;

    @GetMapping
    public String authBypassChallengePage(Model model) {
        challengeService.getChallengeByTitle("Authentication Bypass")
                .ifPresent(challenge -> {
                    model.addAttribute("challenge", challenge);
                    model.addAttribute("points", challenge.getPoints());
                });
        return "challenges/auth-bypass";
    }

    @GetMapping("/info")
    @ResponseBody
    public String getChallengeInfo() {
        return challengeService.getChallengeByTitle("Authentication Bypass")
                .map(challenge -> String.format(
                        "{\"title\": \"%s\", \"points\": %d, \"difficulty\": \"%s\"}",
                        challenge.getTitle(),
                        challenge.getPoints(),
                        challenge.getDifficulty()
                ))
                .orElse("{\"title\": \"Authentication Bypass\", \"points\": 3, \"difficulty\": \"easy\"}");
    }

    @GetMapping("/hint")
    @ResponseBody
    public String getHint() {
        return challengeService.getChallengeByTitle("Authentication Bypass")
                .map(challenge -> "{\"hint\": \"" + challenge.getHints() + "\"}")
                .orElse("{\"hint\": \"Используйте несколько методов обхода одновременно. Попробуйте установить куки и параметры URL.\"}");
    }
}