export interface PredictionOutcome {
    predictionId: number;
    outcome: 'yes' | 'no' | null;
    closedAt: number;
    closedBy: string;
}

const OUTCOMES_KEY = 'prophet_prediction_outcomes';

/**
 * Close a prediction and set its outcome
 */
export function closePrediction(
    predictionId: number,
    outcome: 'yes' | 'no',
    adminAddress: string
): void {
    const outcomes = getAllOutcomes();

    // Remove any existing outcome for this prediction
    const filteredOutcomes = outcomes.filter(o => o.predictionId !== predictionId);

    // Add new outcome
    filteredOutcomes.push({
        predictionId,
        outcome,
        closedAt: Date.now(),
        closedBy: adminAddress,
    });

    localStorage.setItem(OUTCOMES_KEY, JSON.stringify(filteredOutcomes));
}

/**
 * Get all prediction outcomes
 */
export function getAllOutcomes(): PredictionOutcome[] {
    if (typeof window === 'undefined') return [];

    const outcomesJson = localStorage.getItem(OUTCOMES_KEY);
    if (!outcomesJson) return [];

    try {
        return JSON.parse(outcomesJson);
    } catch {
        return [];
    }
}

/**
 * Get outcome for a specific prediction
 */
export function getPredictionOutcome(predictionId: number): PredictionOutcome | null {
    const outcomes = getAllOutcomes();
    return outcomes.find(o => o.predictionId === predictionId) || null;
}

/**
 * Check if a prediction is closed
 */
export function isPredictionClosed(predictionId: number): boolean {
    return getPredictionOutcome(predictionId) !== null;
}

/**
 * Reopen a prediction (remove outcome)
 */
export function reopenPrediction(predictionId: number): void {
    const outcomes = getAllOutcomes();
    const filteredOutcomes = outcomes.filter(o => o.predictionId !== predictionId);
    localStorage.setItem(OUTCOMES_KEY, JSON.stringify(filteredOutcomes));
}
