import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export async function generateRssFeed() {
  const now = new Date().toISOString();
  const { data: articles } = await supabase
    .from('news')
    .select('*, author:board_members!author_id(name, role)')
    .eq('published', true)
    .or(`published_at.is.null,published_at.lte.${now}`)
    .order('published_at', { ascending: false })
    .limit(20);

  const baseUrl = import.meta.env.VITE_PUBLIC_URL || 'https://fab.barnsleyfc.co.uk';

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Barnsley FC Fan Advisory Board News</title>
  <link>${baseUrl}</link>
  <description>Latest news and updates from the Barnsley FC Fan Advisory Board</description>
  <language>en-gb</language>
  <lastBuildDate>${format(new Date(), 'EEE, dd MMM yyyy HH:mm:ss xx')}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
  ${articles?.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/news/${article.id}</link>
      <guid isPermaLink="true">${baseUrl}/news/${article.id}</guid>
      <pubDate>${format(new Date(article.published_at || article.created_at), 'EEE, dd MMM yyyy HH:mm:ss xx')}</pubDate>
      ${article.author ? `<author>${article.author.email || 'fab@barnsleyfc.co.uk'} (${article.author.name})</author>` : ''}
      <description><![CDATA[${article.summary || article.content.substring(0, 200)}...]]></description>
      ${article.image_url ? `<enclosure url="${article.image_url}" type="image/jpeg" />` : ''}
    </item>
  `).join('')}
</channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml;charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

export function GET() {
  return generateRssFeed();
}