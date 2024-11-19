"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSlippageSell = exports.calculateSlippageBuy = void 0;
const calculateSlippageBuy = (amount, basisPoints) => {
    return amount + (amount * basisPoints) / 10000n;
};
exports.calculateSlippageBuy = calculateSlippageBuy;
const calculateSlippageSell = (amount, basisPoints) => {
    return amount - (amount * basisPoints) / 10000n;
};
exports.calculateSlippageSell = calculateSlippageSell;
