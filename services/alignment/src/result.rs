use std::fmt;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlignmentOp {
    // The aligned characters are the same, so this column contributes the
    // positive match score.
    Match,
    // The aligned characters differ, so this column contributes the mismatch
    // score.
    Mismatch,
    // A character exists in sequence A but not sequence B at this alignment
    // position.
    GapInA,
    // A character exists in sequence B but not sequence A at this alignment
    // position.
    GapInB,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AlignmentResult {
    // The reconstructed aligned form of the first sequence, including gap
    // characters inserted by the algorithm.
    pub aligned_a: String,
    // The reconstructed aligned form of the second sequence.
    pub aligned_b: String,
    // The best score found by the alignment dynamic program.
    pub score: i32,
    // Start and end positions of the aligned subsequence in A.
    pub start_a: usize,
    pub end_a: usize,
    // Start and end positions of the aligned subsequence in B.
    pub start_b: usize,
    pub end_b: usize,
    // Column-by-column operations corresponding to the final traceback.
    pub operations: Vec<AlignmentOp>,
}

impl fmt::Display for AlignmentResult {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // Keep the display output compact: the score and the aligned strings
        // are usually enough for a quick sanity check.
        writeln!(f, "score: {}", self.score)?;
        writeln!(
            f,
            "a: [{}..{}] {}",
            self.start_a, self.end_a, self.aligned_a
        )?;
        writeln!(
            f,
            "b: [{}..{}] {}",
            self.start_b, self.end_b, self.aligned_b
        )?;
        Ok(())
    }
}
