export type TemplateKey = "modern_ca" | "traditional_ca" | "premium_ca";
export type ThemeKey = "navy_gold" | "emerald_cream" | "charcoal_blue";

export type Cta = {
  label: string;
  href: string;
};

export type BaseSection<TType extends string, TVariant extends string, TContent> = {
  id: string;
  admin_label?: string | null;
  section_type: TType;
  position: number;
  is_visible: boolean;
  variant: TVariant;
  content_json: TContent;
};

export type HeroSection = BaseSection<
  "hero",
  "image_right" | "centered" | "background_image",
  {
    eyebrow: string;
    title: string;
    description: string;
    image_asset_id?: string | null;
    image_url?: string | null;
    primary_cta: Cta;
    secondary_cta?: Cta | null;
  }
>;

export type TrustStatsSection = BaseSection<
  "trust_stats",
  "cards" | "strip",
  {
    heading: string;
    stats: Array<{ label: string; value: string }>;
  }
>;

export type ServiceGridSection = BaseSection<
  "service_grid",
  "three_columns" | "icon_list" | "two_columns",
  {
    heading: string;
    subheading?: string;
    services: Array<{ title: string; description: string; icon: string }>;
  }
>;

export type ImageTextSection = BaseSection<
  "image_text",
  "image_left" | "image_right",
  {
    eyebrow?: string;
    heading: string;
    body: string;
    image_url?: string | null;
    cta?: Cta | null;
  }
>;

export type FounderProfileSection = BaseSection<
  "founder_profile",
  "portrait_card" | "editorial",
  {
    founder_name: string;
    designation: string;
    bio: string;
    image_url?: string | null;
    credentials: string[];
  }
>;

export type TestimonialsSection = BaseSection<
  "testimonials",
  "cards" | "quotes",
  {
    heading: string;
    testimonials: Array<{ name: string; role: string; quote: string }>;
  }
>;

export type FaqSection = BaseSection<
  "faq",
  "accordion",
  {
    heading: string;
    items: Array<{ question: string; answer: string }>;
  }
>;

export type CtaBannerSection = BaseSection<
  "cta_banner",
  "solid" | "split",
  {
    heading: string;
    description: string;
    primary_cta: Cta;
  }
>;

export type ContactFormSection = BaseSection<
  "contact_form",
  "standard",
  {
    heading: string;
    description: string;
    show_whatsapp: boolean;
    show_phone: boolean;
    show_email: boolean;
    show_map: boolean;
  }
>;

export type RichTextSection = BaseSection<
  "rich_text",
  "article",
  {
    heading: string;
    markdown: string;
  }
>;

export type PageSection =
  | HeroSection
  | TrustStatsSection
  | ServiceGridSection
  | ImageTextSection
  | FounderProfileSection
  | TestimonialsSection
  | FaqSection
  | CtaBannerSection
  | ContactFormSection
  | RichTextSection;

export type PublicSitePage = {
  organization_id: string;
  organization_slug: string;
  firm_name: string;
  city: string;
  template_key: TemplateKey;
  theme_key: ThemeKey;
  page_slug: string;
  page_title: string;
  seo: {
    title: string;
    description: string;
    canonical_url: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  sections: PageSection[];
  published_at: string;
};

export type LeadPayload = {
  organization_slug?: string;
  hostname?: string;
  source_page_slug: string;
  name: string;
  phone: string;
  email?: string;
  service_interest?: string;
  message?: string;
  website?: string;
};
