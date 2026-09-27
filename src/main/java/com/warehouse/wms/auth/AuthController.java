package com.warehouse.wms.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername().trim(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByUsername(loginRequest.getUsername().trim())
                    .orElseThrow(() -> new RuntimeException("User not found after successful authentication"));

            String jwt = jwtUtils.generateToken(
                    user.getUsername(),
                    user.getRole(),
                    user.getFullName()
            );

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    user.getUsername(),
                    user.getRole(),
                    user.getFullName()
            ));
        } catch (BadCredentialsException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.UNAUTHORIZED.value());
            error.put("error", "Unauthorized");
            error.put("message", "Invalid username or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("error", "Authentication Error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        String username = registerRequest.getUsername().trim();

        if (userRepository.existsByUsername(username)) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "Bad Request");
            error.put("message", "Username is already taken");
            return ResponseEntity.badRequest().body(error);
        }

        String role = registerRequest.getRole();
        if (role == null || role.isBlank()) {
            role = "ROLE_OPERATOR";
        }
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        User user = new User(
                username,
                passwordEncoder.encode(registerRequest.getPassword()),
                role,
                registerRequest.getFullName() != null && !registerRequest.getFullName().isBlank()
                        ? registerRequest.getFullName().trim()
                        : username
        );

        userRepository.save(user);

        String jwt = jwtUtils.generateToken(user.getUsername(), user.getRole(), user.getFullName());

        return ResponseEntity.status(HttpStatus.CREATED).body(new JwtResponse(
                jwt,
                user.getUsername(),
                user.getRole(),
                user.getFullName()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> {
                    Map<String, Object> profile = new HashMap<>();
                    profile.put("username", user.getUsername());
                    profile.put("role", user.getRole());
                    profile.put("fullName", user.getFullName());
                    profile.put("createdAt", user.getCreatedAt());
                    return ResponseEntity.ok(profile);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
