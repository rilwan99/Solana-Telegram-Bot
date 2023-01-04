import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TreehoppersContract } from "../target/types/treehoppers_contract";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram, Transaction, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";


describe("treehoppers-contract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TreehoppersContract as Program<TreehoppersContract>;

  // Define constants and functions to derive pda addresses
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  const lamports: number = MINT_SIZE;
  const mintAccount: Keypair = Keypair.generate();
  const owner = provider.wallet;
  const userAccount = Keypair.generate()

  // Variables storing Public keys of following accounts 
  let nftTokenAccount;
  let metadataAccount;
  let masterEditionAccount;

  const getMetadataAccount = async (mint_account: PublicKey): Promise<PublicKey> => {
    return (
      await PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint_account.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };
  const getMasterEditionAccount = async (mint_account: PublicKey): Promise<PublicKey> => {
    return (
      await PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint_account.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  it("Initialize User, Mint and Token accounts", async () => {
    
    const customConnection = new Connection(clusterApiUrl('devnet'))
    const airdrop = await customConnection.requestAirdrop(userAccount.publicKey, 2 * LAMPORTS_PER_SOL)
    console.log("Airdrop transaction: ", airdrop)
    const balance = await provider.connection.getBalance(userAccount.publicKey)
    console.log("User Account balance: ", balance / LAMPORTS_PER_SOL)

    // Create & Initialize Mint Account
    const rent_lamports = await getMinimumBalanceForRentExemptMint(program.provider.connection)
    const createMintInstruction = SystemProgram.createAccount({
      fromPubkey: userAccount.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      lamports: rent_lamports,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    })
    const initializeMintInstruction = createInitializeMintInstruction(
      mintAccount.publicKey,
      0,
      userAccount.publicKey,
      userAccount.publicKey
    )
    // Get address of (Associated) Token Account
    nftTokenAccount = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      userAccount.publicKey
    )
    const createAtaInstruction = createAssociatedTokenAccountInstruction(
      userAccount.publicKey,
      nftTokenAccount,
      userAccount.publicKey,
      mintAccount.publicKey,
    )
    const transactions = new Transaction().add(
      createMintInstruction, 
      initializeMintInstruction, 
      createAtaInstruction
    )
    const response = await provider.sendAndConfirm(transactions, [mintAccount, userAccount]);

    console.log("Transaction Signature: ", response);
    console.log("Mint Account address: ", mintAccount.publicKey.toString());
    console.log("User Account address: ", userAccount.publicKey.toString());
    console.log("[NFT] Token Account address: ", nftTokenAccount.toString(), {skipPreflight: true});
  });

  it("Send Mint NFT Instruction", async() => {

    metadataAccount = await getMetadataAccount(mintAccount.publicKey);
    masterEditionAccount = await getMasterEditionAccount(mintAccount.publicKey);
    console.log("Metadata Account address: ", metadataAccount.toString());
    console.log("MasterEdition Account address: ", masterEditionAccount.toString());

    // Define variables specifying NFT Properties
    // Points to off-chain JSON file, containing image for NFT and other properties
    const uri = "https://metadata.y00ts.com/y/2952.json" 
    const title = "TREEHOPPERS"
    const symbol = "3HOP"
    
    const mintTransaction = await program.methods
    .mintNft(mintAccount.publicKey, uri, title, symbol)
    .accounts({
      mintAuthority: userAccount.publicKey, 
      mintAccount: mintAccount.publicKey, 
      tokenProgram: TOKEN_PROGRAM_ID, 
      metadataAccount: metadataAccount,
      tokenAccount: nftTokenAccount, 
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID, 
      payer: userAccount.publicKey, 
      systemProgram: SystemProgram.programId, 
      rent: SYSVAR_RENT_PUBKEY, 
      masterEdition: masterEditionAccount
    })
    .signers([userAccount])
    .rpc({commitment: "processed"})
    console.log("Transaction Signature: ", mintTransaction)
    console.log("NFT Token Account---")
    console.log(
      await program.provider.connection.getParsedAccountInfo(nftTokenAccount)
    );
  })
});
