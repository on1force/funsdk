"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SLIPPAGE_BASIS = exports.DEFAULT_COMMITMENT = exports.DEFAULT_DECIMALS = exports.METADATA_SEED = exports.BONDING_CURVE_SEED = exports.MINT_AUTHORITY_SEED = exports.GLOBAL_ACCOUNT_SEED = exports.PUMPFUN_PROGRAM_ID = exports.MPL_TOKEN_METADATA_PROGRAM_ID = void 0;
const MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
exports.MPL_TOKEN_METADATA_PROGRAM_ID = MPL_TOKEN_METADATA_PROGRAM_ID;
const PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
exports.PUMPFUN_PROGRAM_ID = PUMPFUN_PROGRAM_ID;
const GLOBAL_ACCOUNT_SEED = "global";
exports.GLOBAL_ACCOUNT_SEED = GLOBAL_ACCOUNT_SEED;
const MINT_AUTHORITY_SEED = "mint-authority";
exports.MINT_AUTHORITY_SEED = MINT_AUTHORITY_SEED;
const BONDING_CURVE_SEED = "bonding-curve";
exports.BONDING_CURVE_SEED = BONDING_CURVE_SEED;
const METADATA_SEED = "metadata";
exports.METADATA_SEED = METADATA_SEED;
const DEFAULT_DECIMALS = 6;
exports.DEFAULT_DECIMALS = DEFAULT_DECIMALS;
const DEFAULT_COMMITMENT = "finalized";
exports.DEFAULT_COMMITMENT = DEFAULT_COMMITMENT;
const DEFAULT_SLIPPAGE_BASIS = 500n;
exports.DEFAULT_SLIPPAGE_BASIS = DEFAULT_SLIPPAGE_BASIS;
__exportStar(require("./types"), exports);
