use crate::error::AppError;
use crate::middleware::auth::AuthContext;

/// Extract project_id from auth context or explicit parameter.
///
/// For Agent auth: uses the token's bound project ID (ignores explicit).
/// For User auth: requires explicit project_id parameter.
pub fn extract_project_id(auth: &AuthContext, explicit: Option<i32>) -> Result<i32, AppError> {
    match auth {
        AuthContext::Agent { project_id, .. } => Ok(*project_id),
        AuthContext::User { .. } => explicit.ok_or_else(|| {
            AppError::BadRequest("projectId is required for user authentication".into())
        }),
    }
}

/// Parse a comma-separated string into a Vec of trimmed, non-empty strings.
/// Useful for parsing multi-value query params like `status=todo,in-progress`.
pub fn parse_csv(value: &str) -> Vec<String> {
    value
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

/// Parse an optional comma-separated string. Returns None if input is None or empty.
pub fn parse_optional_csv(value: Option<&str>) -> Option<Vec<String>> {
    value.and_then(|v| {
        let parsed = parse_csv(v);
        if parsed.is_empty() { None } else { Some(parsed) }
    })
}

/// Validate a string field is within length bounds.
pub fn validate_length(field: &str, value: &str, min: usize, max: usize) -> Result<(), AppError> {
    let len = value.trim().len();
    if len < min || len > max {
        return Err(AppError::Validation(format!(
            "{} must be between {} and {} characters (got {})",
            field, min, max, len
        )));
    }
    Ok(())
}
