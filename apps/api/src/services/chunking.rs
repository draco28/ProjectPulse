// Content chunking strategies for the RAG pipeline.
//
// Three strategies, chosen by content type:
// - chunk_paragraphs — WikiPages: split on blank lines, merge until ~512 tokens
// - chunk_sections — SOPs/Documents: split on markdown headers, keep header with body
// - chunk_code_blocks — Skills: extract fenced code blocks as separate chunks

/// A single chunk produced by the chunking service.
#[derive(Debug, Clone)]
pub struct Chunk {
    /// The chunk text content.
    pub content: String,
    /// 0-based position within the source document.
    pub index: usize,
    /// Section title (from markdown header) if available.
    pub section_title: Option<String>,
    /// Type of chunk content.
    pub chunk_type: ChunkType,
}

/// Type of chunk content.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChunkType {
    /// Prose text (paragraphs, sections).
    Prose,
    /// Fenced code block.
    Code { language: Option<String> },
    /// Full document (no splitting applied).
    Full,
}

/// Split text on sentence boundaries (period, exclamation, question + space).
fn split_sentences(text: &str) -> Vec<&str> {
    let mut sentences = Vec::new();
    let mut start = 0;

    for (i, _) in text.match_indices(". ") {
        let end = i + 2; // include the ". "
        if end > start {
            sentences.push(&text[start..end]);
            start = end;
        }
    }

    // Remaining text
    if start < text.len() {
        sentences.push(&text[start..]);
    }

    if sentences.is_empty() {
        sentences.push(text);
    }

    sentences
}

/// Approximate token count using whitespace heuristic (~4 chars/token).
fn approx_tokens(text: &str) -> usize {
    // Split on whitespace for a rough count. More accurate than char/4
    // but avoids tiktoken dependency for MVP.
    text.split_whitespace().count()
}

/// Split text into paragraph-based chunks of ~max_tokens each.
///
/// Splits on double newlines (`\n\n`), then merges small paragraphs until
/// the chunk reaches ~max_tokens. Used for WikiPages.
pub fn chunk_paragraphs(text: &str, max_tokens: usize) -> Vec<Chunk> {
    if text.trim().is_empty() {
        return Vec::new();
    }

    let paragraphs: Vec<&str> = text.split("\n\n").collect();
    let mut chunks = Vec::new();
    let mut current = String::new();
    let mut current_tokens = 0;

    for para in &paragraphs {
        let para = para.trim();
        if para.is_empty() {
            continue;
        }

        let para_tokens = approx_tokens(para);

        // If adding this paragraph exceeds the limit and we have content, flush
        if current_tokens + para_tokens > max_tokens && !current.is_empty() {
            chunks.push(Chunk {
                content: current.trim().to_string(),
                index: chunks.len(),
                section_title: None,
                chunk_type: ChunkType::Prose,
            });
            current = String::new();
            current_tokens = 0;
        }

        // If a single paragraph exceeds max_tokens, split on sentence boundaries
        if para_tokens > max_tokens && current.is_empty() {
            let sentences = split_sentences(para);
            let mut sentence_buf = String::new();
            let mut sentence_tokens = 0;

            for sentence in &sentences {
                let s_tokens = approx_tokens(sentence);
                if sentence_tokens + s_tokens > max_tokens && !sentence_buf.is_empty() {
                    chunks.push(Chunk {
                        content: sentence_buf.trim().to_string(),
                        index: chunks.len(),
                        section_title: None,
                        chunk_type: ChunkType::Prose,
                    });
                    sentence_buf = String::new();
                    sentence_tokens = 0;
                }
                sentence_buf.push_str(sentence);
                sentence_buf.push(' ');
                sentence_tokens += s_tokens;
            }
            if !sentence_buf.trim().is_empty() {
                chunks.push(Chunk {
                    content: sentence_buf.trim().to_string(),
                    index: chunks.len(),
                    section_title: None,
                    chunk_type: ChunkType::Prose,
                });
            }
            continue;
        }

        if !current.is_empty() {
            current.push_str("\n\n");
        }
        current.push_str(para);
        current_tokens += para_tokens;
    }

    // Flush remaining
    if !current.trim().is_empty() {
        chunks.push(Chunk {
            content: current.trim().to_string(),
            index: chunks.len(),
            section_title: None,
            chunk_type: ChunkType::Prose,
        });
    }

    // If the whole document fits in one chunk, return as-is
    if chunks.is_empty() && !text.trim().is_empty() {
        chunks.push(Chunk {
            content: text.trim().to_string(),
            index: 0,
            section_title: None,
            chunk_type: ChunkType::Full,
        });
    }

    chunks
}

