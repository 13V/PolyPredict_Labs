use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Placeholder ID

#[program]
pub mod prophet {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>, 
        market_id: u64,
        end_time: i64,
        question: String
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.market_id = market_id;
        market.end_time = end_time;
        market.question = question;
        market.resolved = false;
        market.total_yes = 0;
        market.total_no = 0;
        market.total_liquidity = 0;
        market.bump = *ctx.bumps.get("market").unwrap();
        Ok(())
    }

    pub fn place_vote(
        ctx: Context<PlaceVote>, 
        amount: u64, 
        side: VoteSide
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
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
        if side == VoteSide::Yes {
            market.total_yes += amount;
        } else {
            market.total_no += amount;
        }
        market.total_liquidity += amount;

        // Record User Vote
        vote_record.user = ctx.accounts.user.key();
        vote_record.market = market.key();
        vote_record.side = side;
        vote_record.amount += amount; // Allow topping up

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>, 
        outcome: VoteSide
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, MarketError::AlreadyResolved);
        
        // In reality, check time or Oracle signature here
        
        market.resolved = true;
        market.winning_side = Some(outcome);
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let vote_record = &mut ctx.accounts.vote_record;
        
        require!(market.resolved, MarketError::NotResolved);
        require!(Some(vote_record.side) == market.winning_side, MarketError::Loser);
        require!(!vote_record.claimed, MarketError::AlreadyClaimed);

        // Calculate Payout
        // Formula: (UserBet / TotalWinningBets) * (TotalPool * 0.90)
        let total_winning_pool = if market.winning_side == Some(VoteSide::Yes) {
            market.total_yes
        } else {
            market.total_no
        };

        let total_pool = market.total_liquidity;
        let protocol_fee = total_pool / 10; // 10%
        let distributable_pool = total_pool - protocol_fee;

        // Precision safety: (UserBet * Distributable) / TotalWinning
        let payout = (vote_record.amount as u128)
            .checked_mul(distributable_pool as u128).unwrap()
            .checked_div(total_winning_pool as u128).unwrap() as u64;

        // Transfer Payout from Vault to User
        let seeds = &[
            b"market",
            &market.market_id.to_le_bytes(),
            &[market.bump],
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
#[instruction(market_id: u64)]
pub struct InitializeMarket<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 8 + 8 + 4 + 200 + 1 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    
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
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(mut, seeds = [b"vote", market.key().as_ref(), user.key().as_ref()], bump)]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub market_id: u64,
    pub end_time: i64,
    pub question: String,
    pub resolved: bool,
    pub winning_side: Option<VoteSide>,
    pub total_yes: u64,
    pub total_no: u64,
    pub total_liquidity: u64,
    pub bump: u8,
}

#[account]
pub struct VoteRecord {
    pub user: Pubkey,
    pub market: Pubkey,
    pub side: VoteSide,
    pub amount: u64,
    pub claimed: bool,
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
}
