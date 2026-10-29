## about-us.json  (records: 1)
- id: number = 1
- hero: object {title_ar, title_en, description_ar, description_en, badge_ar, badge_en, quote_ar, quote_en, registration_number, donate_label_ar, donate_label_en, donate_button_text, story_label_ar, story_label_en, story_button_text, image}
- stats: object {year, items}
- programs: object {title_ar, title_en, items}
- trust: object {title_ar, title_en, items}
- why_us: object {title_ar, title_en, items}
- values: object {title_ar, title_en, items}
- story: object {title_ar, title_en, description_ar, description_en, registration_number, bank_name, mission_ar, mission_en, goals_ar}
- vision_2030: object {title_ar, title_en, description_ar, description_en, progress, items}
- closing: object {title_ar, title_en, description_ar, button_text_ar, button_text_en}
- is_active: boolean = true

## achievements.json  (records: 6)
- id: number = 9
- title_ar: string = "كرتونة رمضان"
- title_en: string = "Ramadan food boxes"
- number: string = "1400.00"
- number_suffix_ar: string = "كرتونة"
- number_suffix_en: string = "boxes"
- icon: string = "Utensils"
- image: null
- sort_order: number = 1
- is_active: boolean = true
- created_at: string = "2026-09-25T01:02:53.000000Z"
- updated_at: string = "2026-09-25T01:02:53.000000Z"

## axes.json  (records: 3)
- id: number = 6
- slug: string = "food"
- name_ar: string = "الغذاء"
- name_en: string = "Food"
- description_ar: string = "بنوفّر غذاء كريم لأكثر الأسر احتياجًا"
- description_en: string = "We provide dignified food"
- badge_ar: string = "محور الغذاء"
- badge_en: string = "Food Axis"
- image: string = "https://api.elyusr.org/storage/axes/YO5ztpDJg1z1LFoQQT8L5c1n"
- statistics: object {beneficiary_families, fresh_meat_tons, open_kitchen_days}
- features_ar: array(2)
- features_en: array(2)
- sort_order: number = 1
- is_active: boolean = true
- programs: array(7) [{id, name, description, is_active}]
- cases: array(0)
- volunteer_campaigns: array(0)
- created_at: string = "2026-09-13T18:53:18.000000Z"
- updated_at: string = "2026-10-20T22:20:56.000000Z"

## blog-seo.json  (records: 3)
- id: number = 1
- content_id: number = 2
- slug: string = "water-project-2026"
- title_ar: string = "مشروع المياه الجديد في الدقهلية"
- title_en: string = "New Water Project in Dakahlia"
- summary_ar: string = "تعرف على تفاصيل مشروع المياه الجديد."
- summary_en: string = "Learn about the new water project."
- content_ar: string = "هنا نص المقال بالكامل ..."
- content_en: string = "Full article content here ..."
- author_id: number = 1
- author: object {id, name, email}
- primary_keyword: string = "مشاريع المياه"
- category_ar: string = "المياه"
- category_en: string = "Water"
- tags_ar: array(3)
- tags_en: array(3)
- og_image_url: string = "https://example.com/og.jpg"
- schema_type: string = "Article"
- schema_data: object {@type}
- seo_score: number = 65
- seo_analysis: object {word_count_ar, word_count_en, title_length_ar, title_length_en, description_length_ar, description_length_en, has_schema, has_og, has_category, has_tags}
- workflow_status: string = "draft"
- created_by: number = 1
- created_at: string = "2026-09-09T06:45:03.000000Z"
- updated_at: string = "2026-09-09T06:45:03.000000Z"

## case-categories.json  (records: 3)
- id: number = 1
- name_ar: string = "The category field is required."
- name_en: null
- slug: string = "the-category-field-is-required"
- is_active: boolean = true
- sort_order: number = 0
- cases_count: number = 7
- created_at: string = "2026-09-21T10:52:21.000000Z"
- updated_at: string = "2026-09-21T10:52:21.000000Z"