/// Split markdown into section-based chunks at header boundaries.
///
/// Each `# `, `## `, etc. header starts a new chunk. The header text
/// is preserved as `section_title` metadata. Used for SOPs and Documents.
pub fn chunk_sections(markdown: &str) -> Vec<Chunk> {
    if markdown.trim().is_empty() {
        return Vec::new();
    }

    let mut chunks = Vec::new();
    let mut current_title: Option<String> = None;
    let mut current_body = String::new();

    for line in markdown.lines() {
        let trimmed = line.trim_start();

        // Check if this line is a markdown header
        if trimmed.starts_with('#') {
            // Extract header level and title
            let header_text = trimmed.trim_start_matches('#').trim();

            // Flush previous section
            if !current_body.trim().is_empty() || current_title.is_some() {
                let content = if let Some(ref title) = current_title {
                    if current_body.trim().is_empty() {
                        // Header-only section (no body yet) — skip empty sections
                        // But set the new title below
                        String::new()
                    } else {
                        format!("{}\n\n{}", title, current_body.trim())
                    }
                } else {
                    current_body.trim().to_string()
                };

                if !content.is_empty() {
                    chunks.push(Chunk {
                        content,
                        index: chunks.len(),
                        section_title: current_title.take(),
                        chunk_type: ChunkType::Prose,
                    });
                }
            }

            current_title = Some(header_text.to_string());
            current_body = String::new();
        } else {
            current_body.push_str(line);
            current_body.push('\n');
        }
    }

    // Flush last section
    if !current_body.trim().is_empty() {
        chunks.push(Chunk {
            content: if let Some(ref title) = current_title {
                format!("{}\n\n{}", title, current_body.trim())
            } else {
                current_body.trim().to_string()
            },
            index: chunks.len(),
            section_title: current_title,
            chunk_type: ChunkType::Prose,
        });
    }

    // If no headers were found (only one chunk with no section title),
    // mark it as Full (no splitting applied).
    if chunks.len() == 1 && chunks[0].section_title.is_none() {
        chunks[0].chunk_type = ChunkType::Full;
    }

    // If nothing was flushed, return entire document as one chunk
    if chunks.is_empty() && !markdown.trim().is_empty() {
        chunks.push(Chunk {
            content: markdown.trim().to_string(),
            index: 0,
            section_title: None,
            chunk_type: ChunkType::Full,
        });
    }

    chunks
}

/// Smart chunking: section-based first, then split oversized sections via paragraphs.
///
/// Combines `chunk_sections` + `chunk_paragraphs` — sections provide semantic
/// boundaries, paragraphs handle sections that exceed `max_tokens`.
pub fn chunk_smart(markdown: &str, max_tokens: usize) -> Vec<Chunk> {
    let sections = chunk_sections(markdown);
    let mut result = Vec::new();

    for section in sections {
        let token_count = approx_tokens(&section.content);
        if token_count <= max_tokens + max_tokens / 4 {
            // Section fits within budget (with 25% overflow tolerance)
            result.push(Chunk {
                index: result.len(),
                ..section
            });
        } else {
            // Section too large — split into paragraphs
            let sub_chunks = chunk_paragraphs(&section.content, max_tokens);
            for sub in sub_chunks {
                result.push(Chunk {
                    content: sub.content,
                    index: result.len(),
                    section_title: section.section_title.clone(),
                    chunk_type: ChunkType::Prose,
                });
            }
        }
    }

    // Re-index
    for (i, chunk) in result.iter_mut().enumerate() {
        chunk.index = i;
    }

    result
}

