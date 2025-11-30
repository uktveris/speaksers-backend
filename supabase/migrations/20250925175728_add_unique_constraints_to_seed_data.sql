ALTER TABLE public.language_courses
ADD CONSTRAINT unique_name UNIQUE (name);

ALTER TABLE public.dialogue_topics
ADD CONSTRAINT unique_title UNIQUE (title);