## cases.json  (records: 8)
- id: number = 23
- code: string = "Jennifer Clark"
- title: string = "Jennifer Clark"
- category: string = "The category field is required."
- category_data: object {id, name_ar, name_en, slug}
- collected_amount: number = 0
- remaining_amount: number = 3
- completion_percentage: number = 0
- beneficiary_name: string = "Jennifer Clark"
- age: number = 65
- governorate: string = "Jennifer Clark"
- city: string = "Jennifer Clark"
- target_amount: string = "3.00"
- priority: string = "medium"
- description: string = "https://www.sample.com"
- status: string = "pending_review"
- created_at: string = "2026-10-28T03:46:23.000000Z"
- updated_at: string = "2026-10-28T03:46:23.000000Z"

## content.json  (records: 5)
- id: number = 7
- type: string = "article"
- status: string = "draft"
- slug: string = "my-first"
- title_ar: string = "مقال تجريبي"
- title_en: string = "Test Article"
- summary_ar: string = "ملخص"
- summary_en: string = "summary"
- content_ar: string = "محتوى المقال بالعربي"
- content_en: string = "Article content"
- cover_image: null
- svg: null
- tags: array(3)
- author: object {id, name, email}
- created_at: string = "2026-10-18T11:08:40.000000Z"
- updated_at: string = "2026-10-18T11:08:40.000000Z"

## donation-campaign-categories.json  (records: 0)

## donation-campaigns.json  (records: 7)
- id: number = 17
- name_ar: string = "حملة ظل"
- name_en: string = "Zell Campaign"
- slug: string = "zell"
- description_ar: string = "ساهم في حملة ظل من مؤسسة اليسر الخيرية: أسقف منازل خشبية ووص"
- description_en: string = "Support the Zell campaign by Al-Yusr Foundation: roofs, clea"
- image: string = "https://api.elyusr.org/storage/donation-campaigns/5Y8hnXILmS"
- target_amount: string = "250000.00"
- collected_amount: string = "60000.00"
- remaining_amount: string = "190000.00"
- completion_percentage: number = 24
- is_completed: boolean = false
- minimum_amount: string = "500.00"
- donation_available: boolean = true
- is_active: boolean = true
- sort_order: number = 1
- benefits: array(0)
- donation_packages: array(4) [{id, donation_campaign_id, name_ar, name_en, amount, sort_order, is_active}]
- cases: array(0)
- created_at: string = "2026-10-21T17:55:51.000000Z"
- updated_at: string = "2026-10-28T03:28:12.000000Z"

## faq-categories.json  (records: 15)
- id: number = 2
- name_ar: string = "الصفحة الرئيسية"
- name_en: string = "Home Page"
- slug: string = "home"
- is_active: boolean = true
- sort_order: number = 1
- faqs_count: number = 12
- created_at: string = "2026-09-29T07:27:01.000000Z"
- updated_at: string = "2026-09-29T07:27:01.000000Z"

## faqs.json  (records: 95)
- id: number = 96
- faq_category_id: number = 19
- question_ar: string = "إيه هي مبادرة عربون خير للفريلانسرز؟"
- question_en: string = "What is the Arboun Kheir initiative for freelancers?"
- answer_ar: string = "مبادرة «عربون خير» هي فكرة بتشجع الشباب المشتغلين في العمل ا"
- answer_en: string = "The 'Arboun Kheir' initiative encourages young people workin"
- sort_order: number = 1
- is_active: boolean = true
- category: object {id, name_ar, name_en, slug, is_active, sort_order, created_at, updated_at}
- created_at: string = "2026-10-21T21:42:32.000000Z"
- updated_at: string = "2026-10-21T21:42:32.000000Z"

## gallery.json  (records: 15)
- id: number = 1
- image: string = "https://api.elyusr.org/storage/gallery/4EVBiqIycVCsmL8f5CQGe"
- external_url: string = "https://shorthand.com/the-craft/raster-images/assets/5kVrMqC"
- title_ar: string = "عنوان الصورة"
- title_en: string = "Image Title"
- alt_ar: string = "وصف الصورة للبحث"
- alt_en: string = "Image description for search"
- description_ar: string = "وصف قصير بالعربي"
- description_en: string = "Short description"
- city: string = "Mansoura"
- program: string = "عام"
- donation_program: string = "odhya, box, water"
- sort_order: number = 54
- is_featured: boolean = false
- is_public: boolean = true
- created_by: number = 1
- created_at: string = "2026-09-07T21:11:02.000000Z"
- updated_at: string = "2026-09-07T21:11:02.000000Z"

