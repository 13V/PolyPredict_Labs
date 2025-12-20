use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub mod state;
pub mod errors;

use state::*;
use errors::*;

declare_id!("8f4FusHQaT2KxwpZzRNTV6TpdaEu68bcLFfJKBwZ3koE");

#[program]
pub mod polybet {
    use super::*;

    /// Initialize a new Prediction Market with custom outcomes
    /// outcomes_count: 2-8 (e.g., 2 for YES/NO, 3 for Trump/Biden/Other)
    pub fn initialize_market(ctx: Context<InitializeMarket>, question: String, end_timestamp: i64, outcomes_count: u8) -> Result<()> {
        require!(outcomes_count >= 2 && outcomes_count <= 8, PolybetError::InvalidOutcome);
        
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.question = question;
        market.end_timestamp = end_timestamp;
        market.outcomes_count = outcomes_count;
        market.total_pot = 0;
        market.outcome_totals = [0; 8]; // Initialize all to 0
        market.resolved = false;
        market.fees_distributed = false;
        market.bump = *ctx.bumps.get("market").unwrap();
        Ok(())
    }

    /// Place a Vote (Bet)
    pub fn place_vote(ctx: Context<PlaceVote>, outcome_index: u8, amount: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, PolybetError::MarketEnded);
        require!(outcome_index < market.outcomes_count, PolybetError::InvalidOutcome);
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < market.end_timestamp, PolybetError::MarketEnded);

        // 1. Transfer Tokens from User to Vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // 2. Record the Vote
        let vote = &mut ctx.accounts.vote;
        vote.user = ctx.accounts.user.key();
        vote.market = market.key();
        vote.outcome_index = outcome_index;
        vote.amount = amount;
        vote.claimed = false;
        vote.bump = *ctx.bumps.get("vote").unwrap();

        // 3. Update Market Stats
        market.total_pot = market.total_pot.checked_add(amount).ok_or(PolybetError::MathOverflow)?;
        market.outcome_totals[outcome_index as usize] = market.outcome_totals[outcome_index as usize]
            .checked_add(amount)
            .ok_or(PolybetError::MathOverflow)?;

        Ok(())
    }

    /// Resolve Market (Admin Only for MVP)
    pub fn resolve_market(ctx: Context<ResolveMarket>, winner_index: u8) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, PolybetError::MarketEnded);
        require!(winner_index < market.outcomes_count, PolybetError::InvalidOutcome);
        
        // In real world, check Timestamp or Oracle signature
        
        market.resolved = true;
        market.winner_index = Some(winner_index);
        Ok(())
    }

    /// Distribute Fees to Creator (10%) and Burn Address (5%)
    /// Multi-outcome version: Sums all losing outcomes for fee calculation
    /// Can only be called once by market authority
    pub fn distribute_fees(ctx: Context<DistributeFees>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(market.resolved, PolybetError::MarketActive);
        require!(!market.fees_distributed, PolybetError::AlreadyClaimed);
        require!(market.authority == ctx.accounts.authority.key(), PolybetError::Unauthorized);

        let winner_index = market.winner_index.ok_or(PolybetError::OutcomeNotSet)?;
        
        // Sum all losing outcomes
        let mut total_losing = 0u64;
        for i in 0..market.outcomes_count {
            if i != winner_index {
                total_losing = total_losing
                    .checked_add(market.outcome_totals[i as usize])
                    .ok_or(PolybetError::MathOverflow)?;
            }
        }

        // Calculate fees from losing pool
        let creator_fee = (total_losing as u128)
            .checked_mul(1000) // 10%
            .ok_or(PolybetError::MathOverflow)?
            .checked_div(10000)
            .ok_or(PolybetError::MathOverflow)? as u64;

        let burn_fee = (total_losing as u128)
            .checked_mul(500) // 5%
            .ok_or(PolybetError::MathOverflow)?
            .checked_div(10000)
            .ok_or(PolybetError::MathOverflow)? as u64;

        // Transfer creator fee
        let seeds = &[
            b"market".as_ref(), 
            market.authority.as_ref(),
            &[market.bump]
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.creator_token.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(), 
            cpi_accounts, 
            signer
        );
        token::transfer(cpi_ctx, creator_fee)?;

        // Transfer burn fee
        let burn_accounts = Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.burn_token.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let burn_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(), 
            burn_accounts, 
            signer
        );
        token::transfer(burn_ctx, burn_fee)?;

        market.fees_distributed = true;
        Ok(())
    }

    /// Claim Winnings with Proportional Payout (Multi-Outcome Support)
    /// Winners split 85% of ALL losing outcomes proportionally
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let vote = &mut ctx.accounts.vote;

        require!(market.resolved, PolybetError::MarketActive);
        require!(!vote.claimed, PolybetError::AlreadyClaimed);
        
        let winner_index = market.winner_index.ok_or(PolybetError::OutcomeNotSet)?;
        require!(vote.outcome_index == winner_index, PolybetError::InvalidOutcome);

        // Get winning pool total
        let winning_total = market.outcome_totals[winner_index as usize];
        require!(winning_total > 0, PolybetError::MathOverflow);
        
        // Sum ALL losing outcomes
        let mut total_losing = 0u64;
        for i in 0..market.outcomes_count {
            if i != winner_index {
                total_losing = total_losing
                    .checked_add(market.outcome_totals[i as usize])
                    .ok_or(PolybetError::MathOverflow)?;
            }
        }

        // Calculate user's proportional share of winnings
        let user_share_of_winning_pool = (vote.amount as u128)
            .checked_mul(10000)
            .ok_or(PolybetError::MathOverflow)?
            .checked_div(winning_total as u128)
            .ok_or(PolybetError::MathOverflow)?;

        // 85% of ALL losing pools go to winners
        let winning_pool = (total_losing as u128)
            .checked_mul(8500)
            .ok_or(PolybetError::MathOverflow)?
            .checked_div(10000)
            .ok_or(PolybetError::MathOverflow)? as u64;

        let user_winnings = (winning_pool as u128)
            .checked_mul(user_share_of_winning_pool)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;

        // Total payout = original bet + winnings
        let total_payout = vote.amount
            .checked_add(user_winnings)
            .ok_or(PolybetError::MathOverflow)?;

        // Transfer from Vault to User
        let seeds = &[
            b"market".as_ref(), 
            market.authority.as_ref(),
            &[market.bump]
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(), 
            cpi_accounts, 
            signer
        );
        token::transfer(cpi_ctx, total_payout)?;

        vote.claimed = true;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(question: String, end_timestamp: i64, outcomes_count: u8)]
pub struct InitializeMarket<'info> {
    #[account(
        init, 
        payer = authority, 
        space = Market::SPACE,
        seeds = [b"market", authority.key().as_ref(), question.as_bytes()], 
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = market, // Market PDA owns the tokens
    )]
    pub vault_token: Account<'info, TokenAccount>,

    pub mint: Account<'info, token::Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceVote<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init, 
        payer = user, 
        space = Vote::SPACE,
        seeds = [b"vote", market.key().as_ref(), user.key().as_ref()], 
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut, 
        has_one = authority
    )]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributeFees<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub burn_token: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"vote", market.key().as_ref(), user.key().as_ref()],
        bump = vote.bump,
        has_one = user
    )]
    pub vote: Account<'info, Vote>,

    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
