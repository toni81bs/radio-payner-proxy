export default async function handler(req, res) {
  // Страницата, в която се крие оригиналният плеър и токенът
  const targetPage = "https://i.cdn.bg/live/S8LTlYjQhF";

  try {
    // 1. Сваляме HTML кода на страницата
    const response = await fetch(targetPage, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://i.cdn.bg/'
      }
    });

    if (!response.ok) {
      throw new Error(`Сървърът на CDN.bg върна статус: ${response.status}`);
    }

    const html = await response.text();

    // 2. Търсим скрития .m3u8 линк вътре в HTML сорс кода
    // Този регулярен израз намира "https://.../playlist.m3u8..." без значение какъв е токенът
    const m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);

    if (m3u8Match && m3u8Match[1]) {
      let streamUrl = m3u8Match[1];
      
      // Почистваме ескейпнати наклонени черти (ако има останали такива като \/)
      streamUrl = streamUrl.replace(/\\/g, '');

      // 3. МАГИЯТА: Пренасочваме браузъра/плеъра директно към новия линк
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Location', streamUrl);
      res.status(302).end();
    } else {
      res.status(404).send("Грешка: Неуспешно извличане на видео стрийма. Вероятно са променили защитата на страницата.");
    }

  } catch (error) {
    res.status(500).send("Грешка при автоматичното обновяване на токена: " + error.message);
  }
}