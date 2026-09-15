package com.coffeeshop.product.service;

import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.ResourceNotFoundException;
import com.coffeeshop.inventory.service.InventoryService;
import com.coffeeshop.product.dto.CreateProductRequest;
import com.coffeeshop.product.dto.ProductResponse;
import com.coffeeshop.product.dto.UpdateProductRequest;
import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.entity.ProductCategory;
import com.coffeeshop.product.event.ProductCreatedEvent;
import com.coffeeshop.product.repository.ProductRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final ApplicationEventPublisher eventPublisher;

    public ProductService(
            ProductRepository productRepository,
            InventoryService inventoryService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findProducts(ProductCategory category, Boolean available, Pageable pageable) {
        return productRepository.searchProducts(category, available, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductResponse findProductById(UUID id) {
        Product product = findEntityById(id);
        return ProductResponse.fromEntity(product);
    }

    @Transactional(readOnly = true)
    public Product findEntityById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PRODUCT_NOT_FOUND, "Product not found with id: " + id));
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Product product = Product.create(
                request.name(),
                request.description(),
                request.category(),
                request.price(),
                request.currency(),
                request.available() != null ? request.available() : true
        );
        Product savedProduct = productRepository.save(product);

        int initialStock = (request.initialStock() != null && request.initialStock() > 0) ? request.initialStock() : 0;
        inventoryService.initializeInventory(savedProduct.getId(), initialStock);

        // Publish domain event
        eventPublisher.publishEvent(new ProductCreatedEvent(savedProduct.getId(), savedProduct.getName(), initialStock));

        return ProductResponse.fromEntity(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, UpdateProductRequest request) {
        Product product = findEntityById(id);
        product.update(
                request.name(),
                request.description(),
                request.category(),
                request.price(),
                request.available()
        );
        // Relies on Hibernate dirty checking within the active transaction
        return ProductResponse.fromEntity(product);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        Product product = findEntityById(id);
        product.markDeleted();
    }
}
