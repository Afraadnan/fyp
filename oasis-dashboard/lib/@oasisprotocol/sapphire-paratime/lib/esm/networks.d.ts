/**
 * This environment variable allows for the sapphire-localnet port to be
 * overridden via the command-line. This is useful for debugging with a proxy.
 *
 * Note: this will fail gracefully in-browser
 */
export declare const SAPPHIRE_LOCALNET_HTTP_PROXY_PORT: number;
export declare const SAPPHIRE_LOCALNET_HTTP_PROXY_HOST: string | number;
export declare const NETWORKS: {
    [x: number]: {
        chainId: number;
        defaultGateway: string;
        runtimeId: string;
    };
    mainnet: {
        chainId: number;
        defaultGateway: string;
        runtimeId: string;
    };
    testnet: {
        chainId: number;
        defaultGateway: string;
        runtimeId: string;
    };
    localnet: {
        chainId: number;
        defaultGateway: string;
        runtimeId: string;
    };
};
//# sourceMappingURL=networks.d.ts.map