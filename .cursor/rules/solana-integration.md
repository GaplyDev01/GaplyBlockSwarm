# Solana Integration Rules

## Architecture

- Use dependency inversion with clear interfaces in core/blockchain/solana
- Implement concrete adapter classes in infrastructure/blockchain/solana
- Use the SolanaServiceFactory for service creation with proper DI
- Keep blockchain-specific logic isolated in the infrastructure layer

## RPC Services

- Use the ISolanaRpcService interface for all RPC operations
- Implement proper error handling for RPC request failures
- Cache frequent RPC requests to minimize network traffic
- Use response validation to ensure data integrity

## Wallet Integration

- Support multiple wallet adapters via Solana wallet adapter
- Keep wallet connection state in dedicated context providers
- Implement proper disconnect/reconnect and session handling
- Provide clear error states for wallet connection issues

## Transaction Handling

- Use proper transaction building patterns
- Validate transactions before sending to the network
- Implement retry logic for transient failures
- Provide feedback during transaction lifecycle (pending/success/error)

## Token Management

- Follow SPL token standards for token operations
- Implement proper balance checking before transactions
- Use token metadata services for rich token information
- Cache token account data when appropriate

## Testing

- Mock RPC services in unit tests
- Use dedicated test accounts for integration testing
- Reset wallet state between tests
- Test both success and error flows