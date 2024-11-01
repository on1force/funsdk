var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// index.ts
var exports_funsdk = {};
__export(exports_funsdk, {
  Fun: () => pumpfun_default2
});
module.exports = __toCommonJS(exports_funsdk);

// constant/index.ts
var MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
var PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
var GLOBAL_ACCOUNT_SEED = "global";
var BONDING_CURVE_SEED = "bonding-curve";
var METADATA_SEED = "metadata";
var DEFAULT_COMMITMENT = "finalized";
var DEFAULT_SLIPPAGE_BASIS = 500n;

// utils/bonding.ts
var import_borsh = require("@coral-xyz/borsh");

class BondingCurveAccount {
  discriminator;
  virtualTokenReserves;
  virtualSolReserves;
  realTokenReserves;
  realSolReserves;
  tokenTotalSupply;
  complete;
  constructor(discriminator, virtualTokenReserves, virtualSolReserves, realTokenReserves, realSolReserves, tokenTotalSupply, complete) {
    this.discriminator = discriminator;
    this.virtualTokenReserves = virtualTokenReserves;
    this.virtualSolReserves = virtualSolReserves;
    this.realTokenReserves = realTokenReserves;
    this.realSolReserves = realSolReserves;
    this.tokenTotalSupply = tokenTotalSupply;
    this.complete = complete;
  }
  getBuyPrice(amount) {
    if (this.complete) {
      throw new Error("Curve is complete");
    }
    if (amount <= 0n) {
      return 0n;
    }
    let n = this.virtualSolReserves * this.virtualTokenReserves;
    let i = this.virtualSolReserves + amount;
    let r = n / i + 1n;
    let s = this.virtualTokenReserves - r;
    return s < this.realTokenReserves ? s : this.realTokenReserves;
  }
  getSellPrice(amount, feeBasisPoints) {
    if (this.complete) {
      throw new Error("Curve is complete");
    }
    if (amount <= 0n) {
      return 0n;
    }
    let n = amount * this.virtualSolReserves / (this.virtualTokenReserves + amount);
    let a = n * feeBasisPoints / 10000n;
    return n - a;
  }
  getMarketCapSOL() {
    if (this.virtualTokenReserves === 0n) {
      return 0n;
    }
    return this.tokenTotalSupply * this.virtualSolReserves / this.virtualTokenReserves;
  }
  getFinalMarketCapSOL(feeBasisPoints) {
    let totalSellValue = this.getBuyOutPrice(this.realTokenReserves, feeBasisPoints);
    let totalVirtualValue = this.virtualSolReserves + totalSellValue;
    let totalVirtualTokens = this.virtualTokenReserves - this.realTokenReserves;
    if (totalVirtualTokens === 0n) {
      return 0n;
    }
    return this.tokenTotalSupply * totalVirtualValue / totalVirtualTokens;
  }
  getBuyOutPrice(amount, feeBasisPoints) {
    let solTokens = amount < this.realSolReserves ? this.realSolReserves : amount;
    let totalSellValue = solTokens * this.virtualSolReserves / (this.virtualTokenReserves - solTokens) + 1n;
    let fee = totalSellValue * feeBasisPoints / 10000n;
    return totalSellValue + fee;
  }
  static fromBuffer(buffer) {
    const structure = import_borsh.struct([
      import_borsh.u64("discriminator"),
      import_borsh.u64("virtualTokenReserves"),
      import_borsh.u64("virtualSolReserves"),
      import_borsh.u64("realTokenReserves"),
      import_borsh.u64("realSolReserves"),
      import_borsh.u64("tokenTotalSupply"),
      import_borsh.bool("complete")
    ]);
    let value = structure.decode(buffer);
    return new BondingCurveAccount(BigInt(value.discriminator), BigInt(value.virtualTokenReserves), BigInt(value.virtualSolReserves), BigInt(value.realTokenReserves), BigInt(value.realSolReserves), BigInt(value.tokenTotalSupply), value.complete);
  }
}
// utils/global-account.ts
var import_borsh2 = require("@coral-xyz/borsh");

