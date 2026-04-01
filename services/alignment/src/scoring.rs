use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Scoring {
    // Reward for matching characters.
    pub match_score: i32,
    // Penalty for mismatching characters.
    pub mismatch_score: i32,
    // Penalty for introducing a single gap.
    pub gap_penalty: i32,
}

impl Scoring {
    pub fn new(match_score: i32, mismatch_score: i32, gap_penalty: i32) -> Self {
        Self {
            match_score,
            mismatch_score,
            gap_penalty,
        }
    }

    pub fn pair_score(&self, a: char, b: char) -> i32 {
        // This keeps the scoring rule centralized. If we change the notion of a
        // match later, the algorithms do not need to know about the details.
        if a == b {
            self.match_score
        } else {
            self.mismatch_score
        }
    }
}

impl Default for Scoring {
    fn default() -> Self {
        // A simple textbook scoring model that is good enough for learning and
        // for the first pass of both algorithms.
        Self {
            match_score: 1,
            mismatch_score: -1,
            gap_penalty: -1,
        }
    }
}
