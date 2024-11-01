# funsdk

A package for interacting with [pumpfun](https://pump.fun) fully typed.

> [!CAUTION]
> **THIS PACKAGE IS NOT PRODUCTION READY**\
> expect breaking changes in the future\

## Instalation

```bash
npm i funsdk # any package manager should work
```

## How to use

### Initiate

```ts
import { Fun } from 'funsdk';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl("mainnet-beta"));
const fun = new Fun(connection);
```

> [!WARNING]
> **RENT EXEMPTION CHECK IS INCLUDED IN THIS FUNCTION**
> Please ensure that the creator account has enough SOL for rent exemption
> before executing any transaction.

### Get Create Token Instruction

```ts
import { Fun, type TokenMeta } from 'funsdk';
import fs from 'fs';
import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';

// ... previous init code

const creator = Keypair.generate();
const token = Keypair.generate();

const imagePath = fs.readFileSync("./image.jpg", {encoding: "base64"});
const image = new File([imagePath], "image.jpg");

const tokenData: TokenMeta = {
    name: "ABC",
    symbol: "DEF",
    description: "GHI",
    image,
    keypair: token
    // socials if any...
};

/** 
 * If insufficient SOL is provided, the function will throw an error
 * 
 * This will return a TransactionInstruction instance
 * so you can freely assign the instruction to any type
 * of transaction that you like.
 * 
 * ex. Transaction | VersionedTransaction
 * **/
const createInstruct = await fun.compileCreateTokenInstruction({
    creator: creator.publicKey,
    tokenData
});
```

> [!WARNING]
> **RENT EXEMPTION CHECK IS INCLUDED IN THIS FUNCTION**
> 
> Please ensure that the creator account has enough SOL for rent exemption
> before executing any transaction.

### Get token buy instruction

```ts
import { Fun } from 'funsdk';
import fs from 'fs';
import { Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

// ... previous init code
// ... previous create code

const buyAmount = Bigint(1 * LAMPORTS_PER_SOL);

/** 
 * If insufficient SOL is provided, the function will throw an error
 * If the token bonding curve account is not found, the function will throw an error
 * 
 * Same return value as before 
 * **/
const buyInstruct = await fun.compileBuyInstruction({
    trader: creator.publicKey,
    token: token.publicKey,
    solAmount: buyAmount
}, true); // set to true if this is the initial token buy, else empty

// If true was passed, function will include createAssociatedTokenAccount along with
// the buy instruction [createATA, buyInstruct]
     
// with type annotation. Same return as above
// fun.compileBuyInstruction<true>({
//     solAmount: BigInt(1 * LAMPORTS_PER_SOL),
//     token: token.publicKey,
//     trader: creator.publicKey
// })
```

### Get token sell instruction

```ts
import { Fun } from 'funsdk';
import fs from 'fs';
import { Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

// ... previous init code
// ... previous create code

// Preferably build a function that fetches your token balance
// and do some calculations for the sell amount
const sellAmount = 1000000n;

/** 
 * Same return value as before
 * 
 * this will return Error if the token bonding curve account
 * is not found
 *  **/
const sellInstruct = await fun.compileSellInstruction({
    trader: creator.publicKey,
    token: token.publicKey,
    tokenAmount: sellAmount
}, true);
```

### Listen to events

```ts
// ... previous init code

const removeListener = fun.listen("createEvent", (event) => {
    console.log(event);
});

// ... some codes

await removeListener();
```

## API

``.compileCreateTokenInstruction``
Use to compile a create token instruction for pumpfun program

- async
- Params [object]
  - creator: [PublicKey]
  - tokenMeta: [object]
    - name: [string]
    - symbol: [string]
    - description: [string]
    - image: [File]
    - twitter?: [string]
    - telegram?: [string]
    - website?: [string]

``.compileBuyInstruction``
Use to compile a buy token instruction for pumpfun program

- async
- Params [object]
  - solAmount [bigint] - Buy value in sol amount
  - trader [PublicKey] - The assign trader public key
  - token [PublicKey] - The assign token public key
- isInitial [boolean] - is initial token buy
  - default false

``.compileSellInstruction``
Use to compile a sell token instruction for pumpfun program

- async
- Params [object]
  - tokenAmount [bigint] - Sell value in token amount
  - trader [PublicKey] - The assign trader public key
  - token [PublicKey] - The assign token public key

``.listen``
Use to listen to pumpfun events

- Params [object]
  - event [Events] - Event type
    - createEvent
    - tradeEvent
    - completeEvent
    - setParamsEvent
  - callback [function] - Event callback

## Types

```ts
interface CreateEvent {
    name: string;
    symbol: string;
    uri: string;
    mint: PublicKey;
    bondingCurve: PublicKey;
    user: PublicKey;
}

interface TradeEvent {
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

interface CompleteEvent {
    user: PublicKey;
    mint: PublicKey;
    bondingCurve: PublicKey;
    timestamp: BN;
}

interface SetParamsEvent {
    feeRecipient: PublicKey;
    initialVirtualTokenReserves: BN;
    initialVirtualSolReserves: BN;
    initialRealTokenReserves: BN;
    tokenTotalSupply: BN;
    feeBasisPoints: BN;
}

type Events = "createEvent" | "tradeEvent" | "completeEvent" | "setParamsEvent";

interface EventCallback<E extends Events> {
    (event: E extends "createEvent" ? CreateEvent : never): void;
    (event: E extends "tradeEvent" ? TradeEvent : never): void;
    (event: E extends "completeEvent" ? CompleteEvent : never): void;
    (event: E extends "setParamsEvent" ? SetParamsEvent : never): void;
}

interface TokenMetadataResponse {
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

interface TokenMeta {
    keypair: Keypair;
    name: string;
    symbol: string;
    image: File;
    description: string;
    telegram?: string;
    twitter?: string;
    website?: string;
}

interface CreateTokenInstructionParam {
    creator: PublicKey;
    tokenMeta: TokenMeta;
}

interface TradeInstructionParam {
    trader: PublicKey;
    token: PublicKey;
    amount: bigint;
    slippageCut: bigint;
}

interface BuyInstructionParam {
    trader: PublicKey;
    token: PublicKey;
    solAmount: bigint;
}

interface SellInstructionParam {
    trader: PublicKey;
    token: PublicKey;
    tokenAmount: bigint;
};
```

## Author

[on1force](https://github.com/on1force)

## License

MIT
