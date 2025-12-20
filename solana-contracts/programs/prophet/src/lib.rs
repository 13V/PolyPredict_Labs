use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, TokenAccount};

declare_id!("DcNb3pYGVqo1AdMdJGycDpRPb6d1nPsg3z4x5T714YW");

#[program]
pub mod polybet {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        dev_vault: Pubkey,
        polybet_token_mint: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.dev_vault = dev_vault;
        config.polybet_token_mint = polybet_token_mint;
        config.burn_fee_bps = 300; // 3%
        config.dev_fee_bps = 200;  // 2%
        config.creator_fee_bps = 500; // 5%
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        dev_vault: Option<Pubkey>,
        polybet_token_mint: Option<Pubkey>,
        burn_fee_bps: Option<u16>,
        dev_fee_bps: Option<u16>,
        creator_fee_bps: Option<u16>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        if let Some(v) = dev_vault { config.dev_vault = v; }
        if let Some(v) = polybet_token_mint { config.polybet_token_mint = v; }
        if let Some(v) = burn_fee_bps { config.burn_fee_bps = v; }
        if let Some(v) = dev_fee_bps { config.dev_fee_bps = v; }
        if let Some(v) = creator_fee_bps { config.creator_fee_bps = v; }
        Ok(())
    }

    pub fn initialize_market(
        ctx: Context<InitializeMarket>, 
        market_id: u64,
        end_time: i64,
        question: String,
        outcome_count: u8,
        outcome_names: [String; 8],
        oracle_key: Option<Pubkey>,
        min_bet: u64,
        max_bet: u64,
        metadata_url: String,
        polymarket_id: String
    ) -> Result<()> {
        require!(outcome_count > 0 && outcome_count <= 8, MarketError::InvalidOutcomeCount);
        require!(ctx.accounts.mint.key() == ctx.accounts.config.polybet_token_mint, MarketError::InvalidMint);
        
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.market_id = market_id;
        market.end_time = end_time;
        market.question = question;
        market.resolved = false;
        market.outcome_count = outcome_count;
        market.outcome_names = outcome_names;
        market.totals = [0; 8];
        market.total_liquidity = 0;
        market.fees_distributed = false;
        market.paused = false;
        market.cancelled = false;
        market.oracle_key = oracle_key;
        market.min_bet = min_bet;
        market.max_bet = max_bet;
        market.metadata_url = metadata_url;
        market.polymarket_id = polymarket_id;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    pub fn place_vote(
        ctx: Context<PlaceVote>, 
        amount: u64, 
        outcome_index: u8
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;
        
        require!(!market.paused, MarketError::MarketPaused);
        require!(!market.resolved, MarketError::AlreadyResolved);
        require!(clock.unix_timestamp < market.end_time, MarketError::MarketClosed);
        require!(outcome_index < market.outcome_count, MarketError::InvalidOutcomeIndex);
        require!(amount >= market.min_bet, MarketError::BetTooSmall);
        if market.max_bet > 0 {
            require!(amount <= market.max_bet, MarketError::BetTooLarge);
        }
        
        let vote_record = &mut ctx.accounts.vote_record;

        // Transfer tokens from User to Vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        // Update State
        market.totals[outcome_index as usize] += amount;
        market.total_liquidity += amount;

        // Record User Vote
        if vote_record.amount > 0 {
            require!(vote_record.outcome_index == outcome_index, MarketError::MultipleOutcomesNotSupported);
        }

        vote_record.user = ctx.accounts.user.key();
        vote_record.market = market.key();
        vote_record.outcome_index = outcome_index;
        vote_record.amount += amount; // Allow topping up

        emit!(VotePlacedEvent {
            user: ctx.accounts.user.key(),
            market: market.key(),
            outcome_index,
            amount,
        });

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>, 
        outcome_index: u8
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.paused, MarketError::MarketPaused);
        require!(!market.resolved, MarketError::AlreadyResolved);
        require!(outcome_index < market.outcome_count, MarketError::InvalidOutcomeIndex);
        
        market.resolved = true;
        market.winning_outcome = Some(outcome_index);

        emit!(MarketResolvedEvent {
            market: market.key(),
            winning_outcome: outcome_index,
        });

        Ok(())
    }

    pub fn sweep_market(ctx: Context<SweepMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;
        
        require!(market.resolved, MarketError::NotResolved);
        // Can only sweep 30 days after end_time
        require!(clock.unix_timestamp > market.end_time + (30 * 24 * 60 * 60), MarketError::SweepTooEarly);

        let amount = ctx.accounts.vault_token_account.amount;
        require!(amount > 0, MarketError::NoDustToSweep);

        let market_id_bytes = market.market_id.to_le_bytes();
        let bump_seed = [market.bump];
        let seeds = &[
            b"market".as_ref(),
            market_id_bytes.as_ref(),
            bump_seed.as_ref(),
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.dev_token_account.to_account_info(),
            authority: market.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
            amount
        )?;

        Ok(())
    }

    pub fn pause_market(ctx: Context<AdminOnly>, pause: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.paused = pause;
        Ok(())
    }

    pub fn cancel_market(ctx: Context<AdminOnly>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, MarketError::AlreadyResolved);
        market.cancelled = true;
        market.resolved = true; // Mark as resolved so refunds can happen
        Ok(())
    }

    pub fn early_exit(ctx: Context<EarlyExit>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let vote_record = &mut ctx.accounts.vote_record;
        
        require!(!market.resolved, MarketError::AlreadyResolved);
        require!(!market.paused, MarketError::MarketPaused);
        require!(vote_record.amount > 0, MarketError::NoActiveBet);
        require!(!vote_record.claimed, MarketError::AlreadyClaimed);

        // 90% refund
        let refund_amount = (vote_record.amount as u128)
            .checked_mul(90).unwrap()
            .checked_div(100).unwrap() as u64;

        // Update state
        market.totals[vote_record.outcome_index as usize] -= vote_record.amount;
        market.total_liquidity -= vote_record.amount;

        let market_id_bytes = market.market_id.to_le_bytes();
        let bump_seed = [market.bump];
        let seeds = &[
            b"market".as_ref(),
            market_id_bytes.as_ref(),
            bump_seed.as_ref(),
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: market.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
            refund_amount
        )?;

        vote_record.amount = 0;
        vote_record.claimed = true; // Mark as claimed to prevent further action

        Ok(())
    }

    pub fn distribute_fees(ctx: Context<DistributeFees>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let config = &ctx.accounts.config;
        
        require!(market.resolved, MarketError::NotResolved);
        require!(!market.cancelled, MarketError::MarketCancelled);
        require!(!market.fees_distributed, MarketError::FeesAlreadyDistributed);

        let total_pool = market.total_liquidity;
        
        let creator_fee = (total_pool as u128)
            .checked_mul(config.creator_fee_bps as u128).unwrap()
            .checked_div(10000).unwrap() as u64;
        let burn_amount = (total_pool as u128)
            .checked_mul(config.burn_fee_bps as u128).unwrap()
            .checked_div(10000).unwrap() as u64;
        let dev_fee = (total_pool as u128)
            .checked_mul(config.dev_fee_bps as u128).unwrap()
            .checked_div(10000).unwrap() as u64;

        let market_id_bytes = market.market_id.to_le_bytes();
        let bump_seed = [market.bump];
        let seeds = &[
            b"market".as_ref(),
            market_id_bytes.as_ref(),
            bump_seed.as_ref(),
        ];
        let signer = &[&seeds[..]];

        // 1. Transfer Creator Fee
        if creator_fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: market.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                creator_fee
            )?;
        }

        // 2. Burn
        if burn_amount > 0 {
            let cpi_accounts = token::Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.vault_token_account.to_account_info(),
                authority: market.to_account_info(),
            };
            token::burn(
                CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                burn_amount
            )?;
        }

        // 3. Transfer Dev Fee
        if dev_fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.dev_token_account.to_account_info(),
                authority: market.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                dev_fee
            )?;
        }

        market.fees_distributed = true;

        emit!(FeesDistributedEvent {
            market: market.key(),
            creator_fee,
            burn_amount,
            dev_fee,
        });

        Ok(())
    }

    pub fn resolve_via_oracle(
        ctx: Context<ResolveViaOracle>, 
        outcome_index: u8
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, MarketError::AlreadyResolved);
        require!(outcome_index < market.outcome_count, MarketError::InvalidOutcomeIndex);
        
        market.resolved = true;
        market.winning_outcome = Some(outcome_index);

        emit!(MarketResolvedEvent {
            market: market.key(),
            winning_outcome: outcome_index,
        });

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let vote_record = &mut ctx.accounts.vote_record;
        
        require!(market.resolved, MarketError::NotResolved);
        require!(!market.paused, MarketError::MarketPaused);
        require!(!vote_record.claimed, MarketError::AlreadyClaimed);

        if !market.fees_distributed && !market.cancelled {
            // Auto-trigger fee distribution if haven't yet
            let total_pool = market.total_liquidity;
            let config = &ctx.accounts.config;
            
            let creator_fee = (total_pool as u128)
                .checked_mul(config.creator_fee_bps as u128).unwrap()
                .checked_div(10000).unwrap() as u64;
            let burn_amount = (total_pool as u128)
                .checked_mul(config.burn_fee_bps as u128).unwrap()
                .checked_div(10000).unwrap() as u64;
            let dev_fee = (total_pool as u128)
                .checked_mul(config.dev_fee_bps as u128).unwrap()
                .checked_div(10000).unwrap() as u64;

            let market_id_bytes = market.market_id.to_le_bytes();
            let bump_seed = [market.bump];
            let seeds = &[
                b"market".as_ref(),
                market_id_bytes.as_ref(),
                bump_seed.as_ref(),
            ];
            let signer = &[&seeds[..]];

            // Creator Fee
            if creator_fee > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: market.to_account_info(),
                };
                token::transfer(
                    CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                    creator_fee
                )?;
            }

            // Burn
            if burn_amount > 0 {
                let cpi_accounts = token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    authority: market.to_account_info(),
                };
                token::burn(
                    CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                    burn_amount
                )?;
            }

            // Dev Fee
            if dev_fee > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.dev_token_account.to_account_info(),
                    authority: market.to_account_info(),
                };
                token::transfer(
                    CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                    dev_fee
                )?;
            }

            market.fees_distributed = true;
            emit!(FeesDistributedEvent {
                market: market.key(),
                creator_fee,
                burn_amount,
                dev_fee,
            });
        }

        if market.cancelled {
            // Full Refund Logic
            let refund = vote_record.amount;
            let market_id_bytes = market.market_id.to_le_bytes();
            let bump_seed = [market.bump];
            let seeds = &[
                b"market".as_ref(),
                market_id_bytes.as_ref(),
                bump_seed.as_ref(),
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: market.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer),
                refund
            )?;
            vote_record.claimed = true;
            return Ok(());
        }

        require!(market.fees_distributed, MarketError::FeesNotDistributed);
        require!(Some(vote_record.outcome_index) == market.winning_outcome, MarketError::Loser);

        // Calculate Payout
        let winning_outcome_index = market.winning_outcome.unwrap() as usize;
        let total_winning_pool = market.totals[winning_outcome_index];

        let total_pool = market.total_liquidity;
        let distributable_pool = (total_pool as u128)
            .checked_mul(90).unwrap()
            .checked_div(100).unwrap() as u64; // This 90 should ideally come from config too: 10000 - bps sum

        // Precision safety: (UserBet * Distributable) / TotalWinning
        let payout = (vote_record.amount as u128)
            .checked_mul(distributable_pool as u128).unwrap()
            .checked_div(total_winning_pool as u128).unwrap() as u64;

        // Transfer Payout from Vault to User
        let market_id_bytes = market.market_id.to_le_bytes();
        let bump_seed = [market.bump];
        let seeds = &[
            b"market".as_ref(),
            market_id_bytes.as_ref(),
            bump_seed.as_ref(),
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: market.to_account_info(), // Market PDA owns the vault
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer), 
            payout
        )?;

        vote_record.claimed = true;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 2 + 2 + 2 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, has_one = authority)]
    pub config: Account<'info, GlobalConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct InitializeMarket<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 1500, // Further expanded space
        seeds = [b"market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    pub config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = market,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, token::Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceVote<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 1 + 8 + 1,
        seeds = [b"vote", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SweepMarket<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    
    pub config: Account<'info, GlobalConfig>,

    pub authority: Signer<'info>,
    
    #[account(mut, seeds = [b"vault", market.key().as_ref()], bump)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EarlyExit<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(mut, seeds = [b"vote", market.key().as_ref(), user.key().as_ref()], bump)]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut, seeds = [b"vault", market.key().as_ref()], bump)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveViaOracle<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    pub oracle: Signer<'info>,
    
    #[account(constraint = market.oracle_key == Some(oracle.key()))]
    pub oracle_check: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DevOnly<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub dev: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributeFees<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
    
    pub config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,
    
    #[account(mut, seeds = [b"vault", market.key().as_ref()], bump)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, token::Mint>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    pub config: Account<'info, GlobalConfig>,
    
    #[account(mut, seeds = [b"vote", market.key().as_ref(), user.key().as_ref()], bump)]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"vault", market.key().as_ref()], bump)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub dev_vault: Pubkey,
    pub polybet_token_mint: Pubkey,
    pub burn_fee_bps: u16,
    pub dev_fee_bps: u16,
    pub creator_fee_bps: u16,
    pub bump: u8,
}

#[account]
pub struct Market {
    pub authority: Pubkey,   // 32
    pub market_id: u64,      // 8
    pub end_time: i64,       // 8
    pub question: String,    // 4 + 200
    pub resolved: bool,      // 1
    pub winning_outcome: Option<u8>, // 1 + 1
    pub totals: [u64; 8],    // 64
    pub outcome_count: u8,   // 1
    pub total_liquidity: u64,// 8
    pub fees_distributed: bool, // 1
    pub paused: bool,       // 1
    pub cancelled: bool,    // 1
    pub outcome_names: [String; 8], // 8 * (4 + 32) = 288
    pub oracle_key: Option<Pubkey>, // 1 + 32 = 33
    pub min_bet: u64,       // 8
    pub max_bet: u64,       // 8
    pub metadata_url: String, // 4 + 100
    pub polymarket_id: String, // 4 + 100 (Slugs/Condition IDs)
    pub bump: u8,           // 1
}

#[account]
pub struct VoteRecord {
    pub user: Pubkey,          // 32
    pub market: Pubkey,        // 32
    pub outcome_index: u8,     // 1
    pub amount: u64,           // 8
    pub claimed: bool,         // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VoteSide {
    Yes,
    No
}

#[error_code]
pub enum MarketError {
    #[msg("Market is already resolved.")]
    AlreadyResolved,
    #[msg("Market is not resolved yet.")]
    NotResolved,
    #[msg("You voted for the losing side.")]
    Loser,
    #[msg("You have already claimed winnings.")]
    AlreadyClaimed,
    #[msg("Outcome count must be between 1 and 8.")]
    InvalidOutcomeCount,
    #[msg("Invalid outcome index.")]
    InvalidOutcomeIndex,
    #[msg("Voting for multiple outcomes in the same market is not supported.")]
    MultipleOutcomesNotSupported,
    #[msg("Market has closed for voting.")]
    MarketClosed,
    #[msg("Fees have already been distributed.")]
    FeesAlreadyDistributed,
    #[msg("Fees have not been distributed yet.")]
    FeesNotDistributed,
    #[msg("Market is currently paused.")]
    MarketPaused,
    #[msg("Market was cancelled.")]
    MarketCancelled,
    #[msg("No active bet found for this user.")]
    NoActiveBet,
    #[msg("Bet amount is below the minimum limit.")]
    BetTooSmall,
    #[msg("Bet amount is above the maximum limit.")]
    BetTooLarge,
    #[msg("Invalid mint. Only Polybet Token is allowed.")]
    InvalidMint,
    #[msg("Sweep can only occur 30 days after market resolution.")]
    SweepTooEarly,
    #[msg("No dust tokens found to sweep.")]
    NoDustToSweep,
}

#[event]
pub struct VotePlacedEvent {
    pub user: Pubkey,
    pub market: Pubkey,
    pub outcome_index: u8,
    pub amount: u64,
}

#[event]
pub struct MarketResolvedEvent {
    pub market: Pubkey,
    pub winning_outcome: u8,
}

#[event]
pub struct FeesDistributedEvent {
    pub market: Pubkey,
    pub creator_fee: u64,
    pub burn_amount: u64,
    pub dev_fee: u64,
}
