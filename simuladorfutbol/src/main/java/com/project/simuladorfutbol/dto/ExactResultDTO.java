package com.project.simuladorfutbol.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExactResultDTO {
    private int goalsTeamA;
    private int goalsTeamB;
}
