insert into public.dialogue_topics(title, role1, arg1, tip1, role2, arg2, tip2) values
('Voting Age',
'Lower to 16',
'Show how 16-year-olds already have responsibilities (work, pay taxes, drive in some countries).',
'Argue they deserve representation too; use examples from countries where voting starts at 16.',
'(Keep at 18)',
'Argue maturity and knowledge reasons why 18 is a better age.',
'Say teens are too influenced by peers/parents and lack life experience.'
),

('Extreme Sports',
 'Restrict them',
 'Use safety statistics or injury examples.',
 'Stress government responsibility to protect citizens.',
 'Allow them',
 'Emphasize freedom of choice and personal growth.',
 'Compare extreme sports risks to everyday ones like driving.'
),

('AI in Education',
 'Allow AI',
 'Give 2 positive uses of AI (personalized learning, fast information).',
 'Compare AI to calculators in math—once controversial, now normal.',
 'Ban AI',
 'Show 2 dangers (cheating, dependency).',
 'Argue that real learning means thinking independently.'
),

('Social Media Age Limit',
 'Ban under 16',
 'Give 2 dangers (mental health, cyberbullying, privacy).',
 'Use emotional examples like stress or online harassment.',
 'Allow with supervision',
 'Show 2 benefits (connection, digital skills, access to communities).',
 'Suggest parental controls or rules instead of bans.'
),


('Homework',
 'Pro-homework',
 'Give 2 reasons why practice at home improves performance.',
 'Use analogy: training in sports improves skills just like homework does.',
 'Anti-homework',
 'Argue from stress and well-being; mention family or hobby time.',
 'Suggest alternatives like project-based learning.'
),

('Smartphones in Class',
 'Ban phones',
 'Present 2 strong cases where phones distract or harm focus.',
 'Use examples of addiction or misuse in class.',
 'Allow phones',
 'Show how phones can be learning tools (apps, dictionaries, emergencies).',
 'Suggest clear rules for responsible use.'
),

('AI & Jobs (Trending)',
 'Govt should retrain workers',
 'Give 2 sectors where AI disrupts jobs (transport, customer service).',
 'Argue retraining prevents unemployment crises.',
 'Private sector should adapt',
 'Argue markets and companies innovate faster than governments.',
 'Warn about over-regulation killing progress.'
),

('Digital Privacy & Surveillance (Trending)',
 'Limit data collection',
 'Give 2 risks (privacy breaches, discrimination).',
 'Use examples of data leaks or scandals.',
 'Support surveillance',
 'Argue benefits (crime prevention, personalized services).',
 'Appeal to safety and public good.'
),

('Climate Policy — Urgency vs Growth (Trending)',
 'Aggressive climate action now',
 'Show evidence of climate risks and future costs of inaction.',
 'Argue for protecting future generations.',
 'Prioritize growth',
 'Show how harsh policies can hurt jobs and stability.',
 'Suggest gradual, balanced approaches.'
),

('Universal Basic Income — UBI (Trending)',
 'Pro-UBI',
 'Use examples or pilot projects; argue for poverty reduction and stability.',
 'Show how it prepares for automation and inequality.',
 'Anti-UBI',
 'Argue it’s too expensive and discourages work.',
 'Suggest other solutions like job programs or targeted aid.'
) on conflict do nothing;
