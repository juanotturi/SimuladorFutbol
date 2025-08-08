package com.project.simuladorfutbol.config;

import com.project.simuladorfutbol.mapper.ProbabilityMatrixMapper;
import com.project.simuladorfutbol.model.ProbabilityMatrix;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    /**
     * Crea y expone el ProbabilityMatrix como un bean de Spring.
     * Este bean se construye una sola vez al iniciar la app.
     */
    @Bean
    public ProbabilityMatrix probabilityMatrix() {
        return ProbabilityMatrixMapper.createMatrix();
    }
}
