package com.coffeeshop.auth.service;

import com.coffeeshop.auth.dto.AuthResponse;
import com.coffeeshop.auth.dto.LoginRequest;
import com.coffeeshop.auth.dto.RefreshTokenRequest;
import com.coffeeshop.auth.dto.RegisterRequest;
import com.coffeeshop.auth.entity.User;
import com.coffeeshop.auth.repository.UserRepository;
import com.coffeeshop.common.exception.BusinessConflictException;
import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.UnauthorizedException;
import com.coffeeshop.common.security.JwtTokenProvider;
import com.coffeeshop.common.security.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.phone())) {
            throw new BusinessConflictException(
                    ErrorCode.AUTH_USER_ALREADY_EXISTS,
                    "Phone number [" + request.phone() + "] is already registered."
            );
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = User.create(request.name(), request.phone(), encodedPassword, Role.CUSTOMER);
        User savedUser = userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(savedUser.getId(), savedUser.getPhone(), savedUser.getRole());
        String refreshToken = tokenProvider.generateRefreshToken(savedUser.getId(), savedUser.getPhone(), savedUser.getRole());

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getPhone(),
                savedUser.getRole(),
                accessToken,
                refreshToken
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> new UnauthorizedException(
                        ErrorCode.AUTH_INVALID_CREDENTIALS,
                        "Invalid phone or password credentials."
                ));

        if (!user.isActive()) {
            throw new UnauthorizedException(
                    ErrorCode.AUTH_ACCESS_DENIED,
                    "Account is disabled. Please contact customer support."
            );
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Invalid phone or password credentials."
            );
        }

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getPhone(), user.getRole());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getPhone(), user.getRole());

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                accessToken,
                refreshToken
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (!tokenProvider.validateToken(request.refreshToken())) {
            throw new UnauthorizedException(
                    ErrorCode.AUTH_TOKEN_EXPIRED,
                    "Refresh token is expired or invalid. Please sign in again."
            );
        }

        UUID userId = tokenProvider.getUserIdFromToken(request.refreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException(
                        ErrorCode.USER_NOT_FOUND,
                        "User account associated with this token was not found."
                ));

        if (!user.isActive()) {
            throw new UnauthorizedException(
                    ErrorCode.AUTH_ACCESS_DENIED,
                    "Account is disabled."
            );
        }

        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getPhone(), user.getRole());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getPhone(), user.getRole());

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                newAccessToken,
                newRefreshToken
        );
    }

    @Transactional
    public com.coffeeshop.auth.dto.StaffResponse createStaff(com.coffeeshop.auth.dto.CreateStaffRequest request) {
        if (userRepository.existsByPhone(request.phone())) {
            throw new BusinessConflictException(
                    ErrorCode.AUTH_USER_ALREADY_EXISTS,
                    "Phone number [" + request.phone() + "] is already registered."
            );
        }

        Role targetRole = Role.STAFF;
        if (request.role() != null && "ADMIN".equalsIgnoreCase(request.role().trim())) {
            targetRole = Role.ADMIN;
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = User.create(request.name(), request.phone(), encodedPassword, targetRole);
        User savedUser = userRepository.save(user);

        return com.coffeeshop.auth.dto.StaffResponse.fromUser(savedUser);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.coffeeshop.auth.dto.StaffResponse> listStaff() {
        return userRepository.findAll().stream()
                .filter(u -> u.isActive() && (u.getRole() == Role.STAFF || u.getRole() == Role.ADMIN))
                .map(com.coffeeshop.auth.dto.StaffResponse::fromUser)
                .toList();
    }

    @Transactional
    public void deleteStaff(java.util.UUID id) {
        userRepository.findById(id).ifPresent(user -> {
            try {
                userRepository.delete(user);
                userRepository.flush();
            } catch (Exception e) {
                user.deactivate();
                userRepository.save(user);
            }
        });
    }
}