class GlobalAccount {
  discriminator;
  initialized = false;
  authority;
  feeRecipient;
  initialVirtualTokenReserves;
  initialVirtualSolReserves;
  initialRealTokenReserves;
  tokenTotalSupply;
  feeBasisPoints;
  constructor(discriminator, initialized, authority, feeRecipient, initialVirtualTokenReserves, initialVirtualSolReserves, initialRealTokenReserves, tokenTotalSupply, feeBasisPoints) {
    this.discriminator = discriminator;
    this.initialized = initialized;
    this.authority = authority;
    this.feeRecipient = feeRecipient;
    this.initialVirtualTokenReserves = initialVirtualTokenReserves;
    this.initialVirtualSolReserves = initialVirtualSolReserves;
    this.initialRealTokenReserves = initialRealTokenReserves;
    this.tokenTotalSupply = tokenTotalSupply;
    this.feeBasisPoints = feeBasisPoints;
  }
  getInitialBuyPrice(amount) {
    if (amount <= 0n) {
      return 0n;
    }
    let n = this.initialVirtualSolReserves * this.initialVirtualTokenReserves;
    let i = this.initialVirtualSolReserves + amount;
    let r = n / i + 1n;
    let s = this.initialVirtualTokenReserves - r;
    return s < this.initialRealTokenReserves ? s : this.initialRealTokenReserves;
  }
  static fromBuffer(buffer) {
    const structure = import_borsh2.struct([
      import_borsh2.u64("discriminator"),
      import_borsh2.bool("initialized"),
      import_borsh2.publicKey("authority"),
      import_borsh2.publicKey("feeRecipient"),
      import_borsh2.u64("initialVirtualTokenReserves"),
      import_borsh2.u64("initialVirtualSolReserves"),
      import_borsh2.u64("initialRealTokenReserves"),
      import_borsh2.u64("tokenTotalSupply"),
      import_borsh2.u64("feeBasisPoints")
    ]);
    let value = structure.decode(buffer);
    return new GlobalAccount(BigInt(value.discriminator), value.initialized, value.authority, value.feeRecipient, BigInt(value.initialVirtualTokenReserves), BigInt(value.initialVirtualSolReserves), BigInt(value.initialRealTokenReserves), BigInt(value.tokenTotalSupply), BigInt(value.feeBasisPoints));
  }
}
// utils/slippage.ts
var calculateSlippageBuy = (amount, basisPoints) => {
  return amount + amount * basisPoints / 10000n;
};
var calculateSlippageSell = (amount, basisPoints) => {
  return amount - amount * basisPoints / 10000n;
};
// pumpfun/index.ts
var import_anchor = require("@coral-xyz/anchor");
// IDL/pumpfun.json
var pumpfun_default = {
  address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  metadata: {
    name: "pump",
    version: "0.1.0",
    spec: "0.1.0"
  },
  instructions: [
    {
      name: "initialize",
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      docs: ["Creates the global state."],
      accounts: [
        {
          name: "global",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        }
      ],
      args: []
    },
    {
      name: "setParams",
      discriminator: [165, 31, 134, 53, 189, 180, 130, 255],
      docs: ["Sets the global state parameters."],
      accounts: [
        {
          name: "global",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          address: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
        },
        {
          name: "program",
          address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
        }
      ],
      args: [
        {
          name: "feeRecipient",
          type: "pubkey"
        },
        {
          name: "initialVirtualTokenReserves",
          type: "u64"
        },
        {
          name: "initialVirtualSolReserves",
          type: "u64"
        },
        {
          name: "initialRealTokenReserves",
          type: "u64"
        },
        {
          name: "tokenTotalSupply",
          type: "u64"
        },
        {
          name: "feeBasisPoints",
          type: "u64"
        }
      ]
    },
    {
      name: "create",
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119],
      docs: ["Creates a new coin and bonding curve."],
      accounts: [
        {
          name: "mint",
          writable: true,
          signer: true
        },
        {
          name: "mint_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109,
                  105,
                  110,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "bonding_curve",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                kind: "account",
                path: "mint"
              }
            ]
          }
        },
        {
          name: "associated_bonding_curve",
          writable: true,
          signer: false
        },
        {
          name: "global",
          writable: false,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          name: "mpl_token_metadata",
          address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        },
        {
          name: "metadata",
          writable: true,
          signer: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "rent",
          address: "SysvarRent111111111111111111111111111111111"
        },
        {
          name: "event_authority",
          address: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
        },
        {
          name: "program",
          address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
        }
      ],
      args: [
        {
          name: "name",
          type: "string"
        },
        {
          name: "symbol",
          type: "string"
        },
        {
          name: "uri",
          type: "string"
        }
      ]
    },
    {
      name: "buy",
      discriminator: [102, 6, 61, 18, 1, 218, 235, 234],
      docs: ["Buys tokens from a bonding curve."],
      accounts: [
        {
          name: "global",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          name: "fee_recipient",
          writable: true,
          signer: false
        },
        {
          name: "mint",
          writable: false,
          signer: false
        },
        {
          name: "bonding_curve",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                kind: "account",
                path: "mint"
              }
            ]
          }
        },
        {
          name: "associated_bonding_curve",
          writable: true,
          signer: false
        },
        {
          name: "associated_user",
          writable: true,
          signer: false
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "rent",
          address: "SysvarRent111111111111111111111111111111111"
        },
        {
          name: "event_authority",
          address: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
        },
        {
          name: "program",
          address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        },
        {
          name: "maxSolCost",
          type: "u64"
        }
      ]
    },
    {
      name: "sell",
      discriminator: [51, 230, 133, 164, 1, 127, 131, 173],
      docs: ["Sells tokens into a bonding curve."],
      accounts: [
        {
          name: "global",
          writable: false,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          name: "feeRecipient",
          writable: true,
          signer: false
        },
        {
          name: "mint",
          writable: false,
          signer: false
        },
        {
          name: "bonding_curve",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                kind: "account",
                path: "mint"
              }
            ]
          }
        },
        {
          name: "associatedBondingCurve",
          writable: true,
          signer: false
        },
        {
          name: "associatedUser",
          writable: true,
          signer: false
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "event_authority",
          address: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
        },
        {
          name: "program",
          address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        },
        {
          name: "minSolOutput",
          type: "u64"
        }
      ]
    },
    {
      name: "withdraw",
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      docs: [
        "Allows the admin to withdraw liquidity for a migration once the bonding curve completes"
      ],
      accounts: [
        {
          name: "global",
          writable: false,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          name: "lastWithdraw",
          writable: true,
          signer: false
        },
        {
          name: "mint",
          writable: false,
          signer: false
        },
        {
          name: "bonding_curve",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                kind: "account",
                path: "mint"
              }
            ]
          }
        },
        {
          name: "associatedBondingCurve",
          writable: true,
          signer: false
        },
        {
          name: "associatedUser",
          writable: true,
          signer: false
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "rent",
          address: "SysvarRent111111111111111111111111111111111"
        },
        {
          name: "event_authority",
          address: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
        },
        {
          name: "program",
          address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "BondingCurve",
      discriminator: [
        23,
        183,
        248,
        55,
        96,
        216,
        172,
        96
      ]
    },
    {
      name: "Global",
      discriminator: [
        167,
        232,
        232,
        177,
        200,
        108,
        114,
        127
      ]
    }
  ],
  events: [
    {
      name: "CreateEvent",
      discriminator: [27, 114, 169, 77, 222, 235, 99, 118]
    },
    {
      name: "TradeEvent",
      discriminator: [189, 219, 127, 211, 78, 230, 97, 238]
    },
    {
      name: "CompleteEvent",
      discriminator: [95, 114, 97, 156, 212, 46, 152, 8]
    },
    {
      name: "SetParamsEvent",
      discriminator: [223, 195, 159, 246, 62, 48, 143, 131]
    }
  ],
  types: [
    {
      name: "Global",
      type: {
        kind: "struct",
        fields: [
          {
            name: "initialized",
            type: "bool"
          },
          {
            name: "authority",
            type: "pubkey"
          },
          {
            name: "feeRecipient",
            type: "pubkey"
          },
          {
            name: "initialVirtualTokenReserves",
            type: "u64"
          },
          {
            name: "initialVirtualSolReserves",
            type: "u64"
          },
          {
            name: "initialRealTokenReserves",
            type: "u64"
          },
          {
            name: "tokenTotalSupply",
            type: "u64"
          },
          {
            name: "feeBasisPoints",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "LastWithdraw",
      type: {
        kind: "struct",
        fields: [
          {
            name: "lastWithdrawTimestamp",
            type: "i64"
          }
        ]
      }
    },
    {
      name: "BondingCurve",
      type: {
        kind: "struct",
        fields: [
          {
            name: "virtualTokenReserves",
            type: "u64"
          },
          {
            name: "virtualSolReserves",
            type: "u64"
          },
          {
            name: "realTokenReserves",
            type: "u64"
          },
          {
            name: "realSolReserves",
            type: "u64"
          },
          {
            name: "tokenTotalSupply",
            type: "u64"
          },
          {
            name: "complete",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "CreateEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string",
            index: false
          },
          {
            name: "symbol",
            type: "string",
            index: false
          },
          {
            name: "uri",
            type: "string",
            index: false
          },
          {
            name: "mint",
            type: "pubkey",
            index: false
          },
          {
            name: "bondingCurve",
            type: "pubkey",
            index: false
          },
          {
            name: "user",
            type: "pubkey",
            index: false
          }
        ]
      }
    },
    {
      name: "TradeEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "mint",
            type: "pubkey",
            index: false
          },
          {
            name: "solAmount",
            type: "u64",
            index: false
          },
          {
            name: "tokenAmount",
            type: "u64",
            index: false
          },
          {
            name: "isBuy",
            type: "bool",
            index: false
          },
          {
            name: "user",
            type: "pubkey",
            index: false
          },
          {
            name: "timestamp",
            type: "i64",
            index: false
          },
          {
            name: "virtualSolReserves",
            type: "u64",
            index: false
          },
          {
            name: "virtualTokenReserves",
            type: "u64",
            index: false
          },
          {
            name: "realSolReserves",
            type: "u64",
            index: false
          },
          {
            name: "realTokenReserves",
            type: "u64",
            index: false
          }
        ]
      }
    },
    {
      name: "CompleteEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey",
            index: false
          },
          {
            name: "mint",
            type: "pubkey",
            index: false
          },
          {
            name: "bondingCurve",
            type: "pubkey",
            index: false
          },
          {
            name: "timestamp",
            type: "i64",
            index: false
          }
        ]
      }
    },
    {
      name: "SetParamsEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "feeRecipient",
            type: "pubkey",
            index: false
          },
          {
            name: "initialVirtualTokenReserves",
            type: "u64",
            index: false
          },
          {
            name: "initialVirtualSolReserves",
            type: "u64",
            index: false
          },
          {
            name: "initialRealTokenReserves",
            type: "u64",
            index: false
          },
          {
            name: "tokenTotalSupply",
            type: "u64",
            index: false
          },
          {
            name: "feeBasisPoints",
            type: "u64",
            index: false
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: "NotAuthorized",
      msg: "The given account is not authorized to execute this instruction."
    },
    {
      code: 6001,
      name: "AlreadyInitialized",
      msg: "The program is already initialized."
    },
    {
      code: 6002,
      name: "TooMuchSolRequired",
      msg: "slippage: Too much SOL required to buy the given amount of tokens."
    },
    {
      code: 6003,
      name: "TooLittleSolReceived",
      msg: "slippage: Too little SOL received to sell the given amount of tokens."
    },
    {
      code: 6004,
      name: "MintDoesNotMatchBondingCurve",
      msg: "The mint does not match the bonding curve."
    },
    {
      code: 6005,
      name: "BondingCurveComplete",
      msg: "The bonding curve has completed and liquidity migrated to raydium."
    },
    {
      code: 6006,
      name: "BondingCurveNotComplete",
      msg: "The bonding curve has not completed."
    },
    {
      code: 6007,
      name: "NotInitialized",
      msg: "The program is not initialized."
    },
    {
      code: 6008,
      name: "WithdrawTooFrequent",
      msg: "Withdraw too frequent"
    }
  ]
};

