package com.coffeeshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Production-grade Monolithic Coffee Shop Backend Application.
 * Java 21 + Spring Boot 3.3 + PostgreSQL
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class CoffeeShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoffeeShopApplication.class, args);
    }
}
