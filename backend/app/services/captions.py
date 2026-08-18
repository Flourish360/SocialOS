"""Shared caption/hashtag helpers used everywhere SocialOS writes content on
a user's behalf: ecommerce captions, AI caption generation, and automation
auto-replies all route through these so #socialos stays consistently applied
without duplicating the append-and-dedupe logic at each call site."""

BRAND_TAG = "#socialos"


def ensure_hashtag_in_text(text: str, tag: str = BRAND_TAG) -> str:
    """Append tag to a caption/reply's text if it isn't already present."""
    if not text:
        return text
    if tag.lower() in text.lower():
        return text
    return text.rstrip() + f" {tag}"
