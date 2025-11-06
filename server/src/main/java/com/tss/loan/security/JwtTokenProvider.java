package com.tss.loan.security;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.tss.loan.entity.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class JwtTokenProvider {
    
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    
    @Value("${app.jwt.expiration}")
    private int jwtExpirationInMs;
    
    @Value("${app.jwt.refresh-expiration}")
    private int refreshExpirationInMs;
    
    // Extended expiration for "Remember Me" (30 days)
    private static final int REMEMBER_ME_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    private static final int REMEMBER_ME_REFRESH_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    public String generateToken(User user) {
        return generateToken(user, false);
    }
    
    public String generateToken(User user, boolean rememberMe) {
        Date now = new Date();
        // Use extended expiration if Remember Me is enabled
        int expirationTime = rememberMe ? REMEMBER_ME_EXPIRATION_MS : jwtExpirationInMs;
        Date expiryDate = new Date(now.getTime() + expirationTime);
        
        return Jwts.builder()
                .claim("userId", user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().toString())
                .claim("status", user.getStatus().toString())
                .claim("emailVerified", user.getIsEmailVerified())
                .claim("phoneVerified", user.getIsPhoneVerified())
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSignInKey())
                .compact();
    }
    
    public String generateRefreshToken(User user) {
        return generateRefreshToken(user, false);
    }
    
    public String generateRefreshToken(User user, boolean rememberMe) {
        Date now = new Date();
        // Use extended expiration if Remember Me is enabled
        int expirationTime = rememberMe ? REMEMBER_ME_REFRESH_EXPIRATION_MS : refreshExpirationInMs;
        Date expiryDate = new Date(now.getTime() + expirationTime);
        
        return Jwts.builder()
                .claim("userId", user.getId().toString())
                .claim("tokenType", "refresh")
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSignInKey())
                .compact();
    }
    
    public String getUserEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.getSubject();
    }
    
    public UUID getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        String userIdStr = claims.get("userId", String.class);
        return UUID.fromString(userIdStr);
    }
    
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.get("role", String.class);
    }
    
    public LocalDateTime getExpirationDateFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        Date expiration = claims.getExpiration();
        return expiration.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
    
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }
    
    public boolean isTokenExpired(String token) {
        try {
            LocalDateTime expiration = getExpirationDateFromToken(token);
            return expiration.isBefore(LocalDateTime.now());
        } catch (Exception e) {
            return true;
        }
    }
    
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            String tokenType = claims.get("tokenType", String.class);
            return "refresh".equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }
    
    public boolean isLongLivedToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            Date expiration = claims.getExpiration();
            Date issuedAt = claims.getIssuedAt();
            
            // Calculate token lifetime in milliseconds
            long lifetime = expiration.getTime() - issuedAt.getTime();
            
            // Consider it long-lived if lifetime is more than 7 days
            return lifetime > (7 * 24 * 60 * 60 * 1000L);
        } catch (Exception e) {
            return false;
        }
    }
    
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
