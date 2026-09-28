USE alyusr;
INSERT IGNORE INTO case_categories (id, slug, name_ar, name_en, icon, sort_order) VALUES
 (UUID(), 'medical-devices',     'حالات أجهزة طبية',                'Medical devices',         'Stethoscope', 1),
 (UUID(), 'medication',          'حالات علاج دوائي',                'Medication',              'Pill',        2),
 (UUID(), 'debt',                'حالات سداد ديون',                 'Debt relief',             'Banknote',    3),
 (UUID(), 'marriage',            'حالات تيسير الزواج',              'Marriage assistance',     'Heart',       4),
 (UUID(), 'medical-sessions',    'حالات جلسات طبية',                'Medical sessions',        'Activity',    5),
 (UUID(), 'prosthetics',         'حالات أطراف صناعية',              'Prosthetics',             'Accessibility', 6),
 (UUID(), 'irregular-medical',   'حالات خدمات طبية غير منتظمة',     'Irregular medical care',  'HeartPulse',  7),
 (UUID(), 'surgery',             'حالات عمليات جراحية',             'Surgery',                 'Scissors',    8),
 (UUID(), 'monthly-sponsorship', 'حالات كفالة شهرية',               'Monthly sponsorship',     'CalendarHeart', 9),
 (UUID(), 'medical-supplies',    'حالات مستلزمات طبية',             'Medical supplies',        'Package',     10),
 (UUID(), 'small-projects',      'حالات مشاريع صغيرة',              'Small projects',          'Briefcase',   11);