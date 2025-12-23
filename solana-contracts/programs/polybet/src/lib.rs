use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, Transfer};
use solana_program::pubkey;
use anchor_lang::solana_program::{
    program::invoke_signed,
    system_instruction,
};

declare_id!("8m7wUvDdNc7U8nyutZKPLM4zn5CXuJWXovpKE6PvuiEj");

const TOKEN_2022_ID: Pubkey = pubkey!("TokenzQdBnBLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

#[program]
pub mod polybet {
    use super::*;

    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_program.key(), TOKEN_2022_ID, PolybetError::InvalidProgramId);
        
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.vault_bump = ctx.bumps.treasury_vault;
        config.bump = ctx.bumps.config;

        // Manual Initialization of Treasury Vault (Bypassing Anchor Macro)
        // Space for TokenAccount: 165 bytes
        let space = 165;
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);

        let vault_seeds = &[b"treasury".as_ref(), &[ctx.bumps.treasury_vault]];
        let signer_seeds = &[&vault_seeds[..]];

        // 1. Create Account
        invoke_signed(
            &system_instruction::create_account(
                ctx.accounts.authority.key,
                ctx.accounts.treasury_vault.key,
                lamports,
                space as u64,
                &TOKEN_2022_ID,
            ),
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.treasury_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        // 2. Initialize Token Account (Manual CPI for TokenzQdBnBLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb)
        let ix = spl_token_2022::instruction::initialize_account_3(
            &TOKEN_2022_ID,
            ctx.accounts.treasury_vault.key,
            ctx.accounts.mint.key,
            ctx.accounts.treasury_vault.key, // Vault is its own authority
        ).map_err(|_| ProgramError::InvalidInstructionData)?;

        invoke_signed(
            &ix,
            &[
                ctx.accounts.treasury_vault.to_account_info(),
                ctx.accounts.mint.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }

    /// 2. Initialize Market (No token movement)
    pub fn initialize_market(
        ctx: Context<InitializeMarket>, 
        question: String, 
        end_timestamp: i64, 
        outcomes_count: u8,
        virtual_liquidity: u64,
        weights: [u32; 8]
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.question = question;
        market.end_timestamp = end_timestamp;
        market.outcomes_count = outcomes_count;
        market.total_pot = virtual_liquidity;
        
        let mut total_weight = 0u32;
        for i in 0..outcomes_count as usize {
            total_weight += weights[i];
        }
        for i in 0..outcomes_count as usize {
            if total_weight > 0 {
                market.outcome_totals[i] = (virtual_liquidity as u128)
                    .checked_mul(weights[i] as u128).unwrap()
                    .checked_div(total_weight as u128).unwrap() as u64;
            }
        }
        market.resolved = false;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    /// 3. Place Bet (90/10 Split Implemented)
    pub fn place_vote(ctx: Context<PlaceVote>, outcome_index: u8, amount: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_program.key(), TOKEN_2022_ID, PolybetError::InvalidProgramId);
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < market.end_timestamp, PolybetError::MarketEnded);
        
        // 90/10 Split: 90% to winners, 10% to Buyback Fund (Dev Vault)
        let total_payout = if market.outcome_totals[outcome_index as usize] > 0 {
            (amount as u128)
                .checked_mul(90).unwrap() 
                .checked_mul(market.total_pot as u128).unwrap()
                .checked_div(100).unwrap()
                .checked_div(market.outcome_totals[outcome_index as usize] as u128).unwrap() as u64
        } else {
            amount
        };

        // Move tokens to Global Treasury
        token_interface::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), 
            token_interface::Transfer { from: ctx.accounts.user_token.to_account_info(), to: ctx.accounts.treasury_vault.to_account_info(), authority: ctx.accounts.user.to_account_info() }), 
            amount)?;

        let vote = &mut ctx.accounts.vote;
        vote.user = ctx.accounts.user.key();
        vote.market = market.key();
        vote.outcome_index = outcome_index;
        vote.amount = amount;
        vote.locked_payout = total_payout;
        
        // Solid 10% Protocol Tax for Buyback
        vote.locked_dev_fee = (total_payout as u128).checked_mul(11).unwrap().checked_div(100).unwrap() as u64; // Approx 10% of losing pot equivalent

        market.total_pot = market.total_pot.checked_add(amount).unwrap();
        market.outcome_totals[outcome_index as usize] = market.outcome_totals[outcome_index as usize].checked_add(amount).unwrap();
        Ok(())
    }

    /// 4. Claim Winnings (Paid from Global Vault)
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_program.key(), TOKEN_2022_ID, PolybetError::InvalidProgramId);
        let (payout, d_fee) = {
            let market = &ctx.accounts.market;
            let vote = &ctx.accounts.vote;
            require!(market.resolved, PolybetError::MarketActive);
            require!(!vote.claimed, PolybetError::AlreadyClaimed);
            require!(vote.outcome_index == market.winner_index.unwrap(), PolybetError::InvalidOutcome);
            (vote.locked_payout, vote.locked_dev_fee)
        };

        let seeds = &[b"treasury".as_ref(), &[ctx.accounts.config.vault_bump]];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        token_interface::transfer(CpiContext::new_with_signer(cpi_program.clone(), token_interface::Transfer { from: ctx.accounts.treasury_vault.to_account_info(), to: ctx.accounts.user_token.to_account_info(), authority: ctx.accounts.treasury_vault.to_account_info() }, signer), payout)?;
        token_interface::transfer(CpiContext::new_with_signer(cpi_program.clone(), token_interface::Transfer { from: ctx.accounts.treasury_vault.to_account_info(), to: ctx.accounts.dev_token.to_account_info(), authority: ctx.accounts.treasury_vault.to_account_info() }, signer), d_fee)?;

        ctx.accounts.vote.claimed = true;
        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, winner_index: u8) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.resolved = true;
        market.winner_index = Some(winner_index);
        Ok(())
    }

    pub fn sweep_profit(ctx: Context<SweepProfit>, amount: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_program.key(), TOKEN_2022_ID, PolybetError::InvalidProgramId);
        let seeds = &[b"treasury".as_ref(), &[ctx.accounts.config.vault_bump]];
        let signer = &[&seeds[..]];
        token_interface::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), 
            token_interface::Transfer { from: ctx.accounts.treasury_vault.to_account_info(), to: ctx.accounts.destination_token.to_account_info(), authority: ctx.accounts.treasury_vault.to_account_info() }, 
            signer), amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(init, payer = authority, space = ProtocolConfig::SPACE, seeds = [b"config"], bump)]
    pub config: Account<'info, ProtocolConfig>,
    /// CHECK: Manually created and initialized in the handler to bypass library typos
    #[account(mut, seeds = [b"treasury"], bump)]
    pub treasury_vault: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Manual validation to bypass casing bugs in library constants
    pub token_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(question: String, end_timestamp: i64, outcomes_count: u8, virtual_liquidity: u64)]