## home-numbers.json  (records: 6)
- id: number = 4
- title_ar: string = "سقف منزل"
- title_en: string = "Home roofs built"
- number: string = "1000.00"
- number_label_ar: string = "+"
- number_label_en: string = "+"
- icon: string = "Home"
- fallback_image: null
- sort_order: number = 1
- is_visible: boolean = true
- created_by: number = 1
- created_at: string = "2026-09-21T06:02:12.000000Z"
- updated_at: string = "2026-10-21T01:09:39.000000Z"

## homepage-content.json  (records: 1)
- id: number = 1
- hero: object {badge_ar, badge_en, title_ar, title_en, title_line1_ar, title_line1_en, title_accent_ar, title_accent_en, description_ar, description_en, image, primary_cta, secondary_cta, transparency}
- section2: object {badge_ar, badge_en, title_ar, title_accent_ar, title_accent_en, title_en, description_ar, description_en, main_image, left_top_image, left_bottom_image, card}
- created_at: string = "2026-08-27T10:02:55.000000Z"
- updated_at: string = "2026-10-21T01:12:17.000000Z"

## homepage_carousel.json  (records: 1)
- settings: object {id, is_active, autoplay, autoplay_speed, show_dots, created_at, updated_at}
- items: array(5) [{id, title_ar, title_en, description_ar, description_en, image, link_url, sort_order, is_active, created_at, updated_at}]

## homepage_content.json  (records: 1)
- section2_badge_ar: string = "مع اليسر"
- section2_badge_en: string = "With Al-Yusr"
- section2_title_ar: string = "خيرك يوصل"
- section2_title_en: string = "Your good arrives"
- section2_title_accent_ar: string = "وأجرك يستمر"
- section2_title_accent_en: string = "Your reward continues"
- section2_description_ar: string = "تبرعك هو استثمارك في الجنة وراحتك في الدنيا، تبرعك موثّق وأث"
- section2_description_en: string = "Your donation is your investment in the hereafter and your p"
- section2_main_image: string = "https://api.elyusr.org/storage/homepage/ZX5IbYcVTUJ984SAT7p3"
- section2_left_top_image: string = "https://api.elyusr.org/storage/homepage/ptApc9Hr0Yt3ivWMkQOY"
- section2_left_bottom_image: string = "https://api.elyusr.org/storage/homepage/mD2wUG8lDs4qUkGGeZ4L"
- section2_card_title_ar: string = "كن سبب الفرحة"
- section2_card_title_en: string = "Be their joy"
- section2_card_subtitle_ar: string = "كل تبرع موثّق و كل أثر مرئي"
- section2_card_subtitle_en: string = "Every donation tracked, every impact visible"
- section2_card_url: string = "/about#impact"
- section2_primary_cta_ar: string = "استكشف البرامج"
- section2_primary_cta_en: string = "Explore programs"
- section2_primary_cta_url: string = "/arboun"
- section2_primary_cta_icon: string = "Compass"
- section2_secondary_cta_ar: string = "تبرع الان"
- section2_secondary_cta_en: string = "donate now"
- section2_secondary_cta_url: string = "/donate?=arboun"
- section2_secondary_cta_icon: string = "ArrowUpLeftFromCircle"

## homepage_hero.json  (records: 1)
- hero_badge_ar: string = "اليسر"
- hero_badge_en: string = "اليسر"
- hero_title_ar: string = "معًا نصل بصدقتك لمن يستحق"
- hero_title_en: string = "Together delivering your charity to those in need"
- hero_title_line1_ar: string = "معا نصل بصدقتك"
- hero_title_line1_en: string = "Together We Deliver Your Charity"
- hero_title_accent_ar: string = "لمن يستحق"
- hero_title_accent_en: string = "To Those in Need"
- hero_description_ar: string = "تبرعك هو استثمارك في الجنة وراحتك في الدنيا، تبرعك موثّق وأث"
- hero_description_en: string = "Your donation reaches a deserving family today through our t"
- hero_image: null
- primary_cta_ar: string = "تبرع الآن"
- primary_cta_en: string = "Donate Now"
- primary_cta_url: string = "/donate"
- primary_cta_icon: string = "Heart"
- secondary_cta_ar: string = "تعرّف علينا"
- secondary_cta_en: string = "About us"
- secondary_cta_url: string = "/about"
- secondary_cta_icon: string = "Info"
- transparency_ar: string = "%99 شفافية"
- transparency_en: string = "99% Transparency"

