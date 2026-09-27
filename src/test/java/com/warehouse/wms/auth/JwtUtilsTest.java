package com.warehouse.wms.auth;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;
    private final String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expirationMs = 86400000L;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", secretKey);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", expirationMs);
    }

    @Test
    void testGenerateAndValidateToken() {
        String token = jwtUtils.generateToken("admin", "ROLE_ADMIN", "Administrator");
        assertNotNull(token);
        assertTrue(jwtUtils.validateToken(token));
        assertEquals("admin", jwtUtils.getUsernameFromToken(token));

        Claims claims = jwtUtils.getClaimsFromToken(token);
        assertEquals("ROLE_ADMIN", claims.get("role", String.class));
        assertEquals("Administrator", claims.get("fullName", String.class));
    }

    @Test
    void testInvalidToken() {
        assertFalse(jwtUtils.validateToken("invalid.token.payload"));
    }

    @Test
    void testTokenWithDifferentUser() {
        String token = jwtUtils.generateToken("operator1", "ROLE_OPERATOR", "Fleet Operator");
        assertTrue(jwtUtils.validateToken(token));
        assertEquals("operator1", jwtUtils.getUsernameFromToken(token));

        Claims claims = jwtUtils.getClaimsFromToken(token);
        assertEquals("ROLE_OPERATOR", claims.get("role", String.class));
    }
}
