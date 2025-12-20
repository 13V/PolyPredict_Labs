
const { PublicKey } = require('@solana/web3.js');

const keys = {
    MINT: '6ZFUNyPDn1ycjhb3RbNAmtcVvwp6oL4Zn6GswnGupump',
    PROGRAM: 'DcNb3pYGVqo1AdMdJGycDpRPb6d1nPsg3z4x5T714YW',
    SYSTEM: '11111111111111111111111111111111',
    RENT: 'SysvarRent11111111111111111111111111111111',
    TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
};

console.log("Verifying keys...");

for (const [name, val] of Object.entries(keys)) {
    try {
        new PublicKey(val);
        console.log(`✅ ${name}: Valid`);
    } catch (e) {
        console.error(`❌ ${name}: INVALID - ${e.message}`);
    }
}
