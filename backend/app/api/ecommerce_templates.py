"""
Sale caption templates — each entry is a named style with per-platform
prompt instructions sent to Claude when generating a sold-item post.

Auto-selection logic (used when the caller does not specify a template):
  - is_unique == True              → "unique_item"  (one-of-a-kind, no restock language)
  - units_remaining == 0           → "sold_out"     (mass product, restock possible)
  - units_remaining <= 5           → "scarcity"
  - buyer_location is provided     → "social_proof"
  - quantity_sold % 10 == 0        → "milestone"
  - default                        → "hype"

Callers can override by passing  "template": "<key>"  in the request body.
Set  "is_unique": true  in the sale payload for handmade, vintage, or single-run items.
"""

from typing import TypedDict


class SaleTemplate(TypedDict):
    name: str
    description: str
    instagram: str
    tiktok: str
    twitter: str
    linkedin: str
    facebook: str


# ── Template definitions ───────────────────────────────────────────────────────

SALE_TEMPLATES: dict[str, SaleTemplate] = {

    # 1. Scarcity — few units left, create urgency
    "scarcity": SaleTemplate(
        name="Scarcity",
        description="Urgency-driven post when stock is running low",
        instagram=(
            "Write an Instagram caption for a product that just sold and has very few units remaining. "
            "Lead with the scarcity (e.g. 'Only {units_remaining} left!'). "
            "Include the product name and price. Add 5–8 relevant hashtags. "
            "End with a strong CTA like 'Grab yours before it's gone — link in bio.' "
            "Use 1–2 urgency emojis (⏳ 🔥 🚨). Keep it under 200 characters before hashtags."
        ),
        tiktok=(
            "Write a TikTok caption for a product that just sold and is almost out of stock. "
            "Open with a hook (e.g. 'POV: you almost missed this 😭'). "
            "Mention units remaining and drop the product name. "
            "End with a CTA to check the link in bio. Max 150 characters. 2–3 emojis."
        ),
        twitter=(
            "Write a tweet (under 240 characters) announcing a product just sold and stock is critical. "
            "Format: [scarcity signal] + [product name] + [price] + [CTA link or 'link in bio']. "
            "Use 1 urgency emoji. No hashtags unless they fit naturally."
        ),
        linkedin=(
            "Write a LinkedIn post announcing that a product sold and is nearly out of stock. "
            "Professional but exciting tone. Mention the product name, price, and scarcity. "
            "Frame it as a demand signal — 'The market has spoken.' "
            "End with a link CTA. No hashtags. 2–3 sentences max."
        ),
        facebook=(
            "Write a Facebook post for a product that just sold with very few units left. "
            "Conversational, excited tone. Include product name, price, units remaining. "
            "Add a clear CTA. 1–2 emojis. Under 180 characters."
        ),
    ),

    # 2. Social proof — someone just bought it, emphasise the purchase
    "social_proof": SaleTemplate(
        name="Social Proof",
        description="Highlights real purchase activity to build trust",
        instagram=(
            "Write an Instagram caption announcing someone just purchased a product. "
            "If a buyer location is available, use it (e.g. 'Just shipped to New York!'). "
            "Make it feel like live social proof — real people buying in real time. "
            "Include the product name. Add 4–6 hashtags. End with 'Shop now — link in bio.' "
            "Use emojis that feel celebratory (📦 🛍️ ✅). Under 180 characters before hashtags."
        ),
        tiktok=(
            "Write a TikTok caption showing live purchase proof. "
            "Start with something like 'Another one just sold 🛒' or 'People are loving this'. "
            "If buyer location is available, include it. Keep it punchy — under 120 characters. "
            "End with a CTA. 1–2 emojis."
        ),
        twitter=(
            "Write a tweet (under 240 characters) as live purchase proof. "
            "Format: [purchase signal] + [product name] + [optional location] + [CTA]. "
            "Conversational, real-time feel. 1 emoji max."
        ),
        linkedin=(
            "Write a short LinkedIn post showing that a customer just purchased your product. "
            "Cite the buyer location if available. Frame it as demand validation. "
            "Professional, warm tone. 2–3 sentences. No hashtags."
        ),
        facebook=(
            "Write a Facebook post announcing a live sale. Use the buyer location if available. "
            "Friendly, real-time tone. Include product name. 1–2 emojis. Under 160 characters."
        ),
    ),

    # 3. Hype — general excitement, works as the default
    "hype": SaleTemplate(
        name="Hype",
        description="High-energy celebratory post for any sale",
        instagram=(
            "Write an energetic Instagram caption celebrating a product sale. "
            "Open with excitement. Include the product name and price. "
            "Use 3–4 hype emojis (🔥 💥 🎉 👟 depending on the product category). "
            "Add 6–8 relevant hashtags. End with a buy CTA. Under 200 characters before hashtags."
        ),
        tiktok=(
            "Write a hype TikTok caption for a product that just sold. "
            "Start with an attention hook. Keep it energetic and short — under 130 characters. "
            "2–3 trending-style emojis. CTA at the end."
        ),
        twitter=(
            "Write an excited tweet (under 240 characters) about a product sale. "
            "Short, punchy, celebratory. Include product name. 1–2 emojis. "
            "End with a link or 'link in bio'."
        ),
        linkedin=(
            "Write a LinkedIn post celebrating a product sale with a professional but enthusiastic tone. "
            "Include product name. Frame as a business win. 2–3 sentences. No hashtags."
        ),
        facebook=(
            "Write an upbeat Facebook post about a product just selling. "
            "Fun, casual, include product name and a CTA. 1–2 emojis. Under 160 characters."
        ),
    ),

    # 4. Milestone — celebrate hitting a sales number (10th, 50th, 100th sale)
    "milestone": SaleTemplate(
        name="Milestone",
        description="Celebrates reaching a sales count milestone",
        instagram=(
            "Write an Instagram caption celebrating a sales milestone for a product. "
            "Highlight the milestone number (e.g. '50 sold! 🎊'). Include the product name. "
            "Thank the community. Add a CTA to keep the momentum going — link in bio. "
            "5–7 hashtags. Use celebratory emojis (🎉 🏆 💯). Under 200 characters before hashtags."
        ),
        tiktok=(
            "Write a TikTok caption celebrating a sales milestone. "
            "Start with the milestone (e.g. 'We just hit [number] sales 🏆'). "
            "Thank your audience. Keep it under 130 characters. 2–3 emojis. CTA at end."
        ),
        twitter=(
            "Write a tweet (under 240 characters) celebrating a sales milestone. "
            "Lead with the number. Thank the buyers. Include product name. 1–2 emojis."
        ),
        linkedin=(
            "Write a LinkedIn post celebrating a product milestone sale. "
            "Professional gratitude tone. Mention the milestone number and product. "
            "Credit the community/customers. 3–4 sentences. No hashtags."
        ),
        facebook=(
            "Write a Facebook post celebrating a sales milestone. "
            "Warm and grateful tone. Include the number and product name. "
            "Thank your community. 1–2 emojis. Under 180 characters."
        ),
    ),

    # 5. Sold out — all units gone, build FOMO and capture future interest
    "sold_out": SaleTemplate(
        name="Sold Out",
        description="Announces a product is fully sold out, drives waitlist signups",
        instagram=(
            "Write an Instagram caption announcing a product just sold out. "
            "Open with the sold-out news (e.g. 'It's GONE 😱'). Include the product name. "
            "Build FOMO. Tell followers to follow or drop their email for restock notifications. "
            "5–8 hashtags. Use emojis like 😱 🚫 🙏. Under 200 characters before hashtags."
        ),
        tiktok=(
            "Write a TikTok caption for a sold-out product. "
            "Start with shock (e.g. 'We sold out faster than expected 😭'). "
            "Tell viewers to follow for restock alerts. Under 130 characters. 2–3 emojis."
        ),
        twitter=(
            "Write a tweet (under 240 characters) announcing a product sold out. "
            "FOMO tone. Tell people to follow for restock news. 1–2 emojis."
        ),
        linkedin=(
            "Write a LinkedIn post announcing a product sold out. "
            "Frame as strong market demand. Note restock plans if available. "
            "Professional but excited. 2–3 sentences. No hashtags."
        ),
        facebook=(
            "Write a Facebook sold-out announcement. "
            "Friendly, grateful tone. Tell followers to comment or sign up for restock alerts. "
            "Include product name. 1–2 emojis. Under 160 characters."
        ),
    ),

    # 6. Unique / one-of-a-kind — handmade, vintage, art, single-run items
    "unique_item": SaleTemplate(
        name="Unique Item Sold",
        description="For one-of-a-kind items that will never be restocked",
        instagram=(
            "Write an Instagram caption announcing a one-of-a-kind item just sold. "
            "This is not a mass-produced product — it is unique, handmade, vintage, or a single piece. "
            "Celebrate the exclusivity and the lucky buyer. "
            "Do NOT mention restocking, waitlists, or 'more coming soon' — this item is gone forever. "
            "Use language like 'found its forever home', 'one lucky person', or 'this one was truly special'. "
            "Include the product name. Add 5–7 relevant hashtags (e.g. #OneOfAKind #HandmadeWithLove). "
            "2–3 emojis that feel artisan or special (🎨 ✨ 🖤). Under 200 characters before hashtags."
        ),
        tiktok=(
            "Write a TikTok caption for a unique item that just sold and will never return. "
            "Open with the exclusivity angle (e.g. 'This one was truly one of one 🖤'). "
            "Celebrate the buyer. Do NOT hint at restocks. Under 130 characters. 2 emojis."
        ),
        twitter=(
            "Write a tweet (under 240 characters) for a one-of-a-kind item that just sold. "
            "Tone: bittersweet celebration — happy it found a home, sad it's gone forever. "
            "Include product name. No restock language. 1–2 emojis."
        ),
        linkedin=(
            "Write a LinkedIn post about a unique, one-of-a-kind item that just sold. "
            "Frame it as a craft or artisan story — the work finding the right person. "
            "Do not mention restocking. Professional but personal. 2–3 sentences. No hashtags."
        ),
        facebook=(
            "Write a Facebook post celebrating a unique item finding its new home. "
            "Warm, heartfelt tone. Include product name. No restock mentions. "
            "1–2 emojis. Under 160 characters."
        ),
    ),

    # 7. FOMO — catch people who are hesitating
    "fomo": SaleTemplate(
        name="FOMO",
        description="Targets hesitant shoppers with fear-of-missing-out messaging",
        instagram=(
            "Write an Instagram caption designed to trigger FOMO on a product that just sold. "
            "Address the hesitant buyer directly (e.g. 'Still thinking about it?'). "
            "Mention the product name, price, and units remaining if low. "
            "Add a CTA: 'Don't be the one who waited — link in bio.' "
            "5–7 hashtags. 2–3 emojis. Under 200 characters before hashtags."
        ),
        tiktok=(
            "Write a TikTok FOMO caption for a product that keeps selling. "
            "Call out the hesitant viewer. Keep it under 130 characters. "
            "2 emojis. Strong CTA."
        ),
        twitter=(
            "Write a FOMO tweet (under 240 characters) about a product selling fast. "
            "Target the fence-sitter. Include product name. 1 emoji. End with a CTA."
        ),
        linkedin=(
            "Write a LinkedIn post creating professional FOMO around a fast-selling product. "
            "Data-driven angle: 'Units are moving — here's what people are saying yes to.' "
            "2–3 sentences. No hashtags."
        ),
        facebook=(
            "Write a Facebook post creating FOMO around a product that just sold. "
            "Friendly nudge tone. Include product name and price. "
            "1–2 emojis. CTA at end. Under 160 characters."
        ),
    ),
}


# ── Auto-select logic ──────────────────────────────────────────────────────────

def pick_template(
    units_remaining: int | None,
    buyer_location: str | None,
    quantity_sold: int,
    is_unique: bool = False,
    override: str | None = None,
) -> str:
    """Return the template key to use for a given sale event.

    Priority order:
      1. Explicit override from the request body
      2. Unique/one-of-a-kind items (never restock messaging)
      3. Sold out (with potential restock)
      4. Scarcity (very few left)
      5. Social proof (buyer location available)
      6. Milestone (every 10th sale)
      7. Hype (default)
    """
    if override and override in SALE_TEMPLATES:
        return override
    if is_unique:
        return "unique_item"
    if units_remaining is not None and units_remaining == 0:
        return "sold_out"
    if units_remaining is not None and units_remaining <= 5:
        return "scarcity"
    if buyer_location:
        return "social_proof"
    if quantity_sold > 0 and quantity_sold % 10 == 0:
        return "milestone"
    return "hype"


def get_platform_prompt(template_key: str, platform: str) -> str:
    """Return the prompt string for a given template + platform combo."""
    template = SALE_TEMPLATES.get(template_key, SALE_TEMPLATES["hype"])
    return template.get(platform, template["instagram"])
