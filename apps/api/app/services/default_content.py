from uuid import uuid4

from app.schemas.admin import OnboardingRequest

HERO_IMAGE_URL = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
OFFICE_IMAGE_URL = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
FOUNDER_IMAGE_URL = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80"


def slugify(value: str) -> str:
    cleaned = "".join(char.lower() if char.isalnum() else "-" for char in value)
    return "-".join(part for part in cleaned.split("-") if part)


def default_home_sections(payload: OnboardingRequest) -> list[dict]:
    value_props = [
        {
            "title": "Cost savings without compromise",
            "description": (
                "Hiring a full in-house accounts team means salaries, benefits, training, and turnover risk. "
                "We give you senior-level expertise at a fraction of the cost, with no hiring headaches."
            ),
            "icon": "BadgeIndianRupee",
        },
        {
            "title": "Always on time, always accurate",
            "description": (
                "Late payments and reconciliation errors cost you money and relationships. Our process is built "
                "around deadlines: every invoice, every payment, every report, on schedule."
            ),
            "icon": "CalendarDays",
        },
        {
            "title": "Built to scale with you",
            "description": (
                "Whether you process 50 invoices a month or 5,000, our systems flex with your growth. "
                "No need to rehire or retrain as you expand."
            ),
            "icon": "UsersRound",
        },
        {
            "title": "Full transparency, no black box",
            "description": (
                "You get clear visibility into your accounts through dashboards, regular reports, and a direct "
                "line to your account manager. Nothing hidden, nothing delayed."
            ),
            "icon": "Eye",
        },
    ]

    return [
        {
            "id": str(uuid4()),
            "admin_label": "Home banner",
            "section_type": "hero",
            "position": 1,
            "is_visible": True,
            "variant": "image_right",
            "content_json": {
                "eyebrow": "Outsourced accounts management",
                "title": "Accurate Books. On Time, Every Time.",
                "description": (
                    "Get a dedicated team handling your books, payables, and receivables, so you can focus on "
                    "growing the business, not chasing invoices."
                ),
                "image_url": HERO_IMAGE_URL,
                "primary_cta": {"label": "Book a Free Consultation", "href": "#contact"},
                "secondary_cta": {"label": "See How It Works", "href": "#how-we-work"},
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "Value propositions",
            "section_type": "service_grid",
            "position": 2,
            "is_visible": True,
            "variant": "two_columns",
            "content_json": {
                "heading": "Accounts operations without the in-house overhead",
                "subheading": "A dependable back-office accounts team for growing businesses that need accuracy, visibility, and rhythm.",
                "services": value_props,
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "About us",
            "section_type": "image_text",
            "position": 3,
            "is_visible": True,
            "variant": "image_right",
            "content_json": {
                "eyebrow": "Why we started this",
                "heading": "Built for owners who need dependable accounts support.",
                "body": (
                    "This firm did not start in a boardroom. It started from watching, up close, how small and medium businesses actually work. "
                    "Growing up around a family business, and later working closely with MSMEs, we noticed a pattern: business owners were sharp "
                    "at operations and strategy, but always stuck depending on finding the perfect accountant, someone who got the numbers right "
                    "and was easy to communicate with. That is the gap we built this firm to close."
                ),
                "image_url": OFFICE_IMAGE_URL,
                "cta": {"label": "Talk to us", "href": "#contact"},
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "How we work",
            "section_type": "rich_text",
            "position": 4,
            "is_visible": True,
            "variant": "article",
            "content_json": {
                "heading": "Onboarding in 5 Simple Steps",
                "markdown": (
                    "1. Free consultation - We understand your current setup and pain points.\n"
                    "2. Custom proposal - Tailored scope of services and transparent pricing, with no hidden fees.\n"
                    "3. Secure onboarding - NDA signed, document portal set up, and team assigned.\n"
                    "4. Transition and setup - We migrate data, reconcile opening balances, and set workflows.\n"
                    "5. Ongoing management - Monthly reporting, proactive compliance, and always-available support."
                ),
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "Data security",
            "section_type": "image_text",
            "position": 5,
            "is_visible": True,
            "variant": "image_left",
            "content_json": {
                "eyebrow": "Data security and confidentiality",
                "heading": "Your Financial Data, Handled with Care",
                "body": (
                    "Your books contain some of the most sensitive information about your business, and we treat it that way. "
                    "Financial documents and finalized reports are stored and managed on Microsoft OneDrive with Microsoft 365 security "
                    "features including encryption and access controls. As we grow, we are implementing a formal data protection policy "
                    "covering restricted physical device access, secured email communication, and controls against unauthorized third-party "
                    "apps or websites on work systems. Our workspace is monitored by CCTV, and every team member signs an NDA before "
                    "accessing client data. Security is part of how we are building the business from day one."
                ),
                "cta": {"label": "Ask about our safeguards", "href": "#contact"},
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "FAQs",
            "section_type": "faq",
            "position": 6,
            "is_visible": True,
            "variant": "accordion",
            "content_json": {
                "heading": "Frequently Asked Questions",
                "items": [
                    {
                        "question": "How is my financial data kept secure?",
                        "answer": "Your data is protected through OneDrive and Microsoft 365 security, NDAs, and physical safeguards. See our Data Security section above for the full approach.",
                    },
                    {
                        "question": "Do I have to change my CA?",
                        "answer": "No. We are not here to replace your Chartered Accountant. We bridge communication between you and your CA, and support them by keeping your books organized, accurate, and audit-ready.",
                    },
                    {
                        "question": "What accounting software do you work with?",
                        "answer": "We currently work with Tally Prime, and we are actively expanding support for platforms including Marg, QuickBooks, Xero, and others. If your business uses another system, tell us and we can discuss compatibility.",
                    },
                    {
                        "question": "How quickly can you onboard my business?",
                        "answer": "Typical onboarding takes 15 to 20 days, depending on account complexity and your current systems. We are refining the process toward onboarding most businesses in as little as one week.",
                    },
                    {
                        "question": "How do I share raw documents or invoices with you?",
                        "answer": "You can share raw documents, invoices, statements, and other records through a dedicated shared drive from mobile, tablet, laptop, or desktop. You can also drop physical documents at our office.",
                    },
                    {
                        "question": "Do you handle GST or tax filing, or only bookkeeping and accounts management?",
                        "answer": "Yes, we offer GST and tax filing services. It is optional: if you already have a CA or accountant for filings, we are happy to support that relationship rather than replace it.",
                    },
                ],
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "Final consultation CTA",
            "section_type": "cta_banner",
            "position": 7,
            "is_visible": True,
            "variant": "solid",
            "content_json": {
                "heading": "Your Books, Our Move",
                "description": "One conversation is all it takes to see what a well-managed accounts process can feel like.",
                "primary_cta": {"label": "Book a Free Consultation", "href": "#contact"},
            },
        },
        {
            "id": str(uuid4()),
            "admin_label": "Contact form",
            "section_type": "contact_form",
            "position": 8,
            "is_visible": True,
            "variant": "standard",
            "content_json": {
                "heading": "Your Books, Our Move",
                "description": (
                    "One conversation is all it takes, whether you are here to see what a well-managed accounts process feels like "
                    "or to explore joining the team behind it."
                ),
                "show_whatsapp": True,
                "show_phone": True,
                "show_email": True,
                "show_map": True,
                "business_hours": "Monday to Saturday, 10:00 AM to 6:00 PM",
            },
        },
    ]
