import { type Events, type BuyInstructionParam, type CreateTokenInstructionParam, type SellInstructionParam, type CompileBuyReturn, type EventCallback, type TokenDataAPI } from "../constant";
import { PublicKey, TransactionInstruction, type Connection } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";

declare class Fun {
    private program;
    private connection;
    /**
     * Default commitment for the class - can be override.
     * @default "confirmed"
     *
     * @example
     * // ...initialization codes
     *
     * fun.commitment = "finalized"
     */
    commitment: import("@solana/web3.js").Commitment;
    /**
     * Default slippage basis points for the class - can be override.
     *
     * @example
     * // ...initialization codes
     *
     * fun.slippageBasis = 1000n; // or bigint(xyz)
     */
    slippageBasis: bigint;
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
    constructor(connection: Connection, user?: PublicKey);
    private getBondingCurvePDA;
    private getMetadataPDA;
    private checkRentExempt;
    private createATAInstruct;
    private getPumpfunGlobal;
    /**
     * ABC = Associated Bonding Curve;
     * @param {PublicKey} token - Token public key
     * @returns {Promise<PublicKey>} Returns a bonding curve pubkey of the token
     */
    private getABC;
    private getBondingCurveAccount;
    private createTokenMetadata;
    private compileTradeInstruction;
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
    listen(event: Events, callback: EventCallback<Events>): () => Promise<void>;
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
    getTokenDataAPI(token: PublicKey): Promise<TokenDataAPI>;
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
    getBondingCurveData(bongingCurve: PublicKey): Promise<{
        virtualTokenReserves: BN;
        virtualSolReserves: BN;
        realTokenReserves: BN;
        realSolReserves: BN;
        tokenTotalSupply: BN;
        complete: boolean;
    }>;
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
    compileCreateTokenInstruction(params: CreateTokenInstructionParam): Promise<TransactionInstruction>;
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
    compileBuyInstruction<B extends boolean = false>(params: BuyInstructionParam, isInitial: B): Promise<CompileBuyReturn<B>>;
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
    compileSellInstruction(params: SellInstructionParam): Promise<TransactionInstruction>;
}
export default Fun;