/// Extract fenced code blocks as separate chunks, with surrounding prose.
///
/// Fenced blocks (``` or ~~~) become `ChunkType::Code` chunks with the
/// language tag preserved. Prose between code blocks becomes `ChunkType::Prose`
/// chunks. Used for Skills.
pub fn chunk_code_blocks(markdown: &str) -> Vec<Chunk> {
    if markdown.trim().is_empty() {
        return Vec::new();
    }

    let mut chunks = Vec::new();
    let mut current_prose = String::new();
    let mut in_code_block = false;
    let mut code_content = String::new();
    let mut code_language: Option<String> = None;

    for line in markdown.lines() {
        let trimmed = line.trim();

        if !in_code_block && (trimmed.starts_with("```") || trimmed.starts_with("~~~")) {
            // Flush prose before code block
            if !current_prose.trim().is_empty() {
                chunks.push(Chunk {
                    content: current_prose.trim().to_string(),
                    index: chunks.len(),
                    section_title: None,
                    chunk_type: ChunkType::Prose,
                });
                current_prose = String::new();
            }

            in_code_block = true;
            code_content = String::new();

            // Extract language from opening fence (e.g., ```rust)
            let fence_char = if trimmed.starts_with("```") { "```" } else { "~~~" };
            let lang = trimmed.trim_start_matches(fence_char).trim();
            code_language = if lang.is_empty() {
                None
            } else {
                Some(lang.to_string())
            };
        } else if in_code_block && (trimmed.starts_with("```") || trimmed.starts_with("~~~")) {
            // End of code block — flush as code chunk
            in_code_block = false;
            if !code_content.trim().is_empty() {
                chunks.push(Chunk {
                    content: code_content.trim().to_string(),
                    index: chunks.len(),
                    section_title: None,
                    chunk_type: ChunkType::Code {
                        language: code_language.take(),
                    },
                });
            }
            code_content = String::new();
        } else if in_code_block {
            code_content.push_str(line);
            code_content.push('\n');
        } else {
            current_prose.push_str(line);
            current_prose.push('\n');
        }
    }

    // Flush remaining prose
    if !current_prose.trim().is_empty() {
        chunks.push(Chunk {
            content: current_prose.trim().to_string(),
            index: chunks.len(),
            section_title: None,
            chunk_type: ChunkType::Prose,
        });
    }

    // Flush unclosed code block (malformed markdown)
    if in_code_block && !code_content.trim().is_empty() {
        chunks.push(Chunk {
            content: code_content.trim().to_string(),
            index: chunks.len(),
            section_title: None,
            chunk_type: ChunkType::Code {
                language: code_language,
            },
        });
    }

    // If nothing was chunked, return full document
    if chunks.is_empty() && !markdown.trim().is_empty() {
        chunks.push(Chunk {
            content: markdown.trim().to_string(),
            index: 0,
            section_title: None,
            chunk_type: ChunkType::Full,
        });
    }

    chunks
}

