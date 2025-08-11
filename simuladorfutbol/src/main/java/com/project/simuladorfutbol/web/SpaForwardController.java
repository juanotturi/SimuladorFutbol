package com.project.simuladorfutbol.web;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.boot.web.servlet.error.ErrorController;

@Controller
public class SpaForwardController implements ErrorController {

    @GetMapping({"/", "/index", "/index.html"})
    public String forwardIndex() {
        return "forward:/browser/index.html";
    }

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String uri = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        if ("404".equals(String.valueOf(status))) {
            if (uri != null &&
                    !uri.startsWith("/teams") &&
                    !uri.startsWith("/players") &&
                    !uri.startsWith("/browser") &&
                    !uri.startsWith("/assets") &&
                    !uri.contains(".")) {
                return "forward:/browser/index.html";
            }
        }
        return null;
    }
}
