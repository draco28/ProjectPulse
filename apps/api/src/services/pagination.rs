use serde::{Deserialize, Serialize};

/// Query parameters for paginated list endpoints.
///
/// Usage in route handlers:
/// ```ignore
/// pub async fn list_items(Query(params): Query<PaginationParams>) -> ...
/// ```
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationParams {
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

/// Validated, clamped pagination values ready for SQL queries.
#[derive(Debug, Clone)]
pub struct Pagination {
    pub page: i32,
    pub page_size: i32,
}

impl Pagination {
    /// Create validated pagination from raw query params.
    /// Defaults: page=1, page_size=20. Clamps page_size to 1..=100.
    pub fn from_params(page: Option<i32>, page_size: Option<i32>) -> Self {
        let page = page.unwrap_or(1).max(1);
        let page_size = page_size.unwrap_or(20).clamp(1, 100);
        Self { page, page_size }
    }

    /// SQL OFFSET value (0-indexed).
    pub fn offset(&self) -> i64 {
        ((self.page - 1) * self.page_size) as i64
    }

    /// SQL LIMIT value.
    pub fn limit(&self) -> i64 {
        self.page_size as i64
    }

    /// Build pagination metadata from a total count.
    pub fn meta(&self, total: i64) -> PaginationMeta {
        PaginationMeta {
            page: self.page,
            page_size: self.page_size,
            total,
            total_pages: ((total as f64) / (self.page_size as f64)).ceil() as i32,
        }
    }
}

impl From<PaginationParams> for Pagination {
    fn from(params: PaginationParams) -> Self {
        Self::from_params(params.page, params.page_size)
    }
}

/// Pagination metadata included in list responses.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationMeta {
    pub page: i32,
    pub page_size: i32,
    pub total: i64,
    pub total_pages: i32,
}

/// Paginated response envelope for list endpoints.
///
/// Serializes as: `{ "items": [...], "pagination": { page, pageSize, total, totalPages } }`
/// Wrapped by ApiResponse: `{ "data": { "items": [...], "pagination": {...} }, "error": null }`
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResponse<T: Serialize> {
    pub items: Vec<T>,
    pub pagination: PaginationMeta,
}

impl<T: Serialize> PaginatedResponse<T> {
    pub fn new(items: Vec<T>, pagination: &Pagination, total: i64) -> Self {
        Self {
            items,
            pagination: pagination.meta(total),
        }
    }
}
