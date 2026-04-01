use std::fmt;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FastaRecord {
    // The text after the `>` line.
    pub header: String,
    // The concatenated sequence lines for this record.
    pub sequence: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FastaError {
    // We saw a sequence line before any header line.
    MissingHeader,
    // The input was empty or only whitespace.
    EmptyInput,
    // Wrapper for file-system read failures.
    Io(String),
}

impl fmt::Display for FastaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FastaError::MissingHeader => write!(f, "FASTA sequence data appeared before a header"),
            FastaError::EmptyInput => write!(f, "FASTA input was empty"),
            FastaError::Io(message) => write!(f, "I/O error: {}", message),
        }
    }
}

impl std::error::Error for FastaError {}

pub fn parse_fasta(input: &str) -> Result<Vec<FastaRecord>, FastaError> {
    // An empty string is usually a caller error, so return a dedicated
    // diagnostic instead of silently producing no records.
    if input.trim().is_empty() {
        return Err(FastaError::EmptyInput);
    }

    // We build records incrementally because FASTA files are line-oriented and
    // sequence text may span multiple lines.
    let mut records = Vec::new();
    let mut current_header: Option<String> = None;
    let mut current_sequence = String::new();

    for line in input.lines() {
        // Ignore blank lines so small formatting differences do not matter.
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if let Some(rest) = line.strip_prefix('>') {
            // When we hit a new header, flush the previous record first.
            if let Some(header) = current_header.take() {
                records.push(FastaRecord {
                    header,
                    sequence: std::mem::take(&mut current_sequence),
                });
            }
            // Store only the header text after the `>` marker.
            current_header = Some(rest.trim().to_string());
        } else if current_header.is_some() {
            // Sequence lines are simply concatenated; FASTA allows line wraps.
            current_sequence.push_str(line);
        } else {
            // Sequence data before the first header is invalid FASTA.
            return Err(FastaError::MissingHeader);
        }
    }

    if let Some(header) = current_header {
        // Flush the final record after the loop ends.
        records.push(FastaRecord {
            header,
            sequence: current_sequence,
        });
    }

    Ok(records)
}

pub fn read_fasta_file<P: AsRef<Path>>(path: P) -> Result<Vec<FastaRecord>, FastaError> {
    // Keep the file-reading wrapper thin so the parser stays independently
    // testable from in-memory strings.
    let content = fs::read_to_string(path).map_err(|err| FastaError::Io(err.to_string()))?;
    parse_fasta(&content)
}
