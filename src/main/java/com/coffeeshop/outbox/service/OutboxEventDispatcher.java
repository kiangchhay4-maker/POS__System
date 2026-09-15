package com.coffeeshop.outbox.service;

import com.coffeeshop.outbox.entity.OutboxEvent;

public interface OutboxEventDispatcher {
    void dispatch(OutboxEvent event) throws Exception;
}
