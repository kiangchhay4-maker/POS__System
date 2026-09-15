package com.coffeeshop.auth.service;

import com.coffeeshop.auth.entity.User;
import com.coffeeshop.auth.repository.UserRepository;
import com.coffeeshop.common.security.UserPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + phone));

        return new UserPrincipal(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getPasswordHash(),
                user.getRole(),
                user.isActive()
        );
    }
}
