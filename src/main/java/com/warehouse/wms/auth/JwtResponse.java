package com.warehouse.wms.auth;

public class JwtResponse {

    private String token;
    private String type = "Bearer";
    private String username;
    private String role;
    private String fullName;

    public JwtResponse() {}

    public JwtResponse(String token, String username, String role, String fullName) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}