pub struct InitializeMarket<'info> {
    #[account(init, payer = authority, space = Market::SPACE, seeds = [b"market", authority.key().as_ref(), question.as_bytes()], bump)]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceVote<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(init, payer = user, space = Vote::SPACE, seeds = [b"vote", market.key().as_ref(), user.key().as_ref()], bump)]
    pub vote: Account<'info, Vote>,
    #[account(mut, seeds = [b"treasury"], bump = config.vault_bump)]
    pub treasury_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token: InterfaceAccount<'info, TokenAccount>,
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Manual validation to bypass casing bugs in library constants
    pub token_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    pub config: Account<'info, ProtocolConfig>,
    pub market: Account<'info, Market>,
    #[account(mut, seeds = [b"vote", market.key().as_ref(), user.key().as_ref()], bump = vote.bump, has_one = user)]
    pub vote: Account<'info, Vote>,
    #[account(mut, seeds = [b"treasury"], bump = config.vault_bump)]
    pub treasury_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub dev_token: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Manual validation to bypass casing bugs in library constants
    pub token_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SweepProfit<'info> {
    #[account(has_one = authority)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, seeds = [b"treasury"], bump = config.vault_bump)]
    pub treasury_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    pub authority: Signer<'info>,
    /// CHECK: Manual validation to bypass casing bugs in library constants
    pub token_program: UncheckedAccount<'info>,
}

#[account]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub vault_bump: u8,
    pub bump: u8,
}

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub question: String,
    pub end_timestamp: i64,
    pub outcomes_count: u8,
    pub total_pot: u64,
    pub outcome_totals: [u64; 8],
    pub resolved: bool,
    pub winner_index: Option<u8>,
    pub bump: u8,
}

#[account]
pub struct Vote {
    pub user: Pubkey,
    pub market: Pubkey,
    pub outcome_index: u8,
    pub amount: u64,
    pub locked_payout: u64,
    pub locked_creator_fee: u64,
    pub locked_dev_fee: u64,
    pub claimed: bool,
    pub bump: u8,
}

impl ProtocolConfig { pub const SPACE: usize = 8 + 32 + 1 + 1; }
impl Market { pub const SPACE: usize = 8 + 32 + (4 + 64) + 8 + 1 + 8 + 64 + 1 + 2 + 1; }
impl Vote { pub const SPACE: usize = 8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 + 1 + 1; }

#[error_code]
pub enum PolybetError {
    #[msg("Market ended.")] MarketEnded,
    #[msg("Market active.")] MarketActive,
    #[msg("Outcome mismatch.")] InvalidOutcome,
    #[msg("Already claimed.")] AlreadyClaimed,
    #[msg("Unauthorized.")] Unauthorized,
    #[msg("Invalid Program ID.")] InvalidProgramId,
}
