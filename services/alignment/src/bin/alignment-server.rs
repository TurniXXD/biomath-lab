use std::env;

use alignment::{needleman_wunsch, smith_waterman, AlignmentResult, Scoring};
use axum::{routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
enum AlignmentMode {
    Global,
    Local,
}

#[derive(Debug, Clone, Deserialize)]
struct AlignRequest {
    sequence_a: String,
    sequence_b: String,
    mode: AlignmentMode,
    #[serde(default)]
    scoring: Scoring,
}

#[derive(Debug, Clone, Serialize)]
struct AlignResponse {
    mode: AlignmentMode,
    sequence_a: String,
    sequence_b: String,
    scoring: Scoring,
    result: AlignmentResult,
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn align(Json(payload): Json<AlignRequest>) -> Json<AlignResponse> {
    let result = match payload.mode {
        AlignmentMode::Global => {
            needleman_wunsch(&payload.sequence_a, &payload.sequence_b, payload.scoring)
        }
        AlignmentMode::Local => {
            smith_waterman(&payload.sequence_a, &payload.sequence_b, payload.scoring)
        }
    };

    Json(AlignResponse {
        mode: payload.mode,
        sequence_a: payload.sequence_a,
        sequence_b: payload.sequence_b,
        scoring: payload.scoring,
        result,
    })
}

#[tokio::main]
async fn main() {
    let addr = env::var("ALIGNMENT_BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8200".to_string());
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|err| panic!("failed to bind {}: {}", addr, err));

    let app = Router::new()
        .route("/health", get(health))
        .route("/align", post(align));

    println!("alignment server listening on {}", addr);
    axum::serve(listener, app)
        .await
        .unwrap_or_else(|err| panic!("alignment server failed: {}", err));
}
