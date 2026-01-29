package com.ctf.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String requestURI = request.getRequestURI();

        // Разрешаем доступ к публичным страницам без проверки
        if (requestURI.equals("/") ||
                requestURI.equals("/auth") ||
                requestURI.equals("/login") ||
                requestURI.startsWith("/css/") ||
                requestURI.startsWith("/js/") ||
                requestURI.startsWith("/images/") ||
                requestURI.equals("/error") ||
                requestURI.equals("/debug") ||
                requestURI.equals("/check-username") ||
                requestURI.equals("/check-email") ||
                requestURI.equals("/top3")) {
            return true;
        }

        HttpSession session = request.getSession(false);

        // Проверяем, есть ли активная сессия
        if (session == null ||
                session.getAttribute("username") == null ||
                session.getAttribute("isAuthenticated") == null) {

            // Если нет сессии - редирект на авторизацию
            response.sendRedirect("/auth");
            return false;
        }

        Boolean isAuthenticated = (Boolean) session.getAttribute("isAuthenticated");
        if (!isAuthenticated) {
            response.sendRedirect("/auth");
            return false;
        }

        return true;
    }
}