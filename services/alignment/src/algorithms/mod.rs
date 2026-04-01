mod needleman_wunsch;
mod smith_waterman;

// Keep the public surface area small: callers only need the algorithm entry
// points, not the internal module layout.
pub use needleman_wunsch::needleman_wunsch;
pub use smith_waterman::smith_waterman;