/// Return the entire document as a single chunk (no splitting).
/// Used for Tickets and KnowledgeItems that are typically short.
pub fn chunk_full(content: &str, title: Option<&str>) -> Vec<Chunk> {
    if content.trim().is_empty() {
        return Vec::new();
    }

    let full_content = if let Some(title) = title {
        format!("{}\n\n{}", title, content.trim())
    } else {
        content.trim().to_string()
    };

    vec![Chunk {
        content: full_content,
        index: 0,
        section_title: title.map(|t| t.to_string()),
        chunk_type: ChunkType::Full,
    }]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunk_paragraphs_splits_at_boundary() {
        // ~120 words per paragraph × 5 = ~600 words total
        let para = "This is a test paragraph with enough words to contribute meaningfully to the token count of a chunk when combined with other paragraphs in the document. ";
        let text = format!(
            "{0}\n\n{0}\n\n{0}\n\n{0}\n\n{0}",
            para.repeat(4) // ~480 words per block
        );

        let chunks = chunk_paragraphs(&text, 512);
        assert!(
            chunks.len() > 1,
            "should split into multiple chunks, got {}",
            chunks.len()
        );

        for chunk in &chunks {
            let tokens = approx_tokens(&chunk.content);
            assert!(
                tokens < 600,
                "chunk should be < 600 tokens (allowing overflow), got {}",
                tokens
            );
        }
    }

    #[test]
    fn test_chunk_paragraphs_small_doc_single_chunk() {
        let text = "A short document.\n\nWith two paragraphs.";
        let chunks = chunk_paragraphs(text, 512);
        assert_eq!(chunks.len(), 1);
        assert!(chunks[0].content.contains("short document"));
        assert!(chunks[0].content.contains("two paragraphs"));
    }

    #[test]
    fn test_chunk_sections_preserves_headers() {
        let md = "# Title\n\n## Section A\nContent A here.\n\n## Section B\nContent B here.\n";
        let chunks = chunk_sections(md);

        assert!(chunks.len() >= 2, "should have at least 2 sections, got {}", chunks.len());

        // Each chunk should have a section title
        for chunk in &chunks {
            assert!(
                chunk.section_title.is_some(),
                "chunk should have section_title: {:?}",
                chunk.content
            );
        }

        // Find section A
        let section_a = chunks.iter().find(|c| {
            c.section_title.as_deref() == Some("Section A")
        });
        assert!(section_a.is_some(), "should find Section A");
        assert!(
            section_a.unwrap().content.contains("Content A"),
            "Section A should contain its body"
        );
    }

    #[test]
    fn test_chunk_sections_no_headers_returns_full() {
        let md = "Just plain text\nwith no markdown headers at all.";
        let chunks = chunk_sections(md);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].chunk_type, ChunkType::Full);
    }

    #[test]
    fn test_chunk_code_blocks_extracts_code() {
        let md = r#"# Auth Pattern

Use the middleware:

```rust
fn auth_middleware(req: Request) -> Response {
    validate_jwt(req.token())
}
```

This ensures protection.

```python
def verify_token(token):
    return jwt.decode(token)
```
"#;
        let chunks = chunk_code_blocks(md);

        let code_chunks: Vec<&Chunk> = chunks
            .iter()
            .filter(|c| matches!(c.chunk_type, ChunkType::Code { .. }))
            .collect();

        assert_eq!(code_chunks.len(), 2, "should extract 2 code blocks");

        // Check language tags
        assert_eq!(
            code_chunks[0].chunk_type,
            ChunkType::Code { language: Some("rust".to_string()) }
        );
        assert_eq!(
            code_chunks[1].chunk_type,
            ChunkType::Code { language: Some("python".to_string()) }
        );

        // Prose chunks should also exist
        let prose_chunks: Vec<&Chunk> = chunks
            .iter()
            .filter(|c| c.chunk_type == ChunkType::Prose)
            .collect();
        assert!(!prose_chunks.is_empty(), "should have prose chunks");
    }

    #[test]
    fn test_chunk_code_blocks_no_code_returns_prose() {
        let md = "Just regular markdown text.\n\nNo code blocks here.";
        let chunks = chunk_code_blocks(md);
        assert_eq!(chunks.len(), 1);
        assert!(matches!(chunks[0].chunk_type, ChunkType::Prose | ChunkType::Full));
    }

    #[test]
    fn test_chunk_full_with_title() {
        let chunks = chunk_full("Fix the JWT bug", Some("Ticket: Auth Issue"));
        assert_eq!(chunks.len(), 1);
        assert!(chunks[0].content.starts_with("Ticket: Auth Issue"));
        assert!(chunks[0].content.contains("Fix the JWT bug"));
    }

    #[test]
    fn test_chunk_full_empty_returns_none() {
        let chunks = chunk_full("", None);
        assert!(chunks.is_empty());
    }

    #[test]
    fn test_approx_tokens() {
        assert_eq!(approx_tokens("one two three"), 3);
        assert_eq!(approx_tokens(""), 0);
        assert_eq!(approx_tokens("  spaced  out  "), 2);
    }
}
