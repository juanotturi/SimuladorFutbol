package com.project.simuladorfutbol.service;

import com.project.simuladorfutbol.dto.ExactResultDTO;
import com.project.simuladorfutbol.mapper.ResultMatrixMapper;
import com.project.simuladorfutbol.model.ResultMatrix;
import com.project.simuladorfutbol.model.ProbabilityMatrix;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class MatchService {

    private final ProbabilityMatrix matrix;
    private final ResultMatrix exactResultMatrix;
    private final ResultMatrixMapper exactResultCodeMapper;
    private final Random random = new Random();

    public MatchService(ProbabilityMatrix matrix, ResultMatrix exactResultMatrix, ResultMatrixMapper exactResultCodeMapper) {
        this.matrix = matrix;
        this.exactResultMatrix = exactResultMatrix;
        this.exactResultCodeMapper = exactResultCodeMapper;
    }

    public ExactResultDTO playMatch(int scoreA, int scoreB) {
        int vectorIndex = getVectorIndex(scoreA, scoreB);
        if (Math.abs(scoreA - scoreB) == 1) {
            vectorIndex = 0;
        }
        int rand = random.nextInt(100) + 1;
        int resultCode = exactResultMatrix.getResultCode(vectorIndex, rand);
        return exactResultCodeMapper.getResult(resultCode);
    }

    public int getVectorIndex(int scoreA, int scoreB) {
        return matrix.getVectorValue(scoreA, scoreB);
    }
}
