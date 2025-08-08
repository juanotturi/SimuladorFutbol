package com.project.simuladorfutbol.controller;

import com.project.simuladorfutbol.dto.ExactResultDTO;
import com.project.simuladorfutbol.service.MatchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MatchController {

    private final MatchService probabilityService;

    public MatchController(MatchService probabilityService) {
        this.probabilityService = probabilityService;
    }

    /**
     * Ejemplo de uso: /playMatch?scoreA=84&scoreB=63
     * Devuelve el JSON:
     * {
     *   "goalsTeamA": 2,
     *   "goalsTeamB": 1
     * }
     */
    @GetMapping("/playMatch")
    public ExactResultDTO playMatch(@RequestParam int scoreA, @RequestParam int scoreB) {
        return probabilityService.playMatch(scoreA, scoreB);
    }
}
