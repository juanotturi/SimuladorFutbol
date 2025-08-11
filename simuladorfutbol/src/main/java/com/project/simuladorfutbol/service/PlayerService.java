package com.project.simuladorfutbol.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.simuladorfutbol.dto.PlayerDTO;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final ObjectMapper mapper = new ObjectMapper();
    private List<PlayerDTO> allPlayers = List.of();
    private final Map<Long, List<PlayerDTO>> byTeam = new ConcurrentHashMap<>();

    private final ResourceLoader resourceLoader;
    private final String playersLocation;

    public PlayerService(ResourceLoader resourceLoader,
                         @Value("${data.base-path}") String basePath) {
        this.resourceLoader = resourceLoader;
        String normalized = basePath.endsWith("/") ? basePath : basePath + "/";
        this.playersLocation = normalized + "players.json";
    }

    @PostConstruct
    public void load() {
        try {
            Resource resource = resourceLoader.getResource(playersLocation);
            try (InputStream is = resource.getInputStream()) {
                allPlayers = mapper.readValue(is, new TypeReference<>() {});
            }

            allPlayers.forEach(p -> {
                if (p.getGoalProbability() < 0) p.setGoalProbability(0);
            });

            Map<Long, List<PlayerDTO>> grouped = allPlayers.stream()
                    .collect(Collectors.groupingBy(PlayerDTO::getIdTeam));
            byTeam.clear();
            byTeam.putAll(grouped);

            System.out.println("✅ Jugadores cargados: " + allPlayers.size() +
                    " desde " + playersLocation);
        } catch (Exception e) {
            System.out.println("❌ Error al cargar jugadores desde " + playersLocation);
            e.printStackTrace();
            allPlayers = List.of();
            byTeam.clear();
        }
    }

    public List<PlayerDTO> findAll() { return allPlayers; }

    public List<PlayerDTO> findByTeam(long teamId) {
        return byTeam.getOrDefault(teamId, List.of());
    }

    public PlayerDTO pickRandomScorer(long teamId, boolean isPenaltyGoal) {
        List<PlayerDTO> players = byTeam.get(teamId);
        if (players == null || players.isEmpty()) return null;

        List<PlayerDTO> filtered = isPenaltyGoal
                ? players.stream().filter(PlayerDTO::isPenaltyShooter).toList()
                : players;

        if (filtered.isEmpty()) filtered = players;

        int total = filtered.stream().mapToInt(p -> Math.max(0, p.getGoalProbability())).sum();
        if (total <= 0) return filtered.get((int) (Math.random() * filtered.size()));

        double r = Math.random() * total;
        for (PlayerDTO p : filtered) {
            r -= Math.max(0, p.getGoalProbability());
            if (r < 0) return p;
        }
        return filtered.get(filtered.size() - 1);
    }
}
