package com.project.simuladorfutbol.mapper;

import com.project.simuladorfutbol.dto.ExactResultDTO;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ResultMatrixMapper {

    private final Map<Integer, ExactResultDTO> codeToResult;

    public ResultMatrixMapper() {
        codeToResult = new HashMap<>();
        initializeMap();
    }

    private void initializeMap() {
        codeToResult.put(100, new ExactResultDTO(10, 0));
        codeToResult.put(91, new ExactResultDTO(10, 1));
        codeToResult.put(90, new ExactResultDTO(9, 0));
        codeToResult.put(81, new ExactResultDTO(9, 1));
        codeToResult.put(80, new ExactResultDTO(8, 0));
        codeToResult.put(71, new ExactResultDTO(8, 1));
        codeToResult.put(70, new ExactResultDTO(7, 0));
        codeToResult.put(61, new ExactResultDTO(7, 1));
        codeToResult.put(60, new ExactResultDTO(6, 0));
        codeToResult.put(51, new ExactResultDTO(6, 1));
        codeToResult.put(50, new ExactResultDTO(5, 0));
        codeToResult.put(41, new ExactResultDTO(5, 1));
        codeToResult.put(40, new ExactResultDTO(4, 0));
        codeToResult.put(32, new ExactResultDTO(5, 2));
        codeToResult.put(31, new ExactResultDTO(4, 1));
        codeToResult.put(30, new ExactResultDTO(3, 0));
        codeToResult.put(23, new ExactResultDTO(5, 3));
        codeToResult.put(22, new ExactResultDTO(4, 2));
        codeToResult.put(21, new ExactResultDTO(3, 1));
        codeToResult.put(20, new ExactResultDTO(2, 0));
        codeToResult.put(14, new ExactResultDTO(5, 4));
        codeToResult.put(13, new ExactResultDTO(4, 3));
        codeToResult.put(12, new ExactResultDTO(3, 2));
        codeToResult.put(11, new ExactResultDTO(2, 1));
        codeToResult.put(10, new ExactResultDTO(1, 0));
        codeToResult.put(4, new ExactResultDTO(4, 4));
        codeToResult.put(3, new ExactResultDTO(3, 3));
        codeToResult.put(2, new ExactResultDTO(2, 2));
        codeToResult.put(1, new ExactResultDTO(1, 1));
        codeToResult.put(0, new ExactResultDTO(0, 0));
        codeToResult.put(-1, new ExactResultDTO(1, 1));
        codeToResult.put(-2, new ExactResultDTO(2, 2));
        codeToResult.put(-3, new ExactResultDTO(3, 3));
        codeToResult.put(-4, new ExactResultDTO(4, 4));
        codeToResult.put(-10, new ExactResultDTO(0, 1));
        codeToResult.put(-11, new ExactResultDTO(1, 2));
        codeToResult.put(-12, new ExactResultDTO(2, 3));
        codeToResult.put(-13, new ExactResultDTO(3, 4));
        codeToResult.put(-14, new ExactResultDTO(4, 5));
        codeToResult.put(-20, new ExactResultDTO(0, 2));
        codeToResult.put(-21, new ExactResultDTO(1, 3));
        codeToResult.put(-22, new ExactResultDTO(2, 4));
        codeToResult.put(-23, new ExactResultDTO(3, 5));
        codeToResult.put(-30, new ExactResultDTO(0, 3));
        codeToResult.put(-31, new ExactResultDTO(1, 4));
        codeToResult.put(-32, new ExactResultDTO(2, 5));
        codeToResult.put(-40, new ExactResultDTO(0, 4));
        codeToResult.put(-41, new ExactResultDTO(1, 5));
        codeToResult.put(-50, new ExactResultDTO(0, 5));
        codeToResult.put(-51, new ExactResultDTO(1, 6));
        codeToResult.put(-60, new ExactResultDTO(0, 6));
        codeToResult.put(-61, new ExactResultDTO(1, 7));
        codeToResult.put(-70, new ExactResultDTO(0, 7));
        codeToResult.put(-71, new ExactResultDTO(1, 8));
        codeToResult.put(-80, new ExactResultDTO(0, 8));
        codeToResult.put(-81, new ExactResultDTO(1, 9));
        codeToResult.put(-90, new ExactResultDTO(0, 9));
        codeToResult.put(-91, new ExactResultDTO(1, 10));
        codeToResult.put(-100, new ExactResultDTO(0, 10));
    }

    public ExactResultDTO getResult(int code) {
        return codeToResult.getOrDefault(code, new ExactResultDTO(0, 0));
    }
}
