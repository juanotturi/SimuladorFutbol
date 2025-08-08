package com.project.simuladorfutbol.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.simuladorfutbol.dto.PlayerDTO;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final ObjectMapper mapper = new ObjectMapper();
    private List<PlayerDTO> allPlayers = List.of();
    private final Map<Long, List<PlayerDTO>> byTeam = new ConcurrentHashMap<>();

    private final Path playerJsonPath;

    public PlayerService(@Value("${data.base-path}") String basePath) {
        this.playerJsonPath = Path.of(basePath, "players.json");
    }

    // Comentario de prueba
    @PostConstruct
    public void load() {
        try {
            File file = playerJsonPath.toFile();
            System.out.println("Leyendo archivo de jugadores desde: " + file.getAbsolutePath());
            allPlayers = mapper.readValue(file, new TypeReference<>() {});
            System.out.println("Jugadores cargados: " + allPlayers.size());

            allPlayers.forEach(p -> {
                if (p.getGoalProbability() < 0) p.setGoalProbability(0);
            });

            Map<Long, List<PlayerDTO>> grouped = allPlayers.stream()
                    .collect(Collectors.groupingBy(PlayerDTO::getIdTeam));
            byTeam.clear();
            byTeam.putAll(grouped);

        } catch (Exception e) {
            System.out.println("Error al cargar jugadores:");
            e.printStackTrace();
            allPlayers = List.of();
            byTeam.clear();
        }
    }

    public List<PlayerDTO> findAll() {
        return allPlayers;
    }

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
        if (total <= 0) {
            int idx = (int) (Math.random() * filtered.size());
            return filtered.get(idx);
        }
        double r = Math.random() * total;
        for (PlayerDTO p : filtered) {
            r -= Math.max(0, p.getGoalProbability());
            if (r < 0) return p;
        }
        return filtered.get(filtered.size() - 1);
    }
}
