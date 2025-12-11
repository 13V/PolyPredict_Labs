use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub mod state;
pub mod errors;

use state::*;
use errors::*;

declare_id!("aarqjMf425M1LBzMwLxZvvbUTdFvePzTHksUAxq");

#[program]
pub mod prophet {
    use super::*;

    /// Initialize a new Prediction Market
    pub fn initialize_market(ctx: Context<InitializeMarket>, question: String, end_timestamp: i64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.question = question;
        market.end_timestamp = end_timestamp;
        market.outcomes_count = 2; // Yes/No
        market.total_pot = 0;
        market.resolved = false;
        market.bump = *ctx.bumps.get("market").unwrap();
        Ok(())
    }

    /// Place a Vote (Bet)
    pub fn place_vote(ctx: Context<PlaceVote>, outcome_index: u8, amount: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, ProphetError::MarketEnded);
        require!(outcome_index < market.outcomes_count, ProphetError::InvalidOutcome);
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < market.end_timestamp, ProphetError::MarketEnded);

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
        market.total_pot = market.total_pot.checked_add(amount).ok_or(ProphetError::MathOverflow)?;

        Ok(())
    }

    /// Resolve Market (Admin Only for MVP)
    pub fn resolve_market(ctx: Context<ResolveMarket>, winner_index: u8) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, ProphetError::MarketEnded);
        require!(winner_index < market.outcomes_count, ProphetError::InvalidOutcome);
        
        // In real world, check Timestamp or Oracle signature
        
        market.resolved = true;
        market.winner_index = Some(winner_index);
        Ok(())
    }

    /// Claim Winnings
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let vote = &mut ctx.accounts.vote;

        require!(market.resolved, ProphetError::MarketActive);
        require!(!vote.claimed, ProphetError::AlreadyClaimed);
        
        let winner = market.winner_index.ok_or(ProphetError::OutcomeNotSet)?;
        require!(vote.outcome_index == winner, ProphetError::InvalidOutcome); // You lost, sorry

        // Calculate Payout (Simplified 1.85x for MVP, real would be proportional)
        // Payout = Bet * 1.85
        let payout = vote.amount.checked_mul(185).unwrap().checked_div(100).unwrap();

        // Transfer from Vault to User
        let seeds = &[
            b"market".as_ref(), 
            market.authority.as_ref(), // Seed 2
            &[market.bump]
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.market.to_account_info(), // Market PDA owns the vault
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(), 
            cpi_accounts, 
            signer
        );
        token::transfer(cpi_ctx, payout)?;

        vote.claimed = true;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(question: String)]
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
