"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../constant");
const utils_1 = require("../utils");
const buffer_1 = require("buffer");
const anchor_1 = require("@coral-xyz/anchor");
const IDL_1 = require("../IDL");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
class Fun {
    program;
    connection;
    /**
     * Default commitment for the class - can be override.
     * @default "confirmed"
     *
     * @example
     * // ...initialization codes
     *
     * fun.commitment = "finalized"
     */
    commitment = constant_1.DEFAULT_COMMITMENT;
    /**
     * Default slippage basis points for the class - can be override.
     *
     * @example
     * // ...initialization codes
     *
     * fun.slippageBasis = 1000n; // or bigint(xyz)
     */
    slippageBasis = constant_1.DEFAULT_SLIPPAGE_BASIS;
    /**
     * @constructor
     * @param provider - Provider instance from anchor
     * @param user - User public key instance to interact with transactions
     *
     * @example
     * import Fun from "funsdk";
     * import { Connection } from "@solana/web3.js";
     *
     * const connection = new Connection("RPC_URL");
     * const fun = new Fun(connection);
     */
    constructor(connection, user) {
        const provider = {
            connection: connection,
            publicKey: user
        };
        this.program = new anchor_1.Program(IDL_1.IDL, provider);
        this.connection = connection;
    }
    getBondingCurvePDA(token) {
        return web3_js_1.PublicKey.findProgramAddressSync([buffer_1.Buffer.from(constant_1.BONDING_CURVE_SEED), token.toBuffer()], this.program.programId)[0];
    }
    getMetadataPDA(mpl, token) {
        const [metadataPDA] = web3_js_1.PublicKey.findProgramAddressSync([
            buffer_1.Buffer.from(constant_1.METADATA_SEED),
            mpl.toBuffer(),
            token.toBuffer()
        ], mpl);
        return metadataPDA;
    }
    async checkRentExempt(trader) {
        const rentExemptBalance = await this.connection.getMinimumBalanceForRentExemption(spl_token_1.AccountLayout.span);
        const traderBalance = await this.connection.getBalance(trader);
        if (traderBalance < rentExemptBalance) {
            throw new Error(`${trader.toBase58()} account has insufficient funds for rent exemption. Required: ${rentExemptBalance}, Available: ${traderBalance}`);
        }
        return true;
    }
    async createATAInstruct(owner, token) {
        const atad = await (0, spl_token_1.getAssociatedTokenAddress)(token, owner, false);
        const createAta = (0, spl_token_1.createAssociatedTokenAccountInstruction)(owner, atad, owner, token);
        return createAta;
    }
    async getPumpfunGlobal() {
        const [globalAccPDA] = web3_js_1.PublicKey.findProgramAddressSync([buffer_1.Buffer.from(constant_1.GLOBAL_ACCOUNT_SEED)], new web3_js_1.PublicKey(constant_1.PUMPFUN_PROGRAM_ID));
        const tokenAcc = await this.connection.getAccountInfo(globalAccPDA, this.commitment);
        if (!tokenAcc) {
            throw new Error("Failed getting pumpfun global account.");
        }
        return utils_1.GlobalAccount.fromBuffer(tokenAcc.data);
    }
    /**
     * ABC = Associated Bonding Curve;
     * @param {PublicKey} token - Token public key
     * @returns {Promise<PublicKey>} Returns a bonding curve pubkey of the token
     */
    async getABC(token) {
        return await (0, spl_token_1.getAssociatedTokenAddress)(token, this.getBondingCurvePDA(token), true);
    }
    async getBondingCurveAccount(token) {
        const tokenAcc = await this.connection.getAccountInfo(this.getBondingCurvePDA(token), this.commitment);
        if (!tokenAcc) {
            throw new Error(`Bonding curve not found for: ${token.toBase58()}`);
        }
        return utils_1.BondingCurveAccount.fromBuffer(tokenAcc.data);
    }
    async createTokenMetadata(data) {
        const form = new FormData();
        form.append("file", data.image);
        form.append("name", data.name);
        form.append('symbol', data.symbol);
        form.append("description", data.description);
        form.append("twitter", data?.twitter ?? "");
        form.append("telegram", data?.telegram ?? "");
        form.append("website", data?.website ?? "");
        const res = await fetch("https://pump.fun/api/ipfs", {
            method: "POST",
            body: form
        });
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return await res.json();
    }
    async compileTradeInstruction(params, method) {
        const ABC = await this.getABC(params.token);
        const buyerTokenAcc = await (0, spl_token_1.getAssociatedTokenAddress)(params.token, params.trader, false);
        const globalAcc = await this.getPumpfunGlobal();
        if (method === "BUY") {
            return await this.program.methods
                .buy(new anchor_1.BN(params.amount), new anchor_1.BN(params.slippageCut))
                .accounts({
                feeRecipient: globalAcc.feeRecipient,
                mint: params.token,
                associatedBondingCurve: ABC,
                associatedUser: buyerTokenAcc,
                user: params.trader
            })
                .instruction();
        }
        else {
            return await this.program.methods
                .sell(new anchor_1.BN(params.amount), new anchor_1.BN(params.slippageCut))
                .accounts({
                feeRecipient: globalAcc.feeRecipient,
                mint: params.token,
                associatedBondingCurve: ABC,
                associatedUser: buyerTokenAcc,
                user: params.trader
            })
                .instruction();
        }
    }
    /**
     * @function listen
     *
     * @param {Events} event - Event type
     * @param {EventCallback<Events>} callback - Event callback
     * @returns {() => Promise<void>} Returns the remove listener function
     *
     * @example
     * // ...initialization codes
     *
     * const removeListener = fun.listen("createEvent", (event) => {
     *      console.log(event);
     * });
     *
     * // ...some codes
     *
     * await removeListener();
     */
    listen(event, callback) {
        const program = this.program;
        const listener = program.addEventListener(event, callback);
        const removeListener = async () => {
            await program.removeEventListener(listener);
        };
        return removeListener;
    }
    /**
     * @async
     * @function getTokenDataAPI
     *
     * @param { PublicKey } token - The assign token public key
     * @returns {Promise<TokenDataAPI>} Returns a Promise\<TokenDataAPI\> instance
     *
     * @example
     * // ...initialization codes
     *
     * const token = new PublicKey("token address");
     * const tokenData = await fun.getTokenDataAPI(token);
     *
     * console.log(tokenData);
     * // name, symbol, description, image_uri, metadata_uri, etc.
     */
    async getTokenDataAPI(token) {
        const url = "https://frontend-api.pump.fun/coins";
        const res = await fetch(`${url}/${token.toBase58()}`);
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return await res.json();
    }
    /**
     * @async
     * @function getBondingCurveData
     *
     * @param { PublicKey } bongingCurve - The assign bonding curve public key
     * @returns {Promise<{
     *      virtualTokenReserves: BN;
     *      virtualSolReserves: BN;
     *      realTokenReserves: BN;
     *      realSolReserves: BN;
     *      tokenTotalSupply: BN;
     *      complete: boolean;
     * }>} Returns a Promise\<BondingCurveData\> instance
     *
     * @example
     * // ...initialization codes
     *
     * const bondingCurve = new PublicKey("bonding curve address");
     * const bondingCurveData = await fun.getBondingCurveData(bondingCurve);
     *
     * console.log(bondingCurveData);
     * // virtualTokenReserves, virtualSolReserves, realTokenReserves, realSolReserves, tokenTotalSupply, complete
     */
    async getBondingCurveData(bongingCurve) {
        const data = await this.program.account.bondingCurve.fetch(bongingCurve);
        return data;
    }
    /**
     * @async
     * @function compileCreateTokenInstruction
     *
     * @param { CreateTokenInstructionParam } params
     * @prop { PublicKey } params.creator - Creator public key instance
     * @prop { TokenMeta } params.tokenMeta - Token metadata
     * @prop { Keypair } tokenMeta.keypair - Token keypair
     * @prop { string } tokenMeta.name - Token name
     * @prop { string } tokenMeta.symbol - Token symbol
     * @prop { string } tokenMeta.description - Token description
     * @prop { File } tokenMeta.image - Token image in File type
     * @prop { string } [tokenMeta.telegram] - Token telegram (mandatory)
     * @prop { string } [tokenMeta.twitter] - Token twitter (mandatory)
     * @prop { string } [tokenMeta.website] - Token website (mandatory)
     *
     * @returns {Promise<TransactionInstruction>} Returns a Promise\<TransactionInstruction\> instance
     *
     * @example
     * // ...initialization codes
     *
     * const creator = Keypair.generate();
     * const token = Keypair.generate();
     * const imagePath = fs.readFileSync("./image.jpg", {encoding: base64});
     * const tokenMetadata = {
     *      name: "MyToken",
     *      symbol: "MTK",
     *      description: "This is my token",
     *      image: new File([imagePath], "image.jpg"),
     *      ...socials if any
     * }
     *
     * const createInstruction = await fun.compileCreateTokenInstruction({
     *      creator: creator.publicKey,
     *      tokenMeta: {
     *          ...tokenMetadata,
     *          keypair: token
     *      }
     * });
     */
    async compileCreateTokenInstruction(params) {
        await this.checkRentExempt(params.creator);
        const token = params.tokenMeta.keypair;
        const metadataUri = await this.createTokenMetadata(params.tokenMeta);
        const mpl = new web3_js_1.PublicKey(constant_1.MPL_TOKEN_METADATA_PROGRAM_ID);
        const metadataPDA = this.getMetadataPDA(mpl, token.publicKey);
        const ABC = await this.getABC(token.publicKey);
        return await this.program.methods
            .create(params.tokenMeta.name, params.tokenMeta.symbol, metadataUri.metadataUri)
            .accounts({
            metadata: metadataPDA,
            associatedBondingCurve: ABC,
            user: params.creator,
            mint: token.publicKey
        })
            .signers([token])
            .instruction();
    }
    /**
     * @async
     * @function compileBuyInstruction<B>
     *
     * @param {BuyInstructionParam} params - Buy instruction parameter object
     *  - params.trader { PublicKey } - Trader public key
     *  - params.token { PublicKey } - Token public key
     *  - params.solAmount { bigint } - Token buy amount (in SOL)
     *
     * @param { boolean } isInitial - is initial buy transaction for token
     * @default false
     *
     * @returns {Promise<CompileBuyReturn<T>>} Returns a Promise\<TransactionInstruction[] | TransactionInstruction\> instance
     *
     * @example
     * // ...initialization codes
     *
     * const trader = Keypair.generate();
     * const token = new PublicKey("token address");
     * const buyAmount = 1 * LAMPORTS_PER_SOL;
     *
     * const buy = await fun.compileBuyInstruction({
     *      trader,
     *      token,
     *      solAmount: bigint(buyAmount)
     * }, true);
     *
     * // If true was passed, function will include createAssociatedTokenAccount along with
     * // the buy instruction [createATA, buyInstruct]
     *
     *  // with type annotation. Same return as above
        // fun.compileBuyInstruction<true>({
        //     solAmount: BigInt(1 * LAMPORTS_PER_SOL),
        //     token: token.publicKey,
        //     trader: creator.publicKey
        // })
     */
    async compileBuyInstruction(params, isInitial) {
        await this.checkRentExempt(params.trader);
        if (isInitial) {
            const globalAcc = await this.getPumpfunGlobal();
            const tokenPrice = globalAcc.getInitialBuyPrice(params.solAmount);
            const slippageCut = (0, utils_1.calculateSlippageBuy)(params.solAmount, this.slippageBasis);
            const ataInstruct = await this.createATAInstruct(params.trader, params.token);
            const buyInstruct = await this.compileTradeInstruction({
                token: params.token,
                trader: params.trader,
                amount: tokenPrice,
                slippageCut
            }, "BUY");
            return [ataInstruct, buyInstruct];
        }
        else {
            const bondingCurve = await this.getBondingCurveAccount(params.token);
            const tokenPrice = bondingCurve.getBuyPrice(params.solAmount);
            const slippageCut = (0, utils_1.calculateSlippageBuy)(params.solAmount, this.slippageBasis);
            return await this.compileTradeInstruction({
                token: params.token,
                trader: params.trader,
                amount: tokenPrice,
                slippageCut
            }, "BUY");
        }
    }
    /**
     * @async
     * @function compileSellInstruction
     *
     * @param {SellInstructionParam} params - Buy instruction parameter object
     * @prop { PublicKey } params.trader - Trader public key
     * @prop { PublicKey } params.token - Token public key
     * @prop { bigint } params.tokenAmount - Token sell amount (in Token)
     *
     * @returns {Promise<TransactionInstruction>} Returns a Promise\<TransactionInstruction\> instance
     *
     * @example
     * // ...initialization codes
     *
     * const trader = Keypair.generate();
     * const token = new PublicKey("token address");
     * const sellAmount = 1000000000n;
     *
     * const sell = await fun.compileBuyInstruction({
     *      trader,
     *      token,
     *      tokenAmount: bigint(sellAmount)
     * });
     */
    async compileSellInstruction(params) {
        const globalAcc = await this.getPumpfunGlobal();
        const bondingCurve = await this.getBondingCurveAccount(params.token);
        const solAmount = bondingCurve.getSellPrice(params.tokenAmount, globalAcc.feeBasisPoints);
        const slippageCut = (0, utils_1.calculateSlippageSell)(solAmount, this.slippageBasis);
        return await this.compileTradeInstruction({
            token: params.token,
            trader: params.trader,
            amount: params.tokenAmount,
            slippageCut
        }, "SELL");
    }
}
exports.default = Fun;
