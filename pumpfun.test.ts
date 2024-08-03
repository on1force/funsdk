import Fun from './pumpfun';
import fs from 'fs';
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { test, expect, describe } from 'bun:test';
import type { TokenMeta } from './constant';

const connection = new Connection(clusterApiUrl("mainnet-beta"));
const fun = new Fun(connection);
const creator = Keypair.generate();
const token = Keypair.generate();
const tokenImagePath = fs.readFileSync("./image.png", { encoding: "base64" });
const tokenImage = new File([tokenImagePath], "image.png");

const tokenData: TokenMeta = {
    name: "Test token",
    symbol: "TTK",
    description: "A test token",
    image: tokenImage,
    keypair: token
}

describe('Fun test unit', async () => {
    test("init solana connection", () => {
        expect(connection).toBeInstanceOf(Connection);
    });

    test("init pumpfun sdk", () => {
        expect(fun).toBeInstanceOf(Fun);
    });

    test("Generate create token instruction", async () => {
        const createIntruct = await fun.compileCreateTokenInstruction({
            creator: creator.publicKey,
            tokenMeta: tokenData
        });
        expect(createIntruct).toBeInstanceOf(TransactionInstruction);
        expect(createIntruct.data).toBeInstanceOf(Buffer);
    });

    test("Generate buy token instruction", async () => {
        const buyInstruct = await fun.compileBuyInstruction({
            solAmount: BigInt(1 * LAMPORTS_PER_SOL),
            token: token.publicKey,
            trader: creator.publicKey
        }, true);

        // with type annotation. Same return as above
        // fun.compileBuyInstruction<true>({
        //     solAmount: BigInt(1 * LAMPORTS_PER_SOL),
        //     token: token.publicKey,
        //     trader: creator.publicKey
        // })

        expect(buyInstruct).toBeInstanceOf(Array<TransactionInstruction>);
        expect(buyInstruct[0].data).toBeInstanceOf(Buffer);
    });

    test("Generate sell token instruction [Fail on no bonding curve]", async () => {
        expect(
            Promise.resolve(
                fun.compileSellInstruction({
                    tokenAmount: 10000000n,
                    token: token.publicKey,
                    trader: creator.publicKey
                })
            )
        ).rejects.toThrowError("Bonding curve not found");
    });
});