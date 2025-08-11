package com.project.simuladorfutbol.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.simuladorfutbol.dto.TeamDTO;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {

    private final List<TeamDTO> teams = new ArrayList<>();
    private final ObjectMapper mapper = new ObjectMapper();

    private final ResourceLoader resourceLoader;
    private final String teamsLocation;

    public TeamService(ResourceLoader resourceLoader,
                       @Value("${data.base-path}") String basePath) {
        this.resourceLoader = resourceLoader;
        String normalized = basePath.endsWith("/") ? basePath : basePath + "/";
        this.teamsLocation = normalized + "teams.json";
    }

    @PostConstruct
    public void loadTeams() {
        try {
            Resource resource = resourceLoader.getResource(teamsLocation);
            if (!resource.exists()) {
                System.err.println("⚠️ No se encontró " + teamsLocation);
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                List<TeamDTO> loaded = mapper.readValue(is, new TypeReference<>() {});
                teams.clear();
                teams.addAll(loaded);
                System.out.println("✅ Equipos cargados: " + teams.size() +
                        " desde " + teamsLocation);
            }
        } catch (Exception e) {
            System.err.println("❌ Error cargando teams.json desde " + teamsLocation + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<TeamDTO> getAllTeams() {
        if (teams.isEmpty()) loadTeams();
        return teams;
    }

    public TeamDTO getTeamById(long id) {
        return teams.stream()
                .filter(t -> t.getId() == id)
                .findFirst()
                .orElse(null);
    }
}
