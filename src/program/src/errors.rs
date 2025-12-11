use anchor_lang::prelude::*;

#[error_code]
pub enum ProphetError {
    #[msg("Market has already ended.")]
    MarketEnded,
    #[msg("Market is still active.")]
    MarketActive,
    #[msg("Insufficient funds to place this bet.")]
    InsufficientFunds,
    #[msg("Invalid outcome selected.")]
    InvalidOutcome,
    #[msg("User has already claimed winnings.")]
    AlreadyClaimed,
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("Market outcome has not been set.")]
    OutcomeNotSet,
}
