package com.project.simuladorfutbol.controller;

import com.project.simuladorfutbol.dto.TeamDTO;
import com.project.simuladorfutbol.service.TeamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    /**
     * GET /teams
     * Devuelve todos los equipos.
     */
    @GetMapping
    public List<TeamDTO> getAllTeams() {
        return teamService.getAllTeams();
    }

    /**
     * GET /teams/{id}
     * Devuelve un equipo por su id.
     */
    @GetMapping("/{id}")
    public TeamDTO getTeamById(@PathVariable long id) {
        return teamService.getTeamById(id);
    }
}
