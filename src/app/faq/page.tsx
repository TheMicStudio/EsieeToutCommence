import { getFaqArticles, searchFaqArticles } from '@/modules/support/actions';
import { FaqArticleCard } from '@/modules/support/components/FaqArticleCard';
import { CATEGORIE_LABELS } from '@/modules/support/types';

interface FaqPageProps {
  searchParams: Promise<{ q?: string; categorie?: string }>;
}

export default async function FaqPage({ searchParams }: Readonly<FaqPageProps>) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';

  const articles = q ? await searchFaqArticles(q) : await getFaqArticles();

  const categories = Array.from(new Set(articles.map((a) => a.categorie)));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Aide & FAQ</h1>
        <p className="mt-2 text-muted-foreground">Retrouvez les réponses aux questions fréquentes</p>
      </div>

      <form method="GET" className="mb-8">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher une question…"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Rechercher
          </button>
        </div>
      </form>

      {articles.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Aucun article trouvé.</p>
      ) : (
        <div className="space-y-6">
          {q ? (
            <div className="space-y-3">
              {articles.map((article) => (
                <FaqArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <section key={cat}>
                <h2 className="mb-3 text-lg font-semibold">{CATEGORIE_LABELS[cat]}</h2>
                <div className="space-y-2">
                  {articles.filter((a) => a.categorie === cat).map((article) => (
                    <FaqArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </main>
  );
}
