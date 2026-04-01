use crate::result::{AlignmentOp, AlignmentResult};
use crate::scoring::Scoring;

pub fn needleman_wunsch(a: &str, b: &str, scoring: Scoring) -> AlignmentResult {
    // Convert the strings to vectors of characters so we can index them by
    // position during dynamic-programming and traceback steps.
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let rows = a_chars.len() + 1;
    let cols = b_chars.len() + 1;

    // dp[i][j] stores the best score for aligning the first i chars of A with
    // the first j chars of B.
    let mut dp = vec![vec![0; cols]; rows];

    // Initialize the first column: aligning a prefix of A to an empty B means
    // paying one gap penalty per character.
    for i in 1..rows {
        dp[i][0] = dp[i - 1][0] + scoring.gap_penalty;
    }
    // Initialize the first row for the symmetric case.
    for j in 1..cols {
        dp[0][j] = dp[0][j - 1] + scoring.gap_penalty;
    }

    // Fill the DP table from top-left to bottom-right.
    for i in 1..rows {
        for j in 1..cols {
            // Three choices for each cell:
            // - diagonal: align the next characters
            // - up: align a character from A to a gap
            // - left: align a character from B to a gap
            let diagonal = dp[i - 1][j - 1] + scoring.pair_score(a_chars[i - 1], b_chars[j - 1]);
            let up = dp[i - 1][j] + scoring.gap_penalty;
            let left = dp[i][j - 1] + scoring.gap_penalty;
            dp[i][j] = diagonal.max(up).max(left);
        }
    }

    // Start traceback from the bottom-right corner because global alignment
    // must consume both entire sequences.
    let mut i = a_chars.len();
    let mut j = b_chars.len();
    let end_a = i;
    let end_b = j;
    let mut aligned_a = Vec::new();
    let mut aligned_b = Vec::new();
    let mut operations = Vec::new();

    while i > 0 || j > 0 {
        // Prefer the diagonal move when it explains the score. This produces a
        // natural traceback path through the DP table.
        if i > 0
            && j > 0
            && dp[i][j]
                == dp[i - 1][j - 1] + scoring.pair_score(a_chars[i - 1], b_chars[j - 1])
        {
            // Diagonal means both sequences contribute a real character.
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
        } else if i > 0 && dp[i][j] == dp[i - 1][j] + scoring.gap_penalty {
            // Up means A contributes a character and B contributes a gap.
            aligned_a.push(a_chars[i - 1]);
            aligned_b.push('-');
            operations.push(AlignmentOp::GapInB);
            i -= 1;
        } else if j > 0 {
            // Left means B contributes a character and A contributes a gap.
            aligned_a.push('-');
            aligned_b.push(b_chars[j - 1]);
            operations.push(AlignmentOp::GapInA);
            j -= 1;
        }
    }

    // Traceback builds the alignment backwards, so reverse the results before
    // returning them to the caller.
    aligned_a.reverse();
    aligned_b.reverse();
    operations.reverse();

    // Convert the vectors of characters back into strings for display.
    AlignmentResult {
        aligned_a: aligned_a.into_iter().collect(),
        aligned_b: aligned_b.into_iter().collect(),
        score: dp[end_a][end_b],
        start_a: 0,
        end_a,
        start_b: 0,
        end_b,
        operations,
    }
}
