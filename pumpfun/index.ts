import {
    BONDING_CURVE_SEED,
    DEFAULT_COMMITMENT,
    DEFAULT_SLIPPAGE_BASIS,
    GLOBAL_ACCOUNT_SEED,
    METADATA_SEED,
    MPL_TOKEN_METADATA_PROGRAM_ID,
    PUMPFUN_PROGRAM_ID,
    type BuyInstructionParam,
    type CreateTokenInstructionParam,
    type SellInstructionParam,
    type TokenMeta,
    type TokenMetadataResponse,
    type TradeInstructionParam,
    type CompileBuyReturn,
} from "../constant";
import {
    GlobalAccount,
    BondingCurveAccount,
    calculateSlippageBuy,
    calculateSlippageSell
} from "../utils";
import { BN, Program, type Provider } from "@coral-xyz/anchor";
import { IDL, type PumpFun } from "../IDL";
import { PublicKey, TransactionInstruction, type Connection } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";


class Fun {
    private program: Program<PumpFun>;
    private connection: Connection;

    /**
     * Default commitment for the class - can be override.
     * @default "confirmed"
     *  
     * @example
     * // ...initialization codes
     * 
     * fun.commitment = "finalized"
     */
    public commitment = DEFAULT_COMMITMENT;

    /**
     * Default slippage basis points for the class - can be override.
     * 
     * @example
     * // ...initialization codes
     * 
     * fun.slippageBasis = 1000n; // or bigint(xyz)
     */
    public slippageBasis = DEFAULT_SLIPPAGE_BASIS;

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
    constructor(connection: Connection, user?: PublicKey) {
        const provider: Provider = {
            connection,
            publicKey: user
        }
        this.program = new Program<PumpFun>(IDL, provider);
        this.connection = connection;
    }

    private getBondingCurvePDA(token: PublicKey) {
        return PublicKey.findProgramAddressSync(
            [Buffer.from(BONDING_CURVE_SEED), token.toBuffer()],
            this.program.programId
        )[0];
    }

    private getMetadataPDA(mpl: PublicKey, token: PublicKey) {
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from(METADATA_SEED),
                mpl.toBuffer(),
                token.toBuffer()
            ],
            mpl
        );

        return metadataPDA;
    }

    private async createATAInstruct(owner: PublicKey, token: PublicKey) {
        const atad = await getAssociatedTokenAddress(
            token,
            owner,
            false
        );

        const createAta = createAssociatedTokenAccountInstruction(
            owner,
            atad,
            owner,
            token
        );

        return createAta;
    }

    private async getPumpfunGlobal() {
        const [globalAccPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from(GLOBAL_ACCOUNT_SEED)],
            new PublicKey(PUMPFUN_PROGRAM_ID)
        );

        const tokenAcc = await this.connection.getAccountInfo(
            globalAccPDA,
            this.commitment
        );

        if (!tokenAcc) {
            throw new Error("Failed getting pumpfun global account.");
        }

        return GlobalAccount.fromBuffer(tokenAcc.data)
    }

    /**
     * ABC = Associated Bonding Curve;
     * @param {PublicKey} token - Token public key
     * @returns {Promise<PublicKey>} Returns a bonding curve pubkey of the token
     */
    private async getABC(token: PublicKey) {
        return await getAssociatedTokenAddress(
            token,
            this.getBondingCurvePDA(token),
            true
        );
    }

    private async getBondingCurveAccount(token: PublicKey) {
        const tokenAcc = await this.connection.getAccountInfo(
            this.getBondingCurvePDA(token),
            this.commitment
        );

        if (!tokenAcc) {
            throw new Error(`Bonding curve not found for: ${token.toBase58()}`)
        }

        return BondingCurveAccount.fromBuffer(tokenAcc.data);
    }

    private async createTokenMetadata(data: TokenMeta) {
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

        return await res.json() as TokenMetadataResponse;
    }

    private async compileTradeInstruction(params: TradeInstructionParam, method: "BUY" | "SELL"): Promise<TransactionInstruction> {
        const ABC = await this.getABC(params.token);
        const buyerTokenAcc = await getAssociatedTokenAddress(params.token, params.trader, false);
        const globalAcc = await this.getPumpfunGlobal();

        if (method === "BUY") {
            return await this.program.methods
                .buy(new BN(params.amount), new BN(params.slippageCut))
                .accounts({
                    feeRecipient: globalAcc.feeRecipient,
                    mint: params.token,
                    associatedBondingCurve: ABC,
                    associatedUser: buyerTokenAcc,
                    user: params.trader
                })
                .instruction()
        } else {
            return await this.program.methods
                .sell(new BN(params.amount), new BN(params.slippageCut))
                .accounts({
                    feeRecipient: globalAcc.feeRecipient,
                    mint: params.token,
                    associatedBondingCurve: ABC,
                    associatedUser: buyerTokenAcc,
                    user: params.trader
                })
                .instruction()
        }
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
    public async compileCreateTokenInstruction(params: CreateTokenInstructionParam): Promise<TransactionInstruction> {
        const token = params.tokenMeta.keypair;
        const metadataUri = await this.createTokenMetadata(params.tokenMeta);

        const mpl = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
        const metadataPDA = this.getMetadataPDA(mpl, token.publicKey);
        const ABC = await this.getABC(token.publicKey);

        return await this.program.methods
            .create(
                params.tokenMeta.name,
                params.tokenMeta.symbol,
                metadataUri.metadataUri
            )
            .accounts({
                metadata: metadataPDA,
                associatedBondingCurve: ABC,
                user: params.creator,
                mint: token.publicKey
            })
            .signers([token])
            .instruction()
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
    public async compileBuyInstruction<B extends boolean = false>(params: BuyInstructionParam, isInitial: B): Promise<CompileBuyReturn<B>> {
        if (isInitial) {
            const globalAcc = await this.getPumpfunGlobal();
            const tokenPrice = globalAcc.getInitialBuyPrice(params.solAmount);
            const slippageCut = calculateSlippageBuy(params.solAmount, this.slippageBasis);

            const ataInstruct = await this.createATAInstruct(params.trader, params.token);
            const buyInstruct = await this.compileTradeInstruction({
                token: params.token,
                trader: params.trader,
                amount: tokenPrice,
                slippageCut
            }, "BUY");

            return [ataInstruct, buyInstruct] as CompileBuyReturn<B>;
        } else {
            const bondingCurve = await this.getBondingCurveAccount(params.token);
            const tokenPrice = bondingCurve.getBuyPrice(params.solAmount);
            const slippageCut = calculateSlippageBuy(params.solAmount, this.slippageBasis);

            return await this.compileTradeInstruction({
                token: params.token,
                trader: params.trader,
                amount: tokenPrice,
                slippageCut
            }, "BUY") as CompileBuyReturn<B>;
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
    public async compileSellInstruction(params: SellInstructionParam): Promise<TransactionInstruction> {
        const globalAcc = await this.getPumpfunGlobal();
        const bondingCurve = await this.getBondingCurveAccount(params.token);

        const solAmount = bondingCurve.getSellPrice(params.tokenAmount, globalAcc.feeBasisPoints);
        const slippageCut = calculateSlippageSell(solAmount, this.slippageBasis);

        return await this.compileTradeInstruction({
            token: params.token,
            trader: params.trader,
            amount: params.tokenAmount,
            slippageCut
        }, "SELL");
    }
}

export default Fun;