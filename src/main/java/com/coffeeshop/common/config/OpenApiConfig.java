package com.coffeeshop.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI coffeeShopOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Coffee Shop Backend API — Production Specification")
                        .description("""
                                Enterprise-grade monolithic Coffee Shop backend system powered by Spring Boot 3.3, Java 21, and PostgreSQL.
                                Features strong transactional consistency, transactional outbox pattern, optimistic locking,
                                idempotency enforcement, and resilience for external payment partial failures.
                                """)
                        .version("1.0.0")
                        .contact(new Contact().name("Backend Engineering Team").email("engineering@coffeeshop.local"))
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Provide your JWT Access Token in the format: Bearer <token>")));
    }
}
