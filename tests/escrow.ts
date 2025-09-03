import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlueshiftAnchorEscrow } from "../target/types/blueshift_anchor_escrow";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { TEST_CONFIG, TEST_ERRORS, ESCROW_SEEDS } from "./constants";

interface TokenAccountParams {
  mintA: PublicKey;
  mintB: PublicKey;
  escrowPda: PublicKey;
  maker: PublicKey;
  taker: PublicKey;
}

interface TestScenario {
  SEED: BN;
  DEPOSIT_AMOUNT: BN;
  RECEIVE_AMOUNT: BN;
  TOKEN_DECIMALS: number;
  AIRDROP_AMOUNT: number;
}

describe("Escrow Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .BlueshiftAnchorEscrow as Program<BlueshiftAnchorEscrow>;

  // Test accounts
  let maker: anchor.web3.Keypair;
  let taker: anchor.web3.Keypair;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let testFixture: EscrowTestFixture;

  // Helper functions
  const deriveEscrowPda = (maker: PublicKey, seed: BN): PublicKey => {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(ESCROW_SEEDS.ESCROW),
        maker.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    return escrowPda;
  };

  const createTestScenario = (
    overrides: Partial<TestScenario> = {}
  ): TestScenario => ({
    ...TEST_CONFIG,
    ...overrides,
  });

  /**
   * Test fixture for common escrow operations
   * Provides reusable methods for setting up and executing escrow scenarios
   */
  class EscrowTestFixture {
    private mintA: PublicKey;
    private mintB: PublicKey;

    constructor(mintA: PublicKey, mintB: PublicKey) {
      this.mintA = mintA;
      this.mintB = mintB;
    }

    /**
     * Creates an escrow with pre-minted tokens for the maker
     * @param maker - The maker's keypair
     * @param seed - Unique seed for escrow PDA
     * @param receiveAmount - Amount maker expects to receive
     * @param depositAmount - Amount maker deposits
     * @returns Transaction signature and escrow PDA
     */
    async createEscrowWithTokens(
      maker: anchor.web3.Keypair,
      seed: BN,
      receiveAmount: BN,
      depositAmount: BN
    ) {
      // Mint tokens to maker
      await mintTokensToAccount(
        this.mintA,
        maker,
        maker.publicKey,
        depositAmount.toNumber()
      );

      // Create escrow
      const txSignature = await createEscrow(
        maker,
        seed,
        receiveAmount,
        depositAmount
      );
      const escrowPda = deriveEscrowPda(maker.publicKey, seed);

      return { txSignature, escrowPda };
    }

    async setupCompleteExchange(
      maker: anchor.web3.Keypair,
      taker: anchor.web3.Keypair,
      seed: BN,
      receiveAmount: BN,
      depositAmount: BN
    ) {
      // Setup maker's escrow
      const { escrowPda } = await this.createEscrowWithTokens(
        maker,
        seed,
        receiveAmount,
        depositAmount
      );

      // Mint tokens to taker
      await mintTokensToAccount(
        this.mintB,
        taker,
        taker.publicKey,
        receiveAmount.toNumber()
      );

      return { escrowPda };
    }
  }

  const createEscrow = async (
    maker: anchor.web3.Keypair,
    seed: BN,
    receiveAmount: BN,
    depositAmount: BN
  ) => {
    const escrowPda = deriveEscrowPda(maker.publicKey, seed);
    const makerAtaA = await getAssociatedTokenAddress(mintA, maker.publicKey);
    const vault = await getAssociatedTokenAddress(mintA, escrowPda, true);

    const accounts = {
      maker: maker.publicKey,
      mintA,
      mintB,
      makerAtaA,
      vault,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    };

    return await program.methods
      .make(seed, receiveAmount, depositAmount)
      .accounts(accounts)
      .signers([maker])
      .rpc();
  };

  const setupEscrowForRefund = async (seed: BN) => {
    // Mint tokens to maker for this test
    const makerAtaA = await getAssociatedTokenAddress(mintA, maker.publicKey);
    await mintTo(
      provider.connection,
      maker,
      mintA,
      makerAtaA,
      maker.publicKey,
      TEST_CONFIG.DEPOSIT_AMOUNT.toNumber()
    );

    // Create escrow
    await createEscrow(
      maker,
      seed,
      TEST_CONFIG.RECEIVE_AMOUNT,
      TEST_CONFIG.DEPOSIT_AMOUNT
    );

    return deriveEscrowPda(maker.publicKey, seed);
  };

  const verifyEscrowClosed = async (escrowPda: PublicKey) => {
    try {
      await program.account.escrow.fetch(escrowPda);
      assert.fail("Escrow should be closed");
    } catch (err) {
      assert.include(err.toString(), TEST_ERRORS.ACCOUNT_NOT_FOUND);
    }
  };

  const expectError = async (
    operation: () => Promise<any>,
    expectedError: string,
    shouldLog = false
  ) => {
    try {
      await operation();
      assert.fail(`Expected operation to fail with "${expectedError}"`);
    } catch (err: any) {
      const errorMessage = err?.toString() ?? "Unknown error";

      if (shouldLog) {
        console.log("Caught expected error:", errorMessage);
      }

      // Check for various error formats
      const hasExpectedError =
        errorMessage.includes(expectedError) ||
        err?.error?.errorCode?.code === expectedError ||
        err?.logs?.some((log: string) => log.includes(expectedError));

      assert.isTrue(
        hasExpectedError,
        `Expected error containing "${expectedError}", but got: ${errorMessage}`
      );
    }
  };

  // Helper methods for better organization
  const setupMakerTokens = async (amount: BN) => {
    return await mintTokensToAccount(
      mintA,
      maker,
      maker.publicKey,
      amount.toNumber()
    );
  };

  const setupEscrowPdas = async (seed: BN) => {
    const escrowPda = deriveEscrowPda(maker.publicKey, seed);
    const vaultPda = await getAssociatedTokenAddress(mintA, escrowPda, true);
    return { escrowPda, vaultPda };
  };

  const verifyEscrowState = async (
    escrowPda: PublicKey,
    expectedMaker: PublicKey,
    scenario: typeof TEST_CONFIG
  ) => {
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.maker.toString(), expectedMaker.toString());
    assert.equal(escrowAccount.mintA.toString(), mintA.toString());
    assert.equal(escrowAccount.mintB.toString(), mintB.toString());
    assert.equal(
      escrowAccount.receive.toString(),
      scenario.RECEIVE_AMOUNT.toString()
    );
    assert.equal(escrowAccount.seed.toString(), scenario.SEED.toString());
    return escrowAccount;
  };

  const verifyVaultBalance = async (
    vaultPda: PublicKey,
    expectedAmount: BN
  ) => {
    const vaultAccount = await getAccount(provider.connection, vaultPda);
    assert.equal(vaultAccount.amount.toString(), expectedAmount.toString());
  };

  const mintTokensToAccount = async (
    mint: PublicKey,
    authority: anchor.web3.Keypair,
    recipient: PublicKey,
    amount: number
  ) => {
    // Create ATA and mint tokens in one go
    const ata = await createAssociatedTokenAccount(
      provider.connection,
      authority, // payer
      mint,
      recipient // owner
    );

    await mintTo(
      provider.connection,
      authority,
      mint,
      ata,
      authority.publicKey,
      amount
    );

    return ata;
  };

  const takeEscrow = async (
    taker: anchor.web3.Keypair,
    escrowPda: PublicKey
  ) => {
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    const accounts = await deriveTokenAccountsForTake(
      escrowAccount,
      escrowPda,
      taker
    );

    return await program.methods
      .take()
      .accounts({
        taker: taker.publicKey,
        escrow: escrowPda,
        mintA: escrowAccount.mintA,
        mintB: escrowAccount.mintB,
        vault: accounts.vault,
        takerAtaA: accounts.takerAtaA,
        takerAtaB: accounts.takerAtaB,
        makerAtaB: accounts.makerAtaB,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taker])
      .rpc();
  };

  const deriveTokenAccountsForTake = async (
    escrowAccount: any,
    escrowPda: PublicKey,
    taker: anchor.web3.Keypair
  ) => {
    const accounts = await deriveAllTokenAccounts({
      mintA: escrowAccount.mintA,
      mintB: escrowAccount.mintB,
      escrowPda,
      maker: escrowAccount.maker,
      taker: taker.publicKey,
    });

    return {
      vault: accounts.vault,
      takerAtaA: accounts.takerAtaA,
      takerAtaB: accounts.takerAtaB,
      makerAtaB: accounts.makerAtaB,
    };
  };

  const deriveAllTokenAccounts = async (params: TokenAccountParams) => {
    const { mintA, mintB, escrowPda, maker, taker } = params;

    const [vault, takerAtaA, takerAtaB, makerAtaB] = await Promise.all([
      getAssociatedTokenAddress(mintA, escrowPda, true),
      getAssociatedTokenAddress(mintA, taker),
      getAssociatedTokenAddress(mintB, taker),
      getAssociatedTokenAddress(mintB, maker),
    ]);

    return { vault, takerAtaA, takerAtaB, makerAtaB };
  };

  before(async () => {
    await setupTestEnvironment();
  });

  const setupTestEnvironment = async () => {
    // Generate keypairs
    maker = anchor.web3.Keypair.generate();
    taker = anchor.web3.Keypair.generate();

    // Setup accounts and mints in parallel
    const [mintA_created, mintB_created] = await Promise.all([
      setupAccountWithMint(maker),
      setupAccountWithMint(taker),
    ]);

    mintA = mintA_created;
    mintB = mintB_created;

    // Initialize test fixture
    testFixture = new EscrowTestFixture(mintA, mintB);
  };

  const setupAccountWithMint = async (keypair: anchor.web3.Keypair) => {
    // Request airdrop and wait for confirmation
    const airdropSignature = await provider.connection.requestAirdrop(
      keypair.publicKey,
      TEST_CONFIG.AIRDROP_AMOUNT
    );

    await provider.connection.confirmTransaction({
      signature: airdropSignature,
      ...(await provider.connection.getLatestBlockhash()),
    });

    // Create mint
    const mint = await createMint(
      provider.connection,
      keypair,
      keypair.publicKey,
      null,
      TEST_CONFIG.TOKEN_DECIMALS
    );

    return mint;
  };

  describe("Make Escrow", () => {
    it("should create escrow and deposit tokens", async () => {
      const scenario = createTestScenario();

      // Setup
      await setupMakerTokens(scenario.DEPOSIT_AMOUNT);
      const { escrowPda, vaultPda } = await setupEscrowPdas(scenario.SEED);

      // Execute
      const txSignature = await createEscrow(
        maker,
        scenario.SEED,
        scenario.RECEIVE_AMOUNT,
        scenario.DEPOSIT_AMOUNT
      );
      console.log("Make escrow tx:", txSignature);

      // Verify
      await verifyEscrowState(escrowPda, maker.publicKey, scenario);
      await verifyVaultBalance(vaultPda, scenario.DEPOSIT_AMOUNT);
    });

    it("should fail with invalid amount", async () => {
      const scenario = createTestScenario();
      const invalidSeed = new BN(999);

      await expectError(
        () =>
          createEscrow(
            maker,
            invalidSeed,
            new BN(0), // Invalid receive amount
            scenario.DEPOSIT_AMOUNT
          ),
        TEST_ERRORS.INVALID_AMOUNT
      );
    });
  });

  describe("Take Escrow", () => {
    it("should complete the token exchange", async () => {
      const scenario = createTestScenario();

      // Setup: Get token accounts and mint tokens to taker
      const takerAtaA = await getAssociatedTokenAddress(mintA, taker.publicKey);
      const makerAtaB = await getAssociatedTokenAddress(mintB, maker.publicKey);

      await mintTokensToAccount(
        mintB,
        taker,
        taker.publicKey,
        scenario.RECEIVE_AMOUNT.toNumber()
      );

      // Execute: Take escrow
      const escrowPda = deriveEscrowPda(maker.publicKey, scenario.SEED);
      const txSignature = await takeEscrow(taker, escrowPda);
      console.log("Take escrow tx:", txSignature);

      // Verify: Token exchange completed
      const takerAccountA = await getAccount(provider.connection, takerAtaA);
      assert.equal(
        takerAccountA.amount.toString(),
        scenario.DEPOSIT_AMOUNT.toString()
      );

      const makerAccountB = await getAccount(provider.connection, makerAtaB);
      assert.equal(
        makerAccountB.amount.toString(),
        scenario.RECEIVE_AMOUNT.toString()
      );

      // Verify: Escrow is closed
      await verifyEscrowClosed(escrowPda);
    });
  });

  describe("Refund Escrow", () => {
    let refundSeed: BN;
    let refundEscrowPda: PublicKey;

    before(async () => {
      refundSeed = new BN(123);
      refundEscrowPda = await setupEscrowForRefund(refundSeed);
    });

    it("should allow maker to refund", async () => {
      const makerAtaA = await getAssociatedTokenAddress(mintA, maker.publicKey);
      const balanceBefore = await getAccount(provider.connection, makerAtaA);
      const escrowAccount = await program.account.escrow.fetch(refundEscrowPda);

      const vault = await getAssociatedTokenAddress(
        escrowAccount.mintA,
        refundEscrowPda,
        true
      );

      const tx = await program.methods
        .refund()
        .accounts({
          maker: maker.publicKey,
          escrow: refundEscrowPda,
          mintA: escrowAccount.mintA,
          vault: vault,
          makerAtaA: makerAtaA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc();

      console.log("Refund escrow tx:", tx);

      // Verify tokens returned to maker
      const balanceAfter = await getAccount(provider.connection, makerAtaA);
      const expectedBalance =
        balanceBefore.amount + BigInt(TEST_CONFIG.DEPOSIT_AMOUNT.toNumber());
      assert.equal(balanceAfter.amount.toString(), expectedBalance.toString());

      // Verify escrow is closed
      await verifyEscrowClosed(refundEscrowPda);
    });

    // Note: The program has built-in constraints that prevent non-makers from refunding
    // The constraint `has_one = maker @ EscrowError::InvalidMaker` ensures only the
    // original maker can call the refund function. This is enforced at the program level.
  });
});
