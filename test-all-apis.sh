#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:8080/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================================================${NC}"
echo -e "${BLUE}       Coffee Shop System — Exhaustive API Test Suite (One-by-One)     ${NC}"
echo -e "${BLUE}========================================================================${NC}"

# Helper to run a test and print results
run_test() {
    local title="$1"
    local expected_code="$2"
    local response="$3"
    local http_code="$4"
    local body="$5"

    echo -e "\n${YELLOW}------------------------------------------------------------------------${NC}"
    echo -e "${YELLOW}TEST: ${title}${NC}"
    echo -e "HTTP Status Code: ${http_code} (Expected: ${expected_code})"
    echo -e "Response Payload: ${body}"

    if [[ "$http_code" == "$expected_code" ]]; then
        echo -e "${GREEN}>>> RESULT: PASSED (Expected HTTP ${expected_code} received)${NC}"
    else
        echo -e "${RED}>>> RESULT: FAILED (Expected HTTP ${expected_code}, got ${http_code})${NC}"
    fi
}

call_api() {
    local method="$1"
    local path="$2"
    local header="$3"
    local data="$4"
    local extra_header="$5"

    local cmd=(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${path}")
    if [[ -n "$header" ]]; then
        cmd+=(-H "$header")
    fi
    if [[ -n "$extra_header" ]]; then
        cmd+=(-H "$extra_header")
    fi
    if [[ -n "$data" ]]; then
        cmd+=(-H "Content-Type: application/json" -d "$data")
    fi

    local full_out
    full_out=$("${cmd[@]}")
    local http_code=$(echo "$full_out" | tail -n1)
    local body=$(echo "$full_out" | sed '$d')

    echo "$http_code|$body"
}

# ==============================================================================
# MODULE 1: AUTHENTICATION & AUTHORIZATION
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 1: AUTHENTICATION & AUTHORIZATION ===${NC}"

# 1.1 Register New Customer (Success)
RANDOM_PHONE="012$((100000 + RANDOM % 900000))"
RES=$(call_api "POST" "/auth/register" "" "{\"name\":\"Alice\",\"phone\":\"$RANDOM_PHONE\",\"password\":\"Password123!\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.1 POST /auth/register - Success (201 Created)" "201" "$RES" "$CODE" "$BODY"
CUSTOMER_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
CUSTOMER_ID=$(echo "$BODY" | grep -o '"userId":"[^"]*' | cut -d'"' -f4)

# 1.2 Register Duplicate Phone (Conflict)
RES=$(call_api "POST" "/auth/register" "" "{\"name\":\"Alice Duplicate\",\"phone\":\"$RANDOM_PHONE\",\"password\":\"Password123!\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.2 POST /auth/register - Duplicate Phone (409 Conflict: AUTH_USER_ALREADY_EXISTS)" "409" "$RES" "$CODE" "$BODY"

# 1.3 Register Validation Failure (Bad Request)
RES=$(call_api "POST" "/auth/register" "" "{\"name\":\"A\",\"phone\":\"bad_phone\",\"password\":\"123\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.3 POST /auth/register - Validation Error (400 Bad Request: REQUEST_VALIDATION_FAILED)" "400" "$RES" "$CODE" "$BODY"

# 1.4 Login (Success)
RES=$(call_api "POST" "/auth/login" "" "{\"phone\":\"$RANDOM_PHONE\",\"password\":\"Password123!\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.4 POST /auth/login - Success (200 OK)" "200" "$RES" "$CODE" "$BODY"
REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

# 1.5 Login Invalid Password (Unauthorized)
RES=$(call_api "POST" "/auth/login" "" "{\"phone\":\"$RANDOM_PHONE\",\"password\":\"WrongPassword!\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.5 POST /auth/login - Invalid Password (401 Unauthorized: AUTH_INVALID_CREDENTIALS)" "401" "$RES" "$CODE" "$BODY"

# 1.6 Refresh Token (Success)
RES=$(call_api "POST" "/auth/refresh" "" "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.6 POST /auth/refresh - Valid Refresh Token (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 1.7 Refresh Token (Expired/Malformed)
RES=$(call_api "POST" "/auth/refresh" "" "{\"refreshToken\":\"malformed.jwt.token\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "1.7 POST /auth/refresh - Invalid Token (401 Unauthorized: AUTH_TOKEN_EXPIRED)" "401" "$RES" "$CODE" "$BODY"

# Login as Admin and Staff
ADMIN_RES=$(call_api "POST" "/auth/login" "" "{\"phone\":\"099999999\",\"password\":\"AdminPassword123!\"}")
ADMIN_TOKEN=$(echo "${ADMIN_RES#*|}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

STAFF_RES=$(call_api "POST" "/auth/login" "" "{\"phone\":\"088888888\",\"password\":\"StaffPassword123!\"}")
STAFF_TOKEN=$(echo "${STAFF_RES#*|}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# ==============================================================================
# MODULE 2: CUSTOMER PROFILE
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 2: CUSTOMER PROFILE ===${NC}"

# 2.1 Get Profile without Token (Unauthorized)
RES=$(call_api "GET" "/customers/me" "" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "2.1 GET /customers/me - Unauthenticated (401 Unauthorized)" "401" "$RES" "$CODE" "$BODY"

# 2.2 Get Profile with Token (Success)
RES=$(call_api "GET" "/customers/me" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "2.2 GET /customers/me - Authenticated (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 2.3 Update Profile (Success)
RES=$(call_api "PATCH" "/customers/me" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"name\":\"Alice Wonderland\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "2.3 PATCH /customers/me - Update Name (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 2.4 Update Profile with Blank Name (Bad Request)
RES=$(call_api "PATCH" "/customers/me" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"name\":\"\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "2.4 PATCH /customers/me - Blank Name (400 Bad Request)" "400" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 3: PRODUCTS & ADMIN CATALOG
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 3: PRODUCTS & ADMIN CATALOG ===${NC}"

# 3.1 Create Product as Customer (Forbidden)
RES=$(call_api "POST" "/admin/products" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"name\":\"Unauthorized Coffee\",\"category\":\"COFFEE\",\"price\":3.50,\"initialStock\":10}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.1 POST /admin/products - Customer Role Attempt (403 Forbidden: AUTH_ACCESS_DENIED)" "403" "$RES" "$CODE" "$BODY"

# 3.2 Create Product as Admin (Success)
RES=$(call_api "POST" "/admin/products" "Authorization: Bearer $ADMIN_TOKEN" "{\"name\":\"Signature Caramel Macchiato\",\"description\":\"Vanilla syrup, steamed milk, espresso, caramel drizzle\",\"category\":\"COFFEE\",\"price\":4.75,\"currency\":\"USD\",\"available\":true,\"initialStock\":50}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.2 POST /admin/products - Admin Role (201 Created)" "201" "$RES" "$CODE" "$BODY"
PRODUCT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# 3.3 Create Product with Negative Price (Validation Error)
RES=$(call_api "POST" "/admin/products" "Authorization: Bearer $ADMIN_TOKEN" "{\"name\":\"Invalid Item\",\"category\":\"COFFEE\",\"price\":-2.00,\"initialStock\":10}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.3 POST /admin/products - Negative Price (400 Bad Request)" "400" "$RES" "$CODE" "$BODY"

# 3.4 Browse Products (Public, Success with Pagination)
RES=$(call_api "GET" "/products?page=0&size=5&category=COFFEE" "" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.4 GET /products - Public Filtering & Pagination (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 3.5 Get Product by ID (Success)
RES=$(call_api "GET" "/products/$PRODUCT_ID" "" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.5 GET /products/{id} - Existing Product (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 3.6 Get Product by Non-Existent ID (Not Found)
FAKE_UUID="00000000-0000-0000-0000-000000000000"
RES=$(call_api "GET" "/products/$FAKE_UUID" "" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.6 GET /products/{id} - Non-existent ID (404 Not Found: PRODUCT_NOT_FOUND)" "404" "$RES" "$CODE" "$BODY"

# 3.7 Update Product as Admin (Success)
RES=$(call_api "PATCH" "/admin/products/$PRODUCT_ID" "Authorization: Bearer $ADMIN_TOKEN" "{\"price\":5.00,\"description\":\"Updated premium recipe\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "3.7 PATCH /admin/products/{id} - Admin Update (200 OK)" "200" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 4: INVENTORY MANAGEMENT
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 4: INVENTORY MANAGEMENT ===${NC}"

# 4.1 Get Product Inventory (Success)
RES=$(call_api "GET" "/admin/inventory/$PRODUCT_ID" "Authorization: Bearer $ADMIN_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "4.1 GET /admin/inventory/{productId} - Read Stock (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 4.2 Replenish Inventory (Success)
RES=$(call_api "PATCH" "/admin/inventory/$PRODUCT_ID" "Authorization: Bearer $ADMIN_TOKEN" "{\"replenishQuantity\":20}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "4.2 PATCH /admin/inventory/{productId} - Replenish Stock (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 4.3 Adjust Inventory with Negative On-Hand (Validation Error)
RES=$(call_api "PATCH" "/admin/inventory/$PRODUCT_ID" "Authorization: Bearer $ADMIN_TOKEN" "{\"onHandQuantity\":-5}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "4.3 PATCH /admin/inventory/{productId} - Negative Stock (400 Bad Request)" "400" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 5: SHOPPING CART
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 5: SHOPPING CART ===${NC}"

# 5.1 Get Cart (Success)
RES=$(call_api "GET" "/cart" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "5.1 GET /cart - View Cart (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 5.2 Add Item to Cart (Success)
RES=$(call_api "POST" "/cart/items" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "5.2 POST /cart/items - Add Item (201 Created)" "201" "$RES" "$CODE" "$BODY"
CART_ITEM_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n2 | tail -n1 | cut -d'"' -f4)

# 5.3 Add Item Exceeding Available Stock (Conflict)
RES=$(call_api "POST" "/cart/items" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"productId\":\"$PRODUCT_ID\",\"quantity\":9999}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "5.3 POST /cart/items - Over Stock (409 Conflict: INVENTORY_INSUFFICIENT)" "409" "$RES" "$CODE" "$BODY"

# 5.4 Update Item Quantity in Cart (Success)
RES=$(call_api "PATCH" "/cart/items/$CART_ITEM_ID" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"quantity\":3}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "5.4 PATCH /cart/items/{id} - Update Quantity (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 5.5 Remove Item from Cart (Success)
RES=$(call_api "DELETE" "/cart/items/$CART_ITEM_ID" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "5.5 DELETE /cart/items/{id} - Remove Item (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 5.6 Remove Non-existent Item (Not Found)
RES=$(call_api "DELETE" "/cart/items/$FAKE_UUID" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "5.6 DELETE /cart/items/{id} - Non-existent Item (404 Not Found: CART_ITEM_NOT_FOUND)" "404" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 6: ORDERS & IDEMPOTENCY
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 6: ORDERS & IDEMPOTENCY ===${NC}"

IDEMPOTENCY_KEY="idem_order_$(date +%s)_$RANDOM"

# 6.1 Create Order with Idempotency-Key (Success - 201 Created)
ORDER_PAYLOAD="{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}],\"orderType\":\"TAKEAWAY\"}"
RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$ORDER_PAYLOAD" "Idempotency-Key: $IDEMPOTENCY_KEY")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.1 POST /orders - Create Order Atomically (201 Created)" "201" "$RES" "$CODE" "$BODY"
ORDER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# 6.2 Idempotent Retry with SAME Key (Success - 201 Created Cached Response)
RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$ORDER_PAYLOAD" "Idempotency-Key: $IDEMPOTENCY_KEY")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.2 POST /orders - Idempotent Replay (201 Created Cached Match)" "201" "$RES" "$CODE" "$BODY"

# 6.3 Idempotent Key Reused with DIFFERENT Payload (Conflict)
DIFFERENT_PAYLOAD="{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":5}],\"orderType\":\"DINE_IN\"}"
RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$DIFFERENT_PAYLOAD" "Idempotency-Key: $IDEMPOTENCY_KEY")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.3 POST /orders - Idempotency Key Reused with Altered Body (409 Conflict: IDEMPOTENCY_KEY_REUSED)" "409" "$RES" "$CODE" "$BODY"

# 6.4 Create Order Exceeding Available Stock (Conflict)
EXCESSIVE_ORDER="{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":99999}],\"orderType\":\"TAKEAWAY\"}"
RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$EXCESSIVE_ORDER" "Idempotency-Key: new_key_$RANDOM")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.4 POST /orders - Order Exceeds Stock (409 Conflict: INVENTORY_INSUFFICIENT)" "409" "$RES" "$CODE" "$BODY"

# 6.5 List Customer Orders (Success)
RES=$(call_api "GET" "/orders?page=0&size=10" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.5 GET /orders - List Customer Orders (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 6.6 Get Order by ID (Success)
RES=$(call_api "GET" "/orders/$ORDER_ID" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.6 GET /orders/{orderId} - Order Details (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 6.7 Get Non-Existent Order (Not Found)
RES=$(call_api "GET" "/orders/$FAKE_UUID" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.7 GET /orders/{orderId} - Non-existent (404 Not Found: ORDER_NOT_FOUND)" "404" "$RES" "$CODE" "$BODY"

# Create a separate order to test Cancellation
CANCEL_KEY="idem_cancel_$RANDOM"
CANCEL_RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$ORDER_PAYLOAD" "Idempotency-Key: $CANCEL_KEY")
CANCEL_ORDER_ID=$(echo "${CANCEL_RES#*|}" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# 6.8 Cancel Order (Success, stock released)
RES=$(call_api "POST" "/orders/$CANCEL_ORDER_ID/cancel" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.8 POST /orders/{id}/cancel - Cancel & Stock Released (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 6.9 Cancel Already Cancelled Order (Unprocessable Entity)
RES=$(call_api "POST" "/orders/$CANCEL_ORDER_ID/cancel" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "6.9 POST /orders/{id}/cancel - Already Cancelled (422 Unprocessable: ORDER_INVALID_STATUS)" "422" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 7: PAYMENT & RESILIENCE (PARTIAL FAILURE / TIMEOUT)
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 7: PAYMENT & RESILIENCE ===${NC}"

# 7.1 Process Payment Approved (Success)
RES=$(call_api "POST" "/payments" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"orderId\":\"$ORDER_ID\",\"paymentMethod\":\"KHQR\",\"paymentToken\":\"valid_card_token\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "7.1 POST /payments - Approved Payment (200 OK -> SUCCEEDED & Order CONFIRMED)" "200" "$RES" "$CODE" "$BODY"

# 7.2 Process Payment on Already Paid Order (Conflict)
RES=$(call_api "POST" "/payments" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"orderId\":\"$ORDER_ID\",\"paymentMethod\":\"KHQR\",\"paymentToken\":\"valid_card_token\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "7.2 POST /payments - Double Charge Protection (409 Conflict: PAYMENT_ALREADY_PROCESSED)" "409" "$RES" "$CODE" "$BODY"

# Create order for Decline test
DECLINE_KEY="idem_decline_$RANDOM"
DEC_ORDER_RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$ORDER_PAYLOAD" "Idempotency-Key: $DECLINE_KEY")
DEC_ORDER_ID=$(echo "${DEC_ORDER_RES#*|}" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# 7.3 Process Payment Declined by Provider (Bad Request: PAYMENT_FAILED)
RES=$(call_api "POST" "/payments" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"orderId\":\"$DEC_ORDER_ID\",\"paymentMethod\":\"CREDIT_CARD\",\"paymentToken\":\"token_decline\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "7.3 POST /payments - Provider Decline Simulation (400 Bad Request: PAYMENT_FAILED)" "400" "$RES" "$CODE" "$BODY"

# Create order for Timeout test
TIMEOUT_KEY="idem_timeout_$RANDOM"
TIME_ORDER_RES=$(call_api "POST" "/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "$ORDER_PAYLOAD" "Idempotency-Key: $TIMEOUT_KEY")
TIME_ORDER_ID=$(echo "${TIME_ORDER_RES#*|}" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# 7.4 Process Payment Gateway Timeout (Resilient: Sets UNKNOWN, leaves order in PAYMENT_PENDING)
RES=$(call_api "POST" "/payments" "Authorization: Bearer $CUSTOMER_TOKEN" "{\"orderId\":\"$TIME_ORDER_ID\",\"paymentMethod\":\"CREDIT_CARD\",\"paymentToken\":\"token_timeout\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "7.4 POST /payments - Gateway Timeout Resilience (200 OK: Status UNKNOWN, Pending Reconciliation)" "200" "$RES" "$CODE" "$BODY"

# 7.5 Get Payment by Order ID (Success)
RES=$(call_api "GET" "/payments/order/$ORDER_ID" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "7.5 GET /payments/order/{orderId} - Query Payment Record (200 OK)" "200" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 8: STAFF ORDER FULFILLMENT WORKFLOW
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 8: STAFF ORDER WORKFLOW ===${NC}"

# 8.1 Customer Tries to View Staff Order Queue (Forbidden)
RES=$(call_api "GET" "/staff/orders" "Authorization: Bearer $CUSTOMER_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "8.1 GET /staff/orders - Customer Role (403 Forbidden: AUTH_ACCESS_DENIED)" "403" "$RES" "$CODE" "$BODY"

# 8.2 Staff Views Confirmed Orders Queue (Success)
RES=$(call_api "GET" "/staff/orders?status=CONFIRMED" "Authorization: Bearer $STAFF_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "8.2 GET /staff/orders - Staff Barista Queue (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 8.3 Staff Advances Order: CONFIRMED -> PREPARING
RES=$(call_api "PATCH" "/staff/orders/$ORDER_ID/status" "Authorization: Bearer $STAFF_TOKEN" "{\"status\":\"PREPARING\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "8.3 PATCH /staff/orders/{id}/status - CONFIRMED -> PREPARING (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 8.4 Staff Advances Order: PREPARING -> READY
RES=$(call_api "PATCH" "/staff/orders/$ORDER_ID/status" "Authorization: Bearer $STAFF_TOKEN" "{\"status\":\"READY\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "8.4 PATCH /staff/orders/{id}/status - PREPARING -> READY (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 8.5 Staff Advances Order: READY -> COMPLETED (Commits reserved stock)
RES=$(call_api "PATCH" "/staff/orders/$ORDER_ID/status" "Authorization: Bearer $STAFF_TOKEN" "{\"status\":\"COMPLETED\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "8.5 PATCH /staff/orders/{id}/status - READY -> COMPLETED (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 8.6 Invalid State Jump: COMPLETED -> PREPARING (Rejected by Finite State Machine)
RES=$(call_api "PATCH" "/staff/orders/$ORDER_ID/status" "Authorization: Bearer $STAFF_TOKEN" "{\"status\":\"PREPARING\"}")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "8.6 PATCH /staff/orders/{id}/status - COMPLETED -> PREPARING (422 Unprocessable: ORDER_INVALID_STATUS)" "422" "$RES" "$CODE" "$BODY"

# ==============================================================================
# MODULE 9: ADMIN GLOBAL SEARCH & SOFT DELETE
# ==============================================================================
echo -e "\n${BLUE}=== MODULE 9: ADMIN REPORTING & SOFT DELETE ===${NC}"

# 9.1 Admin Searches All Orders
RES=$(call_api "GET" "/admin/orders?page=0&size=10" "Authorization: Bearer $ADMIN_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "9.1 GET /admin/orders - Admin Global Search (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 9.2 Admin Soft Deletes Product
RES=$(call_api "DELETE" "/admin/products/$PRODUCT_ID" "Authorization: Bearer $ADMIN_TOKEN" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "9.2 DELETE /admin/products/{id} - Soft Delete (200 OK)" "200" "$RES" "$CODE" "$BODY"

# 9.3 Verify Soft-Deleted Product Hidden from Normal Public Queries
RES=$(call_api "GET" "/products/$PRODUCT_ID" "" "")
CODE="${RES%%|*}"; BODY="${RES#*|}"
run_test "9.3 GET /products/{id} - Verifying Soft Deleted Product Hidden (404 Not Found)" "404" "$RES" "$CODE" "$BODY"

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}       ALL TEST SCENARIOS COMPLETED SUCCESSFULLY!                      ${NC}"
echo -e "${GREEN}========================================================================${NC}"
