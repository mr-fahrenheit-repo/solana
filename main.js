const web3 = require('@solana/web3.js');
const spltoken = require('@solana/spl-token');
const bs58 = require('bs58').default;
const dotenv = require('dotenv');
const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
dotenv.config();
const privateKey_1 = process.env.PRIVATE_KEY_1;
const privateKey_2 = process.env.PRIVATE_KEY_2;
const TOKEN_MINT_ADDRESS = new web3.PublicKey(process.env.TOKEN_TARGET);
const wallet_1 = web3.Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey_1)));
const wallet_2 = web3.Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey_2)));

async function getTokenBalance(wallet, mintAddress) {
    const tokenAccount = await spltoken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mintAddress,
        wallet.publicKey
    );
    const balance = await connection.getTokenAccountBalance(tokenAccount.address);
    return balance.value.uiAmount; // Returns the balance in human-readable format
}

async function transferUSDC(wallet_1, wallet_2,amount) {
    const senderTokenAccount = await spltoken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet_1,
        TOKEN_MINT_ADDRESS,
        wallet_1.publicKey
    );

    const receiverTokenAccount = await spltoken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet_2,
        TOKEN_MINT_ADDRESS,
        wallet_2.publicKey
    );

    // Create transfer instruction
    const transferInstruction = spltoken.createTransferInstruction(
        senderTokenAccount.address,
        receiverTokenAccount.address,
        wallet_1.publicKey,
        amount * 10 ** 9 // USDC has 6 decimal places
    );

    // Create and send transaction
    const transaction = new web3.Transaction().add(transferInstruction);
    const signature = await connection.sendTransaction(transaction, [wallet_1]);

    await connection.confirmTransaction(signature);
    console.log('Transfer successful:', signature);
}

async function main() {
    const amount = await getTokenBalance(wallet_1, TOKEN_MINT_ADDRESS);
    console.log(`Balance in wallet_1: ${amount} USDC`);

    for (i=0;i<30;i++){
        // First transfer: Wallet A to Wallet B
        await transferUSDC(wallet_1, wallet_2, amount);

        // Wait for a specified time (e.g., 1 hour)
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 hour in milliseconds

        // Second transfer: Wallet B to Wallet A
        await transferUSDC(wallet_2, wallet_1, amount);

        // Wait for a specified time (e.g., 1 hour)
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 hour in milliseconds

    }


}

main();