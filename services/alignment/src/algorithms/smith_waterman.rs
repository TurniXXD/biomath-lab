use crate::result::{AlignmentOp, AlignmentResult};
use crate::scoring::Scoring;

pub fn smith_waterman(a: &str, b: &str, scoring: Scoring) -> AlignmentResult {
    // Same character-vector conversion as the global aligner, for the same
    // reason: indexed access is simpler for dynamic programming.
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let rows = a_chars.len() + 1;
    let cols = b_chars.len() + 1;

    // Local alignment uses a DP table with a zero floor. Negative scores do not
    // carry forward, which allows the algorithm to restart at any position.
    let mut dp = vec![vec![0; cols]; rows];
    let mut best_score = 0;
    let mut best_pos = (0usize, 0usize);

    for i in 1..rows {
        for j in 1..cols {
            // Evaluate the same three moves as Needleman-Wunsch, then clamp the
            // result at zero to prevent negative score propagation.
            let diagonal = dp[i - 1][j - 1] + scoring.pair_score(a_chars[i - 1], b_chars[j - 1]);
            let up = dp[i - 1][j] + scoring.gap_penalty;
            let left = dp[i][j - 1] + scoring.gap_penalty;
            let value = 0.max(diagonal).max(up).max(left);
            dp[i][j] = value;

            // Track the highest-scoring cell; traceback starts there instead of
            // at the matrix edge.
            if value > best_score {
                best_score = value;
                best_pos = (i, j);
            }
        }
    }

    // Traceback begins at the best-scoring cell and stops when the score drops
    // to zero, which marks the edge of the best local region.
    let mut i = best_pos.0;
    let mut j = best_pos.1;
    let end_a = i;
    let end_b = j;
    let mut aligned_a = Vec::new();
    let mut aligned_b = Vec::new();
    let mut operations = Vec::new();

    while i > 0 && j > 0 && dp[i][j] > 0 {
        // The traceback checks which predecessor can explain the current score.
        if dp[i][j] == dp[i - 1][j - 1] + scoring.pair_score(a_chars[i - 1], b_chars[j - 1]) {
            // Diagonal move: both sequences contribute a character.
            let op = if a_chars[i - 1] == b_chars[j - 1] {
                AlignmentOp::Match
            } else {
                AlignmentOp::Mismatch
            };
            aligned_a.push(a_chars[i - 1]);
            aligned_b.push(b_chars[j - 1]);
            operations.push(op);
            i -= 1;
            j -= 1;
        } else if dp[i][j] == dp[i - 1][j] + scoring.gap_penalty {
            // Up move: align a character from A against a gap.
            aligned_a.push(a_chars[i - 1]);
            aligned_b.push('-');
            operations.push(AlignmentOp::GapInB);
            i -= 1;
        } else {
            // Left move: align a character from B against a gap.
            aligned_a.push('-');
            aligned_b.push(b_chars[j - 1]);
            operations.push(AlignmentOp::GapInA);
            j -= 1;
        }
    }

    // Reverse the traceback output because we collected it backwards.
    aligned_a.reverse();
    aligned_b.reverse();
    operations.reverse();

    // The start positions are where traceback stopped.
    AlignmentResult {
        aligned_a: aligned_a.into_iter().collect(),
        aligned_b: aligned_b.into_iter().collect(),
        score: best_score,
        start_a: i,
        end_a,
        start_b: j,
        end_b,
        operations,
    }
}
