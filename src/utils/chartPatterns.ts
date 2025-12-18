export const CHART_PATTERNS = [
    // 1. Slow Climb
    [40, 42, 44, 46, 48, 50, 52, 54, 56, 58],
    // 2. Volatile Up
    [40, 35, 45, 40, 55, 50, 65, 60, 70, 75],
    // 3. Steady Decline
    [70, 68, 66, 64, 62, 60, 58, 56, 54, 52],
    // 4. Volatile Down
    [70, 75, 65, 70, 60, 65, 55, 50, 45, 40],
    // 5. The Pump (Hockey Stick)
    [30, 30, 31, 31, 32, 35, 40, 55, 75, 85],
    // 6. The Dump
    [80, 80, 79, 75, 70, 50, 40, 35, 30, 25],
    // 7. Cup and Handle
    [60, 50, 45, 40, 45, 50, 60, 58, 65, 70],
    // 8. Double Top
    [50, 70, 65, 70, 60, 55, 50, 45, 40, 35],
    // 9. Double Bottom
    [60, 40, 45, 40, 50, 55, 60, 65, 70, 75],
    // 10. Sideways Chop
    [50, 55, 45, 52, 48, 53, 47, 51, 49, 50],
    // 11. V-Shape Recovery
    [60, 50, 40, 30, 20, 30, 40, 50, 60, 70],
    // 12. Inverse V (Spike)
    [30, 40, 50, 60, 80, 60, 50, 40, 30, 20],
    // 13. Late Breaks
    [50, 50, 50, 50, 50, 50, 52, 65, 70, 75],
    // 14. Early Action then Flat
    [40, 60, 55, 65, 60, 60, 60, 60, 60, 60],
    // 15. Staircase Up
    [30, 30, 40, 40, 50, 50, 60, 60, 70, 70],
    // 16. Staircase Down
    [70, 70, 60, 60, 50, 50, 40, 40, 30, 30],
    // 17. The Sawtooth
    [40, 50, 40, 50, 40, 50, 40, 50, 40, 50],
    // 18. Gentle Waves
    [50, 55, 60, 55, 50, 45, 40, 45, 50, 55],
    // 19. The Dip Buy
    [50, 45, 40, 35, 45, 55, 60, 65, 70, 75],
    // 20. Chaos
    [20, 80, 30, 70, 40, 60, 50, 55, 45, 65]
];

export function getDeterministicPattern(id: number, targetEndValue: number): number[] {
    // Select pattern deterministically based on ID
    const patternIndex = Math.abs(id) % CHART_PATTERNS.length;
    const basePattern = [...CHART_PATTERNS[patternIndex]]; // Copy to clean mutation

    // Logic: We want the visual shape of the pattern, but we want it to END at the current price (targetEndValue).
    // We will calculate the offset needed to shift the last point to the targetEndValue.

    // 1. Get current last value of pattern
    const lastValue = basePattern[basePattern.length - 1];

    // 2. Calculate shift
    const shift = targetEndValue - lastValue;

    // 3. Shift all points and add some organic noise
    const shiftedPattern = basePattern.map((val, i) => {
        // Add more noise to the middle of the pattern, less to the ends
        const noiseFactor = Math.sin((i / basePattern.length) * Math.PI);
        const noise = (Math.sin(id + i) * 2 + Math.cos(id * i) * 1) * noiseFactor;

        const newVal = val + shift + noise;
        // Clamp between 0 and 100 to stay within logical bounds
        return Math.max(2, Math.min(98, newVal)); // Keep away from extreme edges for beauty
    });

    // 4. Force exact correlation on last point just in case clamping or noise messed it up slightly, 
    // ensuring the "current price" matches the end of the line.
    shiftedPattern[shiftedPattern.length - 1] = targetEndValue;

    return shiftedPattern;
}
