package com.project.simuladorfutbol.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDTO {
    private long id;
    private long idTeam;
    private String name;
    private int goalProbability;
    private String position;
    private int penaltyOrder;

    @JsonProperty("isPenaltyShooter")
    private boolean isPenaltyShooter;

    @JsonIgnore
    public boolean isPenaltyShooter() {
        return isPenaltyShooter;
    }
}
