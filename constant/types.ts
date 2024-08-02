import type { Keypair, PublicKey } from "@solana/web3.js";

export interface TokenMetadataResponse {
    metadata: {
        name: string
        symbol: string
        description: string
        image: string
        showName: boolean
        createdOn: string
    }
    metadataUri: string
}

export interface TokenMeta {
    keypair: Keypair;
    name: string;
    symbol: string;
    image: File;
    description: string;
    telegram?: string;
    twitter?: string;
    website?: string;
}

export interface CreateTokenInstructionParam {
    creator: PublicKey;
    tokenMeta: TokenMeta;
}

export interface TradeInstructionParam {
    trader: PublicKey;
    token: PublicKey;
    amount: bigint;
    slippageCut: bigint;
}

export interface BuyInstructionParam {
    trader: PublicKey;
    token: PublicKey;
    solAmount: bigint;
}

export interface SellInstructionParam {
    trader: PublicKey;
    token: PublicKey;
    tokenAmount: bigint;
};