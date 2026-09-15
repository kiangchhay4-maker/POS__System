package com.coffeeshop.product;

import com.coffeeshop.product.dto.CreateProductRequest;
import com.coffeeshop.product.dto.ProductResponse;
import com.coffeeshop.product.dto.UpdateProductRequest;
import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.entity.ProductCategory;
import com.coffeeshop.product.event.ProductCreatedEvent;
import com.coffeeshop.product.repository.ProductRepository;
import com.coffeeshop.product.service.ProductService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ProductServiceTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private TestEventListener testEventListener;

    @TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        public TestEventListener testEventListener() {
            return new TestEventListener();
        }
    }

    static class TestEventListener {
        final List<ProductCreatedEvent> events = new ArrayList<>();

        @EventListener
        public void handle(ProductCreatedEvent event) {
            events.add(event);
        }
    }

    @Test
    @DisplayName("Should create product, persist with version 0, and publish ProductCreatedEvent")
    void testCreateProductPublishesEventAndSetsVersion() {
        CreateProductRequest request = new CreateProductRequest(
                "Ethiopian Yirgacheffe",
                "Floral, citrus notes with bright acidity",
                ProductCategory.COFFEE,
                new BigDecimal("18.50"),
                "USD",
                true,
                50
        );

        ProductResponse response = productService.createProduct(request);

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("Ethiopian Yirgacheffe");

        // Verify entity persisted in DB
        Product product = productRepository.findById(response.id()).orElseThrow();
        assertThat(product.getVersion()).isEqualTo(0L);
        assertThat(product.isDeleted()).isFalse();

        // Verify Domain Event published
        assertThat(testEventListener.events).hasSize(1);
        ProductCreatedEvent event = testEventListener.events.getFirst();
        assertThat(event.productId()).isEqualTo(response.id());
        assertThat(event.name()).isEqualTo("Ethiopian Yirgacheffe");
        assertThat(event.initialStock()).isEqualTo(50);
        testEventListener.events.clear();
    }

    @Test
    @DisplayName("Should update product via Hibernate Dirty Checking without explicit save()")
    void testUpdateProductDirtyChecking() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        UUID productId = txTemplate.execute(status -> {
            Product p = Product.create("Espresso Blend", "Bold and dark", ProductCategory.COFFEE, new BigDecimal("12.00"), "USD", true);
            return productRepository.save(p).getId();
        });

        UpdateProductRequest updateRequest = new UpdateProductRequest(
                "Espresso Blend Special Reserve",
                "Ultra dark roast with cocoa finish",
                ProductCategory.COFFEE,
                new BigDecimal("15.50"),
                true
        );

        // Call updateProduct which relies entirely on dirty checking (no repository.save() call)
        productService.updateProduct(productId, updateRequest);

        // Verify changes flushed and persisted
        Product updated = productRepository.findById(productId).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Espresso Blend Special Reserve");
        assertThat(updated.getPrice()).isEqualByComparingTo(new BigDecimal("15.50"));
        assertThat(updated.getVersion()).isGreaterThan(0L);
    }

    @Test
    @DisplayName("Should soft delete product and hide from normal queries via @SQLRestriction")
    void testSoftDeletePattern() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        UUID productId = txTemplate.execute(status -> {
            Product p = Product.create("Matcha Latte", "Organic green tea", ProductCategory.TEA, new BigDecimal("6.50"), "USD", true);
            return productRepository.save(p).getId();
        });

        // Execute soft delete
        productService.deleteProduct(productId);

        // Querying via JPA repository should return empty due to @SQLRestriction("deleted = false")
        Optional<Product> queriedProduct = productRepository.findById(productId);
        assertThat(queriedProduct).isEmpty();

        // Direct native query should verify master data is retained with deleted = true
        Object deletedStatus = txTemplate.execute(status ->
                entityManager.createNativeQuery("SELECT deleted FROM products WHERE id = :id")
                        .setParameter("id", productId)
                        .getSingleResult()
        );
        assertThat(deletedStatus).isEqualTo(true);
    }

    @Test
    @DisplayName("Should detect optimistic locking conflict when two transactions update concurrently")
    void testOptimisticLockingPreventsRaceCondition() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        TransactionTemplate requiresNewTx = new TransactionTemplate(transactionManager);
        requiresNewTx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        UUID productId = txTemplate.execute(status -> {
            Product p = Product.create("Nitro Cold Brew", "Smooth draft cold brew", ProductCategory.COLD_BREW, new BigDecimal("5.00"), "USD", true);
            return productRepository.save(p).getId();
        });

        // Simulate concurrent transactions:
        // Transaction A loads the entity at version 0
        // Transaction B (independent tx) updates and commits (incrementing version to 1 in DB)
        // Transaction A attempts to commit its stale entity -> OptimisticLockException
        assertThatThrownBy(() -> {
            requiresNewTx.execute(statusA -> {
                Product productA = productRepository.findById(productId).orElseThrow();
                assertThat(productA.getVersion()).isEqualTo(0L);

                // Transaction B commits concurrently in a completely separate transaction
                TransactionTemplate threadTx = new TransactionTemplate(transactionManager);
                threadTx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                threadTx.execute(statusB -> {
                    Product productB = productRepository.findById(productId).orElseThrow();
                    productB.update("Nitro Cold Brew - Large", null, null, new BigDecimal("6.50"), null);
                    productRepository.saveAndFlush(productB);
                    return null;
                });

                // Now Transaction A tries to modify and flush its stale state (version 0 in memory vs version 1 in DB)
                productA.update("Nitro Cold Brew - Small", null, null, new BigDecimal("4.50"), null);
                entityManager.flush();
                return null;
            });
        }).isInstanceOf(jakarta.persistence.OptimisticLockException.class);
    }
}
