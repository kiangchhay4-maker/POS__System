package com.coffeeshop.customer.service;

import com.coffeeshop.auth.entity.User;
import com.coffeeshop.auth.repository.UserRepository;
import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.ResourceNotFoundException;
import com.coffeeshop.customer.dto.CustomerProfileResponse;
import com.coffeeshop.customer.dto.UpdateCustomerProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CustomerService {

    private final UserRepository userRepository;

    public CustomerService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CustomerProfileResponse getProfile(UUID userId) {
        User user = findUserById(userId);
        return new CustomerProfileResponse(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public CustomerProfileResponse updateProfile(UUID userId, UpdateCustomerProfileRequest request) {
        User user = findUserById(userId);
        user.updateProfile(request.name());
        User updated = userRepository.save(user);

        return new CustomerProfileResponse(
                updated.getId(),
                updated.getName(),
                updated.getPhone(),
                updated.getRole(),
                updated.getCreatedAt()
        );
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found with id: " + userId));
    }
}
