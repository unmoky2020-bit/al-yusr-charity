CREATE POLICY "blog_posts_editor_read" ON public.blog_posts FOR SELECT
  USING (public.has_role(auth.uid(), 'editor'::public.app_role));
CREATE POLICY "blog_posts_editor_insert" ON public.blog_posts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));
CREATE POLICY "blog_posts_editor_update" ON public.blog_posts FOR UPDATE
  USING (public.has_role(auth.uid(), 'editor'::public.app_role));

CREATE POLICY "stories_editor_read" ON public.stories FOR SELECT
  USING (public.has_role(auth.uid(), 'editor'::public.app_role));
CREATE POLICY "stories_editor_insert" ON public.stories FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));
CREATE POLICY "stories_editor_update" ON public.stories FOR UPDATE
  USING (public.has_role(auth.uid(), 'editor'::public.app_role));

CREATE POLICY "site_stats_editor_read" ON public.site_stats FOR SELECT
  USING (public.has_role(auth.uid(), 'editor'::public.app_role));
CREATE POLICY "site_stats_editor_update" ON public.site_stats FOR UPDATE
  USING (public.has_role(auth.uid(), 'editor'::public.app_role));