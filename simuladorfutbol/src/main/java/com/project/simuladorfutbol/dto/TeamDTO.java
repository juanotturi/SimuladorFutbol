package com.project.simuladorfutbol.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamDTO {
    private long id;
    private String name;
    private String code;
    private int score;
    private String confederation;
    private String league;
    private String image;
}
