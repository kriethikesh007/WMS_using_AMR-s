package com.warehouse.wms.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authenticationManager, userRepository, passwordEncoder, jwtUtils);
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("admin", "admin123");
        User user = new User("admin", "encodedPass", "ROLE_ADMIN", "Administrator");

        Authentication auth = new UsernamePasswordAuthenticationToken("admin", "admin123");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(jwtUtils.generateToken("admin", "ROLE_ADMIN", "Administrator")).thenReturn("mock-jwt-token");

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof JwtResponse);
        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertEquals("mock-jwt-token", jwtResponse.getToken());
        assertEquals("admin", jwtResponse.getUsername());
        assertEquals("ROLE_ADMIN", jwtResponse.getRole());
        assertEquals("Administrator", jwtResponse.getFullName());
    }

    @Test
    void testLoginFailureBadCredentials() {
        LoginRequest request = new LoginRequest("admin", "wrongpass");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Invalid username or password", body.get("message"));
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("newuser", "pass123", "New Operator", "ROLE_OPERATOR");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedNewPass");
        when(jwtUtils.generateToken("newuser", "ROLE_OPERATOR", "New Operator")).thenReturn("mock-new-jwt-token");

        ResponseEntity<?> response = authController.register(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody() instanceof JwtResponse);
        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertEquals("mock-new-jwt-token", jwtResponse.getToken());
        assertEquals("newuser", jwtResponse.getUsername());
        assertEquals("ROLE_OPERATOR", jwtResponse.getRole());
    }

    @Test
    void testRegisterDuplicateUsername() {
        RegisterRequest request = new RegisterRequest("admin", "pass123", "Administrator", "ROLE_ADMIN");

        when(userRepository.existsByUsername("admin")).thenReturn(true);

        ResponseEntity<?> response = authController.register(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Username is already taken", body.get("message"));
    }
}
