package com.tss.loan.security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    @Override
    public void commence(HttpServletRequest httpServletRequest,
                        HttpServletResponse httpServletResponse,
                        AuthenticationException e) throws IOException, ServletException {
        
        log.error("Responding with unauthorized error. Message - {}", e.getMessage());
        
        httpServletResponse.setContentType("application/json");
        httpServletResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        String jsonResponse = """
            {
                "timestamp": "%s",
                "status": 401,
                "error": "Unauthorized",
                "message": "Authentication required to access this resource",
                "path": "%s"
            }
            """.formatted(
                java.time.LocalDateTime.now().toString(),
                httpServletRequest.getRequestURI()
            );
        
        httpServletResponse.getWriter().write(jsonResponse);
    }
}
