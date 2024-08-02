export const calculateSlippageBuy = (
    amount: bigint,
    basisPoints: bigint
) => {
    return amount + (amount * basisPoints) / 10000n;
};

export const calculateSlippageSell = (
    amount: bigint,
    basisPoints: bigint
) => {
    return amount - (amount * basisPoints) / 10000n;
};