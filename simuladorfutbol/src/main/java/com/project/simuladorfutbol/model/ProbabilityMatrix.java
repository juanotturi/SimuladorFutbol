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
        if (score >= 79) return 83;
        if (score >= 77) return 78;
        if (score >= 75) return 76;
        if (score >= 73) return 74;
        if (score >= 71) return 72;
        if (score >= 68) return 70;
        if (score >= 65) return 67;
        if (score >= 62) return 64;
        if (score >= 59) return 61;
        if (score >= 56) return 58;
        if (score >= 53) return 55;
        if (score >= 50) return 52;
        if (score >= 47) return 49;
        if (score >= 44) return 46;
        if (score >= 41) return 43;
        if (score >= 38) return 40;
        return 37;
    }
}
