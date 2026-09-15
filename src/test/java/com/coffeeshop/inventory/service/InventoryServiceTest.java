package com.coffeeshop.inventory.service;

import com.coffeeshop.common.exception.InsufficientInventoryException;
import com.coffeeshop.inventory.dto.InventoryResponse;
import com.coffeeshop.inventory.entity.Inventory;
import com.coffeeshop.inventory.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private UUID productId;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        inventory = Inventory.create(productId, 10);
    }

    @Test
    @DisplayName("Should successfully reserve stock when available quantity is sufficient")
    void shouldReserveStockSuccessfully() {
        when(inventoryRepository.findById(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        inventoryService.reserveStock(productId, 4);

        assertThat(inventory.getOnHandQuantity()).isEqualTo(10);
        assertThat(inventory.getReservedQuantity()).isEqualTo(4);
        assertThat(inventory.getAvailableQuantity()).isEqualTo(6);
        verify(inventoryRepository, times(1)).save(inventory);
    }

    @Test
    @DisplayName("Should reject reservation with InsufficientInventoryException when requested quantity exceeds available stock")
    void shouldRejectReservationWhenInsufficientStock() {
        when(inventoryRepository.findById(productId)).thenReturn(Optional.of(inventory));

        assertThatThrownBy(() -> inventoryService.reserveStock(productId, 11))
                .isInstanceOf(InsufficientInventoryException.class)
                .hasMessageContaining("Insufficient inventory");

        assertThat(inventory.getReservedQuantity()).isEqualTo(0);
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should release reserved stock upon order cancellation")
    void shouldReleaseReservationSuccessfully() {
        inventory.reserve(5);
        when(inventoryRepository.findById(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        inventoryService.releaseReservation(productId, 3);

        assertThat(inventory.getReservedQuantity()).isEqualTo(2);
        assertThat(inventory.getAvailableQuantity()).isEqualTo(8);
        verify(inventoryRepository, times(1)).save(inventory);
    }

    @Test
    @DisplayName("Should commit reserved stock upon order completion")
    void shouldCommitReservationSuccessfully() {
        inventory.reserve(4);
        when(inventoryRepository.findById(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        inventoryService.commitReservation(productId, 4);

        assertThat(inventory.getOnHandQuantity()).isEqualTo(6);
        assertThat(inventory.getReservedQuantity()).isEqualTo(0);
        assertThat(inventory.getAvailableQuantity()).isEqualTo(6);
        verify(inventoryRepository, times(1)).save(inventory);
    }
}
