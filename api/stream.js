export default async function handler(req, res) {
  // 1. ЗАДЪЛЖИТЕЛНО: Слагаме CORS заглавията най-отгоре, за да важат за абсолютно всеки отговор
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

  // 2. Браузърите често изпращат "проучвателна" OPTIONS заявка преди пускане – отговаряме веднага с 200 OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetPage = "https://i.cdn.bg/live/S8LTlYjQhF";

  try {
    const response = await fetch(targetPage, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'bg,bg-BG;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://i.cdn.bg/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Сървърът на CDN.bg върна статус грешка: ${response.status}`);
    }

    const html = await response.text();

    // Търсим .m3u8 линка
    const m3u8Match = html.match(/([^\s"'`<>]+?\.m3u8[^\s"'`<>]*)/i);

    if (m3u8Match && m3u8Match[1]) {
      let streamUrl = m3u8Match[1];
      
      // Почистване на линка
      streamUrl = streamUrl.replace(/\\/g, '');
      if (streamUrl.startsWith('//')) {
        streamUrl = 'https:' + streamUrl;
      }
      streamUrl = streamUrl.replace(["'", '"'], '');

      // 3. Пренасочваме браузъра (CORS заглавията от ред 3 вече са прикачени към този отговор)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Location', streamUrl);
      return res.status(302).end();
    } else {
      return res.status(404).send("Грешка: Неуспешно извличане на .m3u8 поток от сорс кода.");
    }

  } catch (error) {
    return res.status(500).send("Грешка при автоматичното обновяване на токена: " + error.message);
  }
}
