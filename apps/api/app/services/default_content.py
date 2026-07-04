from uuid import uuid4

from app.schemas.admin import OnboardingRequest


def slugify(value: str) -> str:
    cleaned = "".join(char.lower() if char.isalnum() else "-" for char in value)
    return "-".join(part for part in cleaned.split("-") if part)


def default_home_sections(payload: OnboardingRequest) -> list[dict]:
    service_items = [
        {
            "title": service,
            "description": f"Guided {service.lower()} support for businesses in {payload.city}.",
            "icon": "FileCheck2",
        }
        for service in payload.services
    ]

    return [
        {
            "id": str(uuid4()),
            "section_type": "hero",
            "position": 1,
            "is_visible": True,
            "variant": "image_right",
            "content_json": {
                "eyebrow": "Trusted CA Services",
                "title": f"Trusted Tax, GST and Compliance Support in {payload.city}",
                "description": f"{payload.firmName} helps clients keep tax, GST, bookkeeping and compliance work moving with confidence.",
                "primary_cta": {"label": "Book a consultation", "href": "#contact"},
                "secondary_cta": {"label": "View services", "href": "/services"},
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "trust_stats",
            "position": 2,
            "is_visible": True,
            "variant": "cards",
            "content_json": {
                "heading": "Reliable finance operations support",
                "stats": [
                    {"value": "40+", "label": "SMEs supported"},
                    {"value": "24 hrs", "label": "Typical response time"},
                    {"value": "100%", "label": "Owner-reviewed work"},
                ],
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "service_grid",
            "position": 3,
            "is_visible": True,
            "variant": "three_columns",
            "content_json": {
                "heading": "Services we offer",
                "subheading": "Practical support for Indian tax, GST, accounts and reporting needs.",
                "services": service_items,
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "image_text",
            "position": 4,
            "is_visible": True,
            "variant": "image_right",
            "content_json": {
                "eyebrow": "When finance work starts slipping",
                "heading": "We help stabilize the back office before it slows growth.",
                "body": (
                    "Books behind schedule, compliance deadlines approaching, and documents scattered across channels can slow down "
                    f"business decisions. {payload.firmName} helps bring the work back into a clear monthly rhythm."
                ),
                "cta": {"label": "Talk to us", "href": "#contact"},
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "rich_text",
            "position": 5,
            "is_visible": True,
            "variant": "article",
            "content_json": {
                "heading": "How we work",
                "markdown": (
                    "1. Free consultation - We understand your current setup and pain points.\n"
                    "2. Custom proposal - You get a clear scope and transparent pricing.\n"
                    "3. Secure onboarding - Documents, access, and responsibilities are set up safely.\n"
                    "4. Transition and cleanup - We reconcile data and set monthly workflows.\n"
                    "5. Ongoing management - You get reporting, compliance reminders, and support."
                ),
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "image_text",
            "position": 6,
            "is_visible": True,
            "variant": "image_left",
            "content_json": {
                "eyebrow": "Data security",
                "heading": "Sensitive financial data is handled with controlled access.",
                "body": (
                    "Client documents, credentials, and financial records need careful handling. Use secure document workflows, "
                    "role-based access, review trails, and confidentiality practices before sharing sensitive data."
                ),
                "cta": {"label": "Read security policy", "href": "/security"},
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "founder_profile",
            "position": 7,
            "is_visible": True,
            "variant": "portrait_card",
            "content_json": {
                "founder_name": payload.founderName,
                "designation": "Founder",
                "bio": f"{payload.founderName} leads {payload.firmName} with a focus on timely compliance and clear advice.",
                "credentials": ["Chartered Accountant", "Tax and compliance advisory"],
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "cta_banner",
            "position": 8,
            "is_visible": True,
            "variant": "solid",
            "content_json": {
                "heading": "Ready to make finance work predictable?",
                "description": "Start with a short consultation and leave with a clearer next step.",
                "primary_cta": {"label": "Book a free call", "href": "#contact"},
            },
        },
        {
            "id": str(uuid4()),
            "section_type": "contact_form",
            "position": 9,
            "is_visible": True,
            "variant": "standard",
            "content_json": {
                "heading": "Book a consultation",
                "description": f"Contact {payload.firmName} in {payload.city} for tax, GST and accounting support.",
                "show_whatsapp": True,
                "show_phone": True,
                "show_email": True,
                "show_map": True,
            },
        },
    ]
