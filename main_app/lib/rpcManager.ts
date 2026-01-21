import { createPublicClient, http, PublicClient } from 'viem';
import { bsc } from 'viem/chains';

// Comprehensive list of BSC RPC endpoints, ordered by reliability
// NodeReal is prioritized as the primary endpoint for faster performance
const BSC_RPC_ENDPOINTS = [
    'https://bsc-mainnet.nodereal.io/v1/9df36507ccc648d6984534b84c99cc1b', // NodeReal (Premium)
];

interface RPCEndpointHealth {
    url: string;
    failures: number;
    lastFailure: number;
    lastSuccess: number;
    isCircuitOpen: boolean;
}

class RPCManager {
    private endpointHealth: Map<string, RPCEndpointHealth>;
    private currentEndpointIndex: number;
    private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
    private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds
    private readonly FAILURE_RESET_TIME = 300000; // 5 minutes

    constructor() {
        this.endpointHealth = new Map();
        this.currentEndpointIndex = 0;

        // Initialize health tracking for all endpoints
        BSC_RPC_ENDPOINTS.forEach(url => {
            this.endpointHealth.set(url, {
                url,
                failures: 0,
                lastFailure: 0,
                lastSuccess: 0,
                isCircuitOpen: false,
            });
        });
    }

    /**
     * Get the next healthy RPC endpoint
     */
    getHealthyEndpoint(): string {
        const now = Date.now();

        // Try to find a healthy endpoint
        for (let i = 0; i < BSC_RPC_ENDPOINTS.length; i++) {
            const index = (this.currentEndpointIndex + i) % BSC_RPC_ENDPOINTS.length;
            const endpoint = BSC_RPC_ENDPOINTS[index];
            const health = this.endpointHealth.get(endpoint)!;

            // Check if circuit breaker should be reset
            if (health.isCircuitOpen && now - health.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
                health.isCircuitOpen = false;
                health.failures = 0;
            }

            // Return first healthy endpoint
            if (!health.isCircuitOpen) {
                this.currentEndpointIndex = index;
                return endpoint;
            }
        }

        // If all endpoints have open circuits, reset the one that failed longest ago
        let oldestFailure = now;
        let oldestIndex = 0;

        BSC_RPC_ENDPOINTS.forEach((endpoint, index) => {
            const health = this.endpointHealth.get(endpoint)!;
            if (health.lastFailure < oldestFailure) {
                oldestFailure = health.lastFailure;
                oldestIndex = index;
            }
        });

        const fallbackEndpoint = BSC_RPC_ENDPOINTS[oldestIndex];
        const fallbackHealth = this.endpointHealth.get(fallbackEndpoint)!;
        fallbackHealth.isCircuitOpen = false;
        fallbackHealth.failures = 0;
        this.currentEndpointIndex = oldestIndex;

        return fallbackEndpoint;
    }

    /**
     * Mark an endpoint as successful
     */
    recordSuccess(endpoint: string): void {
        const health = this.endpointHealth.get(endpoint);
        if (health) {
            health.lastSuccess = Date.now();
            health.failures = 0;
            health.isCircuitOpen = false;
        }
    }

    /**
     * Mark an endpoint as failed
     */
    recordFailure(endpoint: string): void {
        const health = this.endpointHealth.get(endpoint);
        if (health) {
            health.failures++;
            health.lastFailure = Date.now();

            // Open circuit breaker if threshold reached
            if (health.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
                health.isCircuitOpen = true;
                console.warn(`🔴 Circuit breaker opened for ${endpoint} after ${health.failures} failures`);
            }
        }
    }

    /**
     * Get all endpoints sorted by health (best first)
     */
    getEndpointsByHealth(): string[] {
        const now = Date.now();

        return BSC_RPC_ENDPOINTS.slice().sort((a, b) => {
            const healthA = this.endpointHealth.get(a)!;
            const healthB = this.endpointHealth.get(b)!;

            // Prioritize endpoints with closed circuits
            if (healthA.isCircuitOpen && !healthB.isCircuitOpen) return 1;
            if (!healthA.isCircuitOpen && healthB.isCircuitOpen) return -1;

            // Then by recency of success
            if (healthA.lastSuccess > healthB.lastSuccess) return -1;
            if (healthA.lastSuccess < healthB.lastSuccess) return 1;

            // Then by fewer failures
            return healthA.failures - healthB.failures;
        });
    }

    /**
     * Create a public client with automatic RPC failover
     */
    createPublicClient(): PublicClient {
        const endpoint = this.getHealthyEndpoint();

        return createPublicClient({
            chain: bsc,
            transport: http(endpoint, {
                timeout: 10000, // 10 second timeout
                retryCount: 0, // We handle retries ourselves
            }),
        });
    }

    /**
     * Get current RPC status for debugging
     */
    getStatus(): { current: string; health: RPCEndpointHealth[] } {
        return {
            current: BSC_RPC_ENDPOINTS[this.currentEndpointIndex],
            health: Array.from(this.endpointHealth.values()),
        };
    }
}

// Export singleton instance
export const rpcManager = new RPCManager();

// Export helper function for retry with RPC failover
export async function retryWithRPCFailover<T>(
    fn: (client: PublicClient) => Promise<T>,
    maxRetries = 3
): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const endpoint = rpcManager.getHealthyEndpoint();
        const client = rpcManager.createPublicClient();

        try {
            console.log(`🔄 Attempt ${attempt + 1}/${maxRetries} using ${endpoint}`);
            const result = await fn(client);
            rpcManager.recordSuccess(endpoint);
            return result;
        } catch (error) {
            lastError = error as Error;
            rpcManager.recordFailure(endpoint);
            console.warn(`❌ Attempt ${attempt + 1} failed with ${endpoint}:`, error);

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`🔴 All ${maxRetries} attempts failed. Last error:`, lastError);
    return null;
}