// IDL/index.ts
var IDL = pumpfun_default;

// pumpfun/index.ts
var import_web3 = require("@solana/web3.js");
var import_spl_token = require("@solana/spl-token");

class Fun {
  program;
  connection;
  commitment = DEFAULT_COMMITMENT;
  slippageBasis = DEFAULT_SLIPPAGE_BASIS;
  constructor(connection, user) {
    const provider = {
      connection,
      publicKey: user
    };
    this.program = new import_anchor.Program(IDL, provider);
    this.connection = connection;
  }
  getBondingCurvePDA(token) {
    return import_web3.PublicKey.findProgramAddressSync([Buffer.from(BONDING_CURVE_SEED), token.toBuffer()], this.program.programId)[0];
  }
  getMetadataPDA(mpl, token) {
    const [metadataPDA] = import_web3.PublicKey.findProgramAddressSync([
      Buffer.from(METADATA_SEED),
      mpl.toBuffer(),
      token.toBuffer()
    ], mpl);
    return metadataPDA;
  }
  async checkRentExempt(trader) {
    const rentExemptBalance = await this.connection.getMinimumBalanceForRentExemption(import_spl_token.AccountLayout.span);
    const traderBalance = await this.connection.getBalance(trader);
    if (traderBalance < rentExemptBalance) {
      throw new Error(`${trader.toBase58()} account has insufficient funds for rent exemption. Required: ${rentExemptBalance}, Available: ${traderBalance}`);
    }
    return true;
  }
  async createATAInstruct(owner, token) {
    const atad = await import_spl_token.getAssociatedTokenAddress(token, owner, false);
    const createAta = import_spl_token.createAssociatedTokenAccountInstruction(owner, atad, owner, token);
    return createAta;
  }
  async getPumpfunGlobal() {
    const [globalAccPDA] = import_web3.PublicKey.findProgramAddressSync([Buffer.from(GLOBAL_ACCOUNT_SEED)], new import_web3.PublicKey(PUMPFUN_PROGRAM_ID));
    const tokenAcc = await this.connection.getAccountInfo(globalAccPDA, this.commitment);
    if (!tokenAcc) {
      throw new Error("Failed getting pumpfun global account.");
    }
    return GlobalAccount.fromBuffer(tokenAcc.data);
  }
  async getABC(token) {
    return await import_spl_token.getAssociatedTokenAddress(token, this.getBondingCurvePDA(token), true);
  }
  async getBondingCurveAccount(token) {
    const tokenAcc = await this.connection.getAccountInfo(this.getBondingCurvePDA(token), this.commitment);
    if (!tokenAcc) {
      throw new Error(`Bonding curve not found for: ${token.toBase58()}`);
    }
    return BondingCurveAccount.fromBuffer(tokenAcc.data);
  }
  async createTokenMetadata(data) {
    const form = new FormData;
    form.append("file", data.image);
    form.append("name", data.name);
    form.append("symbol", data.symbol);
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
    const buyerTokenAcc = await import_spl_token.getAssociatedTokenAddress(params.token, params.trader, false);
    const globalAcc = await this.getPumpfunGlobal();
    if (method === "BUY") {
      return await this.program.methods.buy(new import_anchor.BN(params.amount), new import_anchor.BN(params.slippageCut)).accounts({
        feeRecipient: globalAcc.feeRecipient,
        mint: params.token,
        associatedBondingCurve: ABC,
        associatedUser: buyerTokenAcc,
        user: params.trader
      }).instruction();
    } else {
      return await this.program.methods.sell(new import_anchor.BN(params.amount), new import_anchor.BN(params.slippageCut)).accounts({
        feeRecipient: globalAcc.feeRecipient,
        mint: params.token,
        associatedBondingCurve: ABC,
        associatedUser: buyerTokenAcc,
        user: params.trader
      }).instruction();
    }
  }
  listen(event, callback) {
    const program = this.program;
    const listener = program.addEventListener(event, callback);
    const removeListener = async () => {
      await program.removeEventListener(listener);
    };
    return removeListener;
  }
  async getTokenDataAPI(token) {
    const url = "https://frontend-api.pump.fun/coins";
    const res = await fetch(`${url}/${token.toBase58()}`);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return await res.json();
  }
  async getBondingCurveData(bongingCurve) {
    const data = await this.program.account.bondingCurve.fetch(bongingCurve);
    return data;
  }
  async compileCreateTokenInstruction(params) {
    await this.checkRentExempt(params.creator);
    const token = params.tokenMeta.keypair;
    const metadataUri = await this.createTokenMetadata(params.tokenMeta);
    const mpl = new import_web3.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
    const metadataPDA = this.getMetadataPDA(mpl, token.publicKey);
    const ABC = await this.getABC(token.publicKey);
    return await this.program.methods.create(params.tokenMeta.name, params.tokenMeta.symbol, metadataUri.metadataUri).accounts({
      metadata: metadataPDA,
      associatedBondingCurve: ABC,
      user: params.creator,
      mint: token.publicKey
    }).signers([token]).instruction();
  }
  async compileBuyInstruction(params, isInitial) {
    await this.checkRentExempt(params.trader);
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
      return [ataInstruct, buyInstruct];
    } else {
      const bondingCurve = await this.getBondingCurveAccount(params.token);
      const tokenPrice = bondingCurve.getBuyPrice(params.solAmount);
      const slippageCut = calculateSlippageBuy(params.solAmount, this.slippageBasis);
      return await this.compileTradeInstruction({
        token: params.token,
        trader: params.trader,
        amount: tokenPrice,
        slippageCut
      }, "BUY");
    }
  }
  async compileSellInstruction(params) {
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
var pumpfun_default2 = Fun;
