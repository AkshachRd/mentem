use fsrs::{ComputeParametersInput, DEFAULT_PARAMETERS, FSRS, FSRSItem, FSRSReview, MemoryState, NextStates};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardSrsData {
    pub stability: Option<f32>,
    pub difficulty: Option<f32>,
    pub elapsed_days: u32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleResult {
    pub stability: f32,
    pub difficulty: f32,
    pub interval: f32,
}

#[derive(Serialize, Deserialize)]
pub struct NextStatesPreview {
    pub again: ScheduleResult,
    pub hard: ScheduleResult,
    pub good: ScheduleResult,
    pub easy: ScheduleResult,
}

/// A single review log entry from the frontend JSONL
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReviewLogEntry {
    card_id: String,
    rating: u32,
    elapsed: u32,
}

fn item_to_result(state: &fsrs::ItemState) -> ScheduleResult {
    ScheduleResult {
        stability: state.memory.stability,
        difficulty: state.memory.difficulty,
        interval: state.interval,
    }
}

fn build_memory_state(data: &CardSrsData) -> Option<MemoryState> {
    match (data.stability, data.difficulty) {
        (Some(s), Some(d)) => Some(MemoryState {
            stability: s,
            difficulty: d,
        }),
        _ => None,
    }
}

fn make_fsrs(parameters: Option<&[f32]>) -> FSRS {
    let params = parameters.unwrap_or(&DEFAULT_PARAMETERS);
    FSRS::new(Some(params)).expect("FSRS init failed")
}

fn next_states_to_preview(ns: NextStates) -> NextStatesPreview {
    NextStatesPreview {
        again: item_to_result(&ns.again),
        hard: item_to_result(&ns.hard),
        good: item_to_result(&ns.good),
        easy: item_to_result(&ns.easy),
    }
}

#[tauri::command]
pub fn srs_get_next_states(
    card_srs_data: CardSrsData,
    desired_retention: Option<f32>,
    parameters: Option<Vec<f32>>,
) -> Result<NextStatesPreview, String> {
    let fsrs = make_fsrs(parameters.as_deref());
    let memory = build_memory_state(&card_srs_data);
    let retention = desired_retention.unwrap_or(0.9);

    let ns = fsrs
        .next_states(memory, retention, card_srs_data.elapsed_days)
        .map_err(|e| format!("{e:?}"))?;

    Ok(next_states_to_preview(ns))
}

#[tauri::command]
pub fn srs_schedule_review(
    card_srs_data: CardSrsData,
    rating: u8,
    desired_retention: Option<f32>,
    parameters: Option<Vec<f32>>,
) -> Result<ScheduleResult, String> {
    let fsrs = make_fsrs(parameters.as_deref());
    let memory = build_memory_state(&card_srs_data);
    let retention = desired_retention.unwrap_or(0.9);

    let ns = fsrs
        .next_states(memory, retention, card_srs_data.elapsed_days)
        .map_err(|e| format!("{e:?}"))?;

    let chosen = match rating {
        1 => &ns.again,
        2 => &ns.hard,
        4 => &ns.easy,
        _ => &ns.good,
    };

    Ok(item_to_result(chosen))
}

/// Optimize FSRS parameters from review history.
/// Reads a JSONL string of review log entries, groups by card,
/// builds FSRSItems and trains the model.
#[tauri::command]
pub fn srs_optimize(review_log_jsonl: String) -> Result<Vec<f32>, String> {
    // Parse JSONL into entries
    let entries: Vec<ReviewLogEntry> = review_log_jsonl
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|l| serde_json::from_str(l))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("parse error: {e}"))?;

    if entries.is_empty() {
        return Ok(DEFAULT_PARAMETERS.to_vec());
    }

    // Group by card_id, preserving order
    let mut card_reviews: HashMap<String, Vec<&ReviewLogEntry>> = HashMap::new();
    for entry in &entries {
        card_reviews
            .entry(entry.card_id.clone())
            .or_default()
            .push(entry);
    }

    // Convert to FSRSItems
    let train_set: Vec<FSRSItem> = card_reviews
        .values()
        .filter(|reviews| reviews.len() >= 2) // need at least 2 reviews
        .map(|reviews| {
            let fsrs_reviews: Vec<FSRSReview> = reviews
                .iter()
                .enumerate()
                .map(|(i, r)| FSRSReview {
                    rating: r.rating.clamp(1, 4),
                    delta_t: if i == 0 { 0 } else { r.elapsed },
                })
                .collect();
            FSRSItem {
                reviews: fsrs_reviews,
            }
        })
        .collect();

    if train_set.is_empty() {
        return Ok(DEFAULT_PARAMETERS.to_vec());
    }

    let fsrs = FSRS::new(Some(&DEFAULT_PARAMETERS)).map_err(|e| format!("{e:?}"))?;

    let params = fsrs
        .compute_parameters(ComputeParametersInput {
            train_set,
            progress: None,
            enable_short_term: true,
            num_relearning_steps: None,
        })
        .map_err(|e| format!("optimize error: {e:?}"))?;

    Ok(params)
}
