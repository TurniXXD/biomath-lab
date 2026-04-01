use std::env;

use alignment::{needleman_wunsch, smith_waterman, Scoring};

fn print_usage() {
    // Keep the CLI small and explicit. This is a learning crate, so the
    // commands are intentionally direct rather than hidden behind subcommands
    // or config files.
    eprintln!("Usage:");
    eprintln!("  alignment [--match N] [--mismatch N] [--gap N] global <seq-a> <seq-b>");
    eprintln!("  alignment [--match N] [--mismatch N] [--gap N] local <seq-a> <seq-b>");
    eprintln!("  alignment global <seq-a> <seq-b>");
    eprintln!("  alignment local <seq-a> <seq-b>");
    eprintln!("  alignment fasta <path>");
}

fn main() {
    // Read the command-line arguments after the binary name.
    // We collect them into a Vec so we can remove optional scoring flags
    // before interpreting the main command.
    let mut args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() {
        print_usage();
        return;
    }

    // Start with the default scoring scheme and allow the user to override it.
    let mut scoring = Scoring::default();

    // Scan through the argument list and strip out optional scoring flags.
    // This lets the user write either:
    //   alignment global ACGT AGT
    // or:
    //   alignment --match 2 --mismatch -1 --gap -2 global ACGT AGT
    let mut index = 0;
    while index < args.len() {
        match args[index].as_str() {
            "--match" if index + 1 < args.len() => {
                // If parsing fails, keep the previous default value.
                scoring.match_score = args[index + 1].parse().unwrap_or(scoring.match_score);
                args.drain(index..=index + 1);
            }
            "--mismatch" if index + 1 < args.len() => {
                // Negative values are common for mismatches, so we parse as i32.
                scoring.mismatch_score = args[index + 1].parse().unwrap_or(scoring.mismatch_score);
                args.drain(index..=index + 1);
            }
            "--gap" if index + 1 < args.len() => {
                // Gap penalties are also typically negative in simple scoring models.
                scoring.gap_penalty = args[index + 1].parse().unwrap_or(scoring.gap_penalty);
                args.drain(index..=index + 1);
            }
            _ => {
                // Leave unrelated arguments in place.
                index += 1;
            }
        }
    }

    if args.is_empty() {
        print_usage();
        return;
    }

    match args[0].as_str() {
        "global" if args.len() == 3 => {
            // Needleman-Wunsch performs global alignment, meaning it tries to
            // align the entire length of both input sequences.
            let result = needleman_wunsch(&args[1], &args[2], scoring);
            println!("{}", result);
        }
        "local" if args.len() == 3 => {
            // Smith-Waterman performs local alignment, meaning it finds the
            // best matching subsections rather than forcing an end-to-end match.
            let result = smith_waterman(&args[1], &args[2], scoring);
            println!("{}", result);
        }
        "fasta" if args.len() == 2 => match alignment::fasta::read_fasta_file(&args[1]) {
            Ok(records) => {
                // Print the records in a normalized format so the parser can be
                // visually verified from the terminal.
                for record in records {
                    println!(">{}\n{}", record.header, record.sequence);
                }
            }
            Err(err) => {
                eprintln!("error: {}", err);
            }
        },
        _ => print_usage(),
    }
}