## payment-methods_active.json  (records: 7)
- id: number = 1
- name_ar: string = "بطاقة بنكية"
- name_en: string = "Credit Card"
- slug: string = "credit-card"
- type: string = "card"
- provider_ar: string = "Paymob"
- provider_en: string = "Paymob"
- details: object {cards, gateway, secure}
- description_ar: string = "الدفع الآمن باستخدام بطاقات فيزا وماستركارد عبر بوابة Paymob"
- description_en: string = "Secure payment using Visa and Mastercard through Paymob gate"
- sort_order: number = 1
- is_active: boolean = true
- created_at: string = "2026-09-06T21:22:53.000000Z"
- updated_at: string = "2026-09-06T21:22:53.000000Z"

## programs.json  (records: 9)
- id: number = 43
- slug: string = "general-donation"
- hero_h1_ar: null
- hero_h1_en: null
- hero_h3_ar: null
- hero_h3_en: null
- hero_image: null
- name: string = "تبرع عام"
- name_ar: string = "تبرع عام"
- name_en: string = "General Donation"
- title_ar: string = "تبرع عام"
- title_en: string = "General Donation"
- top_section: object {badge_ar, title_ar, title_en, subtitle_ar, subtitle_en, description_ar, description_en, image, primary_button_ar, whatsapp_button_ar, minimum_amount, currency_ar, donation_available}
- page_sections: array(0)
- axis_id: number = 6
- axis: object {id, slug, name_ar, name_en}
- seasons: array(0)
- period_ar: null
- period_en: null
- tagline_ar: null
- tagline_en: null
- description: string = "التبرعات العامة غير المخصصة لبرنامج بعينه، وتُصرف في أوجه ال"
- description_ar: string = "التبرعات العامة غير المخصصة لبرنامج بعينه، وتُصرف في أوجه ال"
- description_en: string = "General donations not designated to a specific program, spen"
- content_ar: null
- content_en: null
- benefits_ar: array(0)
- benefits_en: array(0)
- image: string = "https://api.elyusr.org/storage/programs/bisVOALJjJN4PcXmfngE"
- donation_available: boolean = true
- target_amount: null
- collected_amount: string = "2550.00"
- progress_percentage: number = 0
- minimum_amount: string = "10.00"
- donation_packages: array(0)
- cases: array(0)
- meta_title_ar: null
- meta_title_en: null
- meta_description_ar: null
- meta_description_en: null
- keywords_ar: null
- keywords_en: null
- canonical_url: null
- schema_type: null
- twitter_card: null
- noindex: boolean = false
- nofollow: boolean = false
- geo_region: null
- geo_placename: null
- geo_position: null
- geo_position_label: null
- ai_summary_ar: null
- ai_summary_en: null
- ai_faq_ar: null
- ai_faq_en: null
- status: string = "published"
- is_active: boolean = true
- hide_from_audience: boolean = true
- sort_order: number = 0
- created_at: string = "2026-10-27T23:54:42.000000Z"
- updated_at: string = "2026-10-28T19:31:10.000000Z"

