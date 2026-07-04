from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, field_validator

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
MediumText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=420)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


def validate_safe_url(value: str) -> str:
    allowed = ("/", "#", "https://", "mailto:", "https://wa.me/")
    if not value.startswith(allowed):
        raise ValueError("URL must be relative, https://, mailto:, or https://wa.me/.")
    return value


class CTA(BaseModel):
    label: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=48)]
    href: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=300)]

    @field_validator("href")
    @classmethod
    def safe_href(cls, value: str) -> str:
        return validate_safe_url(value)


class SectionBase(BaseModel):
    id: str
    admin_label: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)] | None = None
    position: int = Field(ge=1)
    is_visible: bool = True
    model_config = ConfigDict(extra="forbid")


class HeroContent(BaseModel):
    eyebrow: ShortText
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)]
    description: MediumText
    image_asset_id: str | None = None
    image_url: HttpUrl | None = None
    primary_cta: CTA
    secondary_cta: CTA | None = None


class HeroSection(SectionBase):
    section_type: Literal["hero"]
    variant: Literal["image_right", "centered", "background_image"]
    content_json: HeroContent


class TrustStatsContent(BaseModel):
    heading: ShortText
    stats: list[dict[str, ShortText]] = Field(min_length=1, max_length=6)


class TrustStatsSection(SectionBase):
    section_type: Literal["trust_stats"]
    variant: Literal["cards", "strip"]
    content_json: TrustStatsContent


class ServiceItem(BaseModel):
    title: ShortText
    description: MediumText
    icon: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class ServiceGridContent(BaseModel):
    heading: ShortText
    subheading: MediumText | None = None
    services: list[ServiceItem] = Field(min_length=1, max_length=12)


class ServiceGridSection(SectionBase):
    section_type: Literal["service_grid"]
    variant: Literal["three_columns", "icon_list", "two_columns"]
    content_json: ServiceGridContent


class ImageTextContent(BaseModel):
    eyebrow: ShortText | None = None
    heading: ShortText
    body: LongText
    image_asset_id: str | None = None
    image_url: HttpUrl | None = None
    cta: CTA | None = None


class ImageTextSection(SectionBase):
    section_type: Literal["image_text"]
    variant: Literal["image_left", "image_right"]
    content_json: ImageTextContent


class FounderProfileContent(BaseModel):
    founder_name: ShortText
    designation: ShortText
    bio: LongText
    image_asset_id: str | None = None
    image_url: HttpUrl | None = None
    credentials: list[ShortText] = Field(default_factory=list, max_length=8)


class FounderProfileSection(SectionBase):
    section_type: Literal["founder_profile"]
    variant: Literal["portrait_card", "editorial"]
    content_json: FounderProfileContent


class TestimonialItem(BaseModel):
    name: ShortText
    role: ShortText
    quote: MediumText


class TestimonialsContent(BaseModel):
    heading: ShortText
    testimonials: list[TestimonialItem] = Field(min_length=1, max_length=9)


class TestimonialsSection(SectionBase):
    section_type: Literal["testimonials"]
    variant: Literal["cards", "quotes"]
    content_json: TestimonialsContent


class FAQItem(BaseModel):
    question: ShortText
    answer: LongText


class FAQContent(BaseModel):
    heading: ShortText
    items: list[FAQItem] = Field(min_length=1, max_length=20)


class FAQSection(SectionBase):
    section_type: Literal["faq"]
    variant: Literal["accordion"]
    content_json: FAQContent


class CTABannerContent(BaseModel):
    heading: ShortText
    description: MediumText
    primary_cta: CTA


class CTABannerSection(SectionBase):
    section_type: Literal["cta_banner"]
    variant: Literal["solid", "split"]
    content_json: CTABannerContent


class ContactFormContent(BaseModel):
    heading: ShortText
    description: MediumText
    show_whatsapp: bool = True
    show_phone: bool = True
    show_email: bool = True
    show_map: bool = True


class ContactFormSection(SectionBase):
    section_type: Literal["contact_form"]
    variant: Literal["standard"]
    content_json: ContactFormContent


class RichTextContent(BaseModel):
    heading: ShortText
    markdown: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]

    @field_validator("markdown")
    @classmethod
    def raw_html_disabled(cls, value: str) -> str:
        if "<" in value or ">" in value:
            raise ValueError("Raw HTML is not allowed. Use Markdown only.")
        return value


class RichTextSection(SectionBase):
    section_type: Literal["rich_text"]
    variant: Literal["article"]
    content_json: RichTextContent


PageSection = Annotated[
    HeroSection
    | TrustStatsSection
    | ServiceGridSection
    | ImageTextSection
    | FounderProfileSection
    | TestimonialsSection
    | FAQSection
    | CTABannerSection
    | ContactFormSection
    | RichTextSection,
    Field(discriminator="section_type"),
]


def validate_sections(sections: list[PageSection]) -> list[PageSection]:
    positions = [section.position for section in sections]
    if len(positions) != len(set(positions)):
        raise ValueError("Section positions must be unique.")
    return sections
