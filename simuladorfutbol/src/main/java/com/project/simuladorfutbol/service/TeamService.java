package com.project.simuladorfutbol.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.simuladorfutbol.dto.TeamDTO;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {

    private final List<TeamDTO> teams = new ArrayList<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final Path teamJsonPath;

    public TeamService(@Value("${data.base-path}") String basePath) {
        this.teamJsonPath = Path.of(basePath, "teams.json");
    }

    @PostConstruct
    public void loadTeams() {
        try {
            File file = teamJsonPath.toFile();
            if (!file.exists()) {
                return;
            }

            List<TeamDTO> loaded = mapper.readValue(file, new TypeReference<>() {});
            System.out.println("📊 Equipos cargados: " + loaded.size());

            teams.clear();
            teams.addAll(loaded);
        } catch (Exception e) {
            System.err.println("❌ Error cargando teams.json: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<TeamDTO> getAllTeams() {
        if (teams.isEmpty()) {
            loadTeams();
        }
        return teams;
    }

    public TeamDTO getTeamById(long id) {
        return teams.stream()
                .filter(t -> t.getId() == id)
                .findFirst()
                .orElse(null);
    }
}
