import type { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { BN } from '@coral-xyz/anchor';
export interface CreateEvent {
    name: string;
    symbol: string;
    uri: string;
    mint: PublicKey;
    bondingCurve: PublicKey;
    user: PublicKey;
}
export interface TradeEvent {
    mint: PublicKey;
    solAmount: BN;
    tokenAmount: BN;
    isBuy: boolean;
    user: PublicKey;
    timestamp: BN;
    virtualSolReserves: BN;
    virtualTokenReserves: BN;
    realSolReserves: BN;
    realTokenReserves: BN;
}
export interface CompleteEvent {
    user: PublicKey;
    mint: PublicKey;
    bondingCurve: PublicKey;
    timestamp: BN;
}
export interface SetParamsEvent {
    feeRecipient: PublicKey;
    initialVirtualTokenReserves: BN;
    initialVirtualSolReserves: BN;
    initialRealTokenReserves: BN;
    tokenTotalSupply: BN;
    feeBasisPoints: BN;
}
export type Events = "createEvent" | "tradeEvent" | "completeEvent" | "setParamsEvent";
export interface EventCallback<E extends Events> {
    (event: E extends "createEvent" ? CreateEvent : never): void;
    (event: E extends "tradeEvent" ? TradeEvent : never): void;
    (event: E extends "completeEvent" ? CompleteEvent : never): void;
    (event: E extends "setParamsEvent" ? SetParamsEvent : never): void;
}
export interface TokenDataAPI {
    mint: string;
    name: string;
    symbol: string;
    description: string;
    image_uri: string;
    video_uri?: string;
    metadata_uri: string;
    twitter?: string;
    telegram?: string;
    bonding_curve: string;
    associated_bonding_curve: string;
    creator: string;
    created_timestamp: number;
    raydium_pool?: string;
    complete: boolean;
    virtual_sol_reserves: number;
    virtual_token_reserves: number;
    total_supply: number;
    website?: string;
    show_name: boolean;
    king_of_the_hill_timestamp?: number;
    market_cap: number;
    reply_count: number;
    last_reply: number;
    nsfw: boolean;
    market_id?: string;
    inverted?: string;
    is_currently_live: boolean;
    username?: string;
    profile_image?: string;
    usd_market_cap: number;
}
export interface TokenMetadataResponse {
    metadata: {
        name: string;
        symbol: string;
        description: string;
        image: string;
        showName: boolean;
        createdOn: string;
    };
    metadataUri: string;
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
}
export type CompileBuyReturn<B extends boolean> = B extends true ? TransactionInstruction[] : TransactionInstruction;
