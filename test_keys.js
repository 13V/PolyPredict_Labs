const { PublicKey } = require('@solana/web3.js');

const keys_to_test = [
    { name: "PROGRAM_ID", val: "aarqjMf425M1LBzMwLxZvvbUTdFvePzTHksUAxq" },
    { name: "MARKET_KEY_PLACEHOLDER", val: "PrphEt1111111111111111111111111111111111111" },
    { name: "CONTRACT_ADDRESS", val: "HqQqPtf7FgFySXDHrTzExbGKUt4axd1JJQRDr9kZpump" }
];

keys_to_test.forEach(k => {
    try {
        new PublicKey(k.val);
        console.log(`PASS: ${k.name}`);
    } catch (e) {
        console.error(`FAIL: ${k.name} - ${e.message}`);
    }
});
