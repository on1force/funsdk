"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pumpfun_1 = __importDefault(require("./pumpfun"));
const fs_1 = __importDefault(require("fs"));
const web3_js_1 = require("@solana/web3.js");
const globals_1 = require("@jest/globals");
const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("mainnet-beta"));
const fun = new pumpfun_1.default(connection);
const creator = web3_js_1.Keypair.generate();
const token = web3_js_1.Keypair.generate();
const tokenImagePath = fs_1.default.readFileSync("./image.png", { encoding: "base64" });
const tokenImage = new File([tokenImagePath], "image.png");
const tokenData = {
    name: "Test token",
    symbol: "TTK",
    description: "A test token",
    image: tokenImage,
    keypair: token
};
(0, globals_1.describe)('Fun test unit', async () => {
    (0, globals_1.test)("init solana connection", () => {
        (0, globals_1.expect)(connection).toBeInstanceOf(web3_js_1.Connection);
    });
    (0, globals_1.test)("init pumpfun sdk", () => {
        (0, globals_1.expect)(fun).toBeInstanceOf(pumpfun_1.default);
    });
    (0, globals_1.test)("Generate create token instruction", async () => {
        const createIntruct = await fun.compileCreateTokenInstruction({
            creator: creator.publicKey,
            tokenMeta: tokenData
        });
        (0, globals_1.expect)(createIntruct).toBeInstanceOf(web3_js_1.TransactionInstruction);
        (0, globals_1.expect)(createIntruct.data).toBeInstanceOf(Buffer);
    });
    (0, globals_1.test)("Generate buy token instruction", async () => {
        const buyInstruct = await fun.compileBuyInstruction({
            solAmount: BigInt(1 * web3_js_1.LAMPORTS_PER_SOL),
            token: token.publicKey,
            trader: creator.publicKey
        }, true);
        // with type annotation. Same return as above
        // fun.compileBuyInstruction<true>({
        //     solAmount: BigInt(1 * LAMPORTS_PER_SOL),
        //     token: token.publicKey,
        //     trader: creator.publicKey
        // })
        (0, globals_1.expect)(buyInstruct).toBeInstanceOf((Array));
        (0, globals_1.expect)(buyInstruct[0].data).toBeInstanceOf(Buffer);
    });
    (0, globals_1.test)("Generate sell token instruction [Fail on no bonding curve]", async () => {
        (0, globals_1.expect)(Promise.resolve(fun.compileSellInstruction({
            tokenAmount: 10000000n,
            token: token.publicKey,
            trader: creator.publicKey
        }))).rejects.toThrowError("Bonding curve not found");
    });
});
