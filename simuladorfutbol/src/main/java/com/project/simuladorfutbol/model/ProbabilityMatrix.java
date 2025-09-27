package com.project.simuladorfutbol.model;

import java.util.Map;

public class ProbabilityMatrix {

    private final Map<Integer, Map<Integer, Integer>> matrix;

    public ProbabilityMatrix(Map<Integer, Map<Integer, Integer>> matrix) {
        this.matrix = matrix;
    }

    /**
     * Devuelve el valor del vector para un enfrentamiento dado.
     *
     * @param scoreA Puntaje del equipo A
     * @param scoreB Puntaje del equipo B
     * @return índice del vector (-17 a +17)
     */
    public int getVectorValue(int scoreA, int scoreB) {
        if (Math.abs(scoreA - scoreB) == 1) {
            return 0;
        }

        int bucketA = bucketize(scoreA);
        int bucketB = bucketize(scoreB);

        Map<Integer, Integer> row = matrix.get(bucketA);
        if (row == null) {
            return 0;
        }
        return row.getOrDefault(bucketB, 0);
    }

    private int bucketize(int score) {
        if (score >= 84) return 100;
        if (score >= 82) return 83;
        if (score >= 80) return 81;
        if (score >= 78) return 79;
        if (score >= 76) return 77;
        if (score >= 74) return 75;
        if (score >= 72) return 73;
        if (score >= 70) return 71;
        if (score >= 67) return 69;
        if (score >= 64) return 66;
        if (score >= 61) return 63;
        if (score >= 58) return 60;
        if (score >= 55) return 57;
        if (score >= 51) return 54;
        if (score >= 47) return 50;
        if (score >= 43) return 46;
        if (score >= 39) return 42;
        return 38;
    }
}
