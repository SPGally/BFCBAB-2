# News image templates

Articles should have a photo where one exists. When there is none, generate a branded card so
every article still has a featured image and a social media picture. All cards share one layout
(club red gradient, white panel, FAB logo, kicker, title, subtitle, footer) so the site looks
consistent; the template only changes the kicker line.

```bash
node scripts/news-card.mjs --template minutes --title "Tuesday 4 August 2026" \
  --subtitle "South Stand Meeting Room, Oakwell Stadium" --footer "Now published" \
  --out public/images/news/2026-09-10-august-meeting-minutes-published.jpg
```

| Template | Kicker | Use for |
|---|---|---|
| `minutes` | MEETING MINUTES | A set of minutes being published (title = meeting date, subtitle = venue) |
| `meeting` | NEXT MEETING | Announcing the next meeting (title = date and time, subtitle = venue or how to join) |
| `statement` | FAB STATEMENT | Formal statements (title = the subject) |
| `news` | FAB NEWS | Anything else; `--kicker` overrides the line |

Output is a 1600x900 JPEG, content centred so it survives the 16:9 hero and square social crops.
Name the file `<yyyy-mm-dd>-<slug>.jpg` to match the article and put the path in the article's
`image` front matter. The script is macOS-only (it renders with Quick Look and converts with
`sips`) and needs no npm packages.
