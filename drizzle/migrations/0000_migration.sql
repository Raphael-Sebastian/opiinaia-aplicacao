CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  original_text TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positivo','negativo','neutro')),
  confidence REAL NOT NULL,
  summary TEXT,
  aspects JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('individual','lote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analyses_user_created ON public.analyses(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses all" ON public.analyses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.analysis_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  entity_text TEXT NOT NULL,
  entity_type TEXT NOT NULL
);
GRANT SELECT, INSERT, DELETE ON public.analysis_entities TO authenticated;
GRANT ALL ON public.analysis_entities TO service_role;
ALTER TABLE public.analysis_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entities" ON public.analysis_entities FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));

CREATE TABLE public.analysis_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  relevance_score REAL NOT NULL DEFAULT 0
);
CREATE INDEX kw_analysis ON public.analysis_keywords(analysis_id);
CREATE INDEX ent_analysis ON public.analysis_entities(analysis_id);
GRANT SELECT, INSERT, DELETE ON public.analysis_keywords TO authenticated;
GRANT ALL ON public.analysis_keywords TO service_role;
ALTER TABLE public.analysis_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own keywords" ON public.analysis_keywords FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));