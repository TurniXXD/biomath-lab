pub mod algorithms;
pub mod fasta;
pub mod result;
pub mod scoring;

// Re-export the most useful entry points so the binary and future tests can
// call into the library without reaching deep into module internals.
pub use algorithms::{needleman_wunsch, smith_waterman};
pub use result::{AlignmentOp, AlignmentResult};
pub use scoring::Scoring;