## programs_35.json  (records: 1)
- id: number = 35
- slug: string = "odhya"
- hero_h1_ar: null
- hero_h1_en: null
- hero_h3_ar: null
- hero_h3_en: null
- hero_image: null
- name: string = "صك الأضحية"
- name_ar: string = "صك الأضحية"
- name_en: string = "Qurbani Voucher"
- title_ar: string = "صك الأضحية"
- title_en: string = "Qurbani Voucher"
- top_section: object {badge_ar, title_ar, title_en, subtitle_ar, subtitle_en, description_ar, description_en, image, primary_button_ar, whatsapp_button_ar, minimum_amount, currency_ar, donation_available}
- page_sections: array(7) [{id, program_id, section_key, title_ar, title_en, subtitle_ar, subtitle_en, content_ar, content_en, settings, is_enabled, sort_order, created_at, updated_at}]
- axis_id: number = 6
- axis: object {id, slug, name_ar, name_en}
- seasons: array(0)
- period_ar: string = "موسم الأضاحي — ذي الحجة"
- period_en: string = "Eid Al-Adha season — Dhul Hijja"
- tagline_ar: string = "الوحيدين في مصر بنديك ضمان جودة الأضحية"
- tagline_en: string = "The only ones in Egypt guaranteeing Qurbani quality"
- description: string = "صك أضحية بنفس جودة اللحمة اللي بتاكلها — جاموسي، بقري، أو خر"
- description_ar: string = "صك أضحية بنفس جودة اللحمة اللي بتاكلها — جاموسي، بقري، أو خر"
- description_en: string = "A premium-quality Qurbani share — buffalo, cow, or lamb — di"
- content_ar: string = "في مؤسسة اليسر بنؤمن إن الأضحية أمانة قبل ما تكون عبادة. عشا"
- content_en: string = "At Al-Yusr we believe Qurbani is a trust before it is worshi"
- benefits_ar: array(4)
- benefits_en: array(4)
- image: string = "https://api.elyusr.org/storage/programs/URdplrAT5FMTSNPDALTs"
- donation_available: boolean = false
- target_amount: string = "500000.00"
- collected_amount: number = 0
- progress_percentage: number = 0
- minimum_amount: string = "1400.00"
- donation_packages: array(3) [{id, program_id, name_ar, name_en, amount, sort_order, is_active}]
- cases: array(0)
- meta_title_ar: null
- meta_title_en: null
- meta_description_ar: null
- meta_description_en: null
- keywords_ar: null
- keywords_en: null
- canonical_url: null
- schema_type: null
- twitter_card: null
- noindex: boolean = false
- nofollow: boolean = false
- geo_region: null
- geo_placename: null
- geo_position: null
- geo_position_label: null
- ai_summary_ar: null
- ai_summary_en: null
- ai_faq_ar: null
- ai_faq_en: null
- status: string = "draft"
- is_active: boolean = false
- hide_from_audience: boolean = true
- sort_order: number = 1
- created_at: string = "2026-10-21T00:15:54.000000Z"
- updated_at: string = "2026-10-23T16:26:37.000000Z"

## programs_35_page-sections.json  (records: 8)
- id: number = 58
- program_id: number = 35
- section_key: string = "top_section"
- title_ar: string = "روابط الأقسام"
- title_en: string = "Section Navigation"
- subtitle_ar: null
- subtitle_en: null
- content_ar: null
- content_en: null
- settings: object {top_section}
- is_enabled: boolean = true
- sort_order: number = 0
- created_at: string = "2026-10-24T15:01:06.000000Z"
- updated_at: string = "2026-10-24T15:01:06.000000Z"

## projects.json  (records: 3)
- id: number = 24
- name: string = "محطة مياه الاسماعليه"
- name_en: string = "Clean Water Station"
- slug: string = "water-station-dakahlia-39280"
- description: string = "محطة مياه الاسماعليه"
- short_description: string = "محطة مياه"
- short_description_en: string = "Water station"
- target_amount: string = "80000.00"
- collected_amount: string = "1000.00"
- starting_price: string = "100.00"
- display_order: number = 1
- cover_image: string = "https://api.elyusr.org/storage/projects/xR4yqku2jU3apNBtatgl"
- is_active: boolean = true
- donation_packages: array(1) [{id, project_id, name_ar, name_en, amount, sort_order, is_active}]
- cases: array(1) [{id, project_id, category_id, code, title, beneficiary_name, target_amount, status, priority, governorate}]
- created_at: string = "2026-10-17T17:23:46.000000Z"
- updated_at: string = "2026-10-23T04:01:45.000000Z"

## stories.json  (records: 0)

## volunteer-campaigns.json  (records: 2)
- id: number = 4
- title_ar: string = "حملة مركون"
- title_en: string = "Campaign"
- event_date: string = "2026-11-05"
- event_time: string = "10:00"
- governorate: string = "Cairo"
- city: string = "Nasr City"
- location: string = "Charity Headquarters"
- required_volunteers: number = 20
- required_skills: array(2)
- description_ar: string = "حملة لتوزيع المساعدات على الأسر المستحقة."
- description_en: string = "Campaign to distribute aid to eligible families."
- status: string = "open"
- approved_volunteers_count: number = 0
- remaining_volunteers: number = 20
- applications_count: number = 0
- created_at: string = "2026-10-17T08:45:54.000000Z"
- updated_at: string = "2026-10-17T08:45:54.000000Z"
