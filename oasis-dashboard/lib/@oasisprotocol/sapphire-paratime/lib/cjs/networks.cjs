"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORKS = exports.SAPPHIRE_LOCALNET_HTTP_PROXY_HOST = exports.SAPPHIRE_LOCALNET_HTTP_PROXY_PORT = void 0;
/**
 * This environment variable allows for the sapphire-localnet port to be
 * overridden via the command-line. This is useful for debugging with a proxy.
 *
 * Note: this will fail gracefully in-browser
 */
exports.SAPPHIRE_LOCALNET_HTTP_PROXY_PORT = ((_b = (_a = globalThis.process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.SAPPHIRE_LOCALNET_HTTP_PROXY_PORT)
    ? Number(process.env.SAPPHIRE_LOCALNET_HTTP_PROXY_PORT)
    : 8545;
exports.SAPPHIRE_LOCALNET_HTTP_PROXY_HOST = ((_d = (_c = globalThis.process) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d.SAPPHIRE_LOCALNET_HTTP_PROXY_HOST)
    ? Number(process.env.SAPPHIRE_LOCALNET_HTTP_PROXY_HOST)
    : 'localhost';
const localnetParams = {
    chainId: 0x5afd,
    defaultGateway: `http://${exports.SAPPHIRE_LOCALNET_HTTP_PROXY_HOST}:${exports.SAPPHIRE_LOCALNET_HTTP_PROXY_PORT}`,
    runtimeId: '0x8000000000000000000000000000000000000000000000000000000000000000',
};
const mainnetParams = {
    chainId: 0x5afe,
    defaultGateway: 'https://sapphire.oasis.io/',
    runtimeId: '0x000000000000000000000000000000000000000000000000f80306c9858e7279',
};
const testnetParams = {
    chainId: 0x5aff,
    defaultGateway: 'https://testnet.sapphire.oasis.io/',
    runtimeId: '0x000000000000000000000000000000000000000000000000a6d1e3ebf60dff6c',
};
exports.NETWORKS = {
    mainnet: mainnetParams,
    testnet: testnetParams,
    localnet: localnetParams,
    [mainnetParams.chainId]: mainnetParams,
    [testnetParams.chainId]: testnetParams,
    [localnetParams.chainId]: localnetParams,
};
//# sourceMappingURL=networks.js.map