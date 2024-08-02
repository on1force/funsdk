import type { Commitment } from '@solana/web3.js';

const MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const GLOBAL_ACCOUNT_SEED = "global";
const MINT_AUTHORITY_SEED = "mint-authority";
const BONDING_CURVE_SEED = "bonding-curve";
const METADATA_SEED = "metadata";
const DEFAULT_DECIMALS = 6;
const DEFAULT_COMMITMENT: Commitment = "confirmed";
const DEFAULT_SLIPPAGE_BASIS = 500n;

export {
    MPL_TOKEN_METADATA_PROGRAM_ID,
    PUMPFUN_PROGRAM_ID,
    GLOBAL_ACCOUNT_SEED,
    MINT_AUTHORITY_SEED,
    BONDING_CURVE_SEED,
    METADATA_SEED,
    DEFAULT_DECIMALS,
    DEFAULT_COMMITMENT,
    DEFAULT_SLIPPAGE_BASIS
}
export * from './types';
