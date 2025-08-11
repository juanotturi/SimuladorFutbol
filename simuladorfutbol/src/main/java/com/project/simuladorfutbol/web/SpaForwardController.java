package com.project.simuladorfutbol.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {"/", "/index", "/index.html"})
    public String forwardIndex() {
        return "forward:/browser/index.html";
    }

    @GetMapping(value = {"/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
    public String forwardSpa() {
        return "forward:/browser/index.html";
    }
}
