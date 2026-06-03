export default async function handler(req, res) {
  // Страницата, в която се крие оригиналният плеър
  const targetPage = "https://i.cdn.bg/live/S8LTlYjQhF";

  try {
    // Изпращаме пълни заглавия, за да изглеждаме като реален браузър
    const response = await fetch(targetPage, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'bg,bg-BG;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://i.cdn.bg/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Сървърът на CDN.bg върна статус грешка: ${response.status}. Възможно е Vercel да е блокиран.`);
    }

    const html = await response.text();

    // 🎯 Нов, брутално гъвкав регулярен израз: търси всичко, което съдържа .m3u8 
    // без значение дали има кавички, интервали или обратни наклонени черти (\/)
    const m3u8Match = html.match(/([^\s"'`<>]+?\.m3u8[^\s"'`<>]*)/i);

    if (m3u8Match && m3u8Match[1]) {
      let streamUrl = m3u8Match[1];
      
      // 1. Премахваме обратните наклонени черти (ако е било кодирано като \/ в JavaScript)
      streamUrl = streamUrl.replace(/\\/g, '');

      // 2. Ако линкът започва относително с "//", му залепваме "https:" отпред
      if (streamUrl.startsWith('//')) {
        streamUrl = 'https:' + streamUrl;
      }

      // 3. Изчистваме случайни остатъчни кавички в краищата
      streamUrl = streamUrl.replace(["'", '"'], '');

      // Изпращаме към вашия HTML5 плеър
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Location', streamUrl);
      return res.status(302).end();
    } else {
      // 🛠️ ДЕБЪГ РЕЖИМ: Ако все пак не намери линк, скриптът ще ви покаже началото на кода
      // Така ще разберем дали ни връща Cloudflare защита, или просто са скрили линка по друг начин.
      const snippet = html.substring(0, 600).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return res.status(404).send(`
        <h3>Грешка: Неуспешно извличане на .m3u8 поток.</h3>
        <p>Сорс кодът на страницата не съдържа директен стрийм или Vercel вижда защитна стена.</p>
        <p><strong>Преглед на върнатия отговор от сървъра:</strong></p>
        <pre style="background:#f4f4f4; padding:10px; border:1px solid #ddd; overflow:auto;">${snippet}</pre>
      `);
    }

  } catch (error) {
    return res.status(500).send("Грешка при автоматичното обновяване на токена: " + error.message);
  }
}
