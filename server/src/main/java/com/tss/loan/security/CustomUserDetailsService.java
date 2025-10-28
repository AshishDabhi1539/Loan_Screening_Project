package com.tss.loan.security;

import java.util.ArrayList;
import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.tss.loan.entity.user.User;
import com.tss.loan.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String emailOrPhone) throws UsernameNotFoundException {
        User user;

        // Try to find by email first
        user = userRepository.findByEmail(emailOrPhone)
                .orElse(null);
        
        // If not found by email, try by phone
        if (user == null) {
            user = userRepository.findByPhone(emailOrPhone)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email or phone: " + emailOrPhone));
        }

        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().toString()));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), 
                user.getPasswordHash(),
                user.getStatus().toString().equals("ACTIVE"), 
                true, 
                true, 
                true, 
                authorities);
    }
    
    /**
     * Load user by ID (for JWT authentication)
     */
    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));

        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().toString()));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), 
                user.getPasswordHash(),
                user.getStatus().toString().equals("ACTIVE"), 
                true, 
                true, 
                true, 
                authorities);
    }
}
