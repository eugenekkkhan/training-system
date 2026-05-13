// Seed script: creates global templates + logs for Russian CS exam practice
// Run: node seed-tasks.js
// Run with --update to patch existing templates by name (skips log/card creation)

const BASE_URL = 'http://localhost:3000/api';
const CREDS = { email: 'oleg228@mail.ru', password: 'Otetz228' };
const CARDS_PER_LOG = 30;

async function api(path, method, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// ─── Template definitions ──────────────────────────────────────────────────

const TEMPLATES = [
  {
    name: 'Расчёт памяти для растрового изображения',
    description: 'По размерам изображения (в пикселях) и количеству цветов вычислить минимальный объём памяти в Кбайт.',
    inputSchema: {
      colorIdx: { type: 'int', min: 0, max: 7 },
      widthIdx:  { type: 'int', min: 0, max: 3 },
      heightIdx: { type: 'int', min: 0, max: 3 },
    },
    code: `({ colorIdx, widthIdx, heightIdx }) => {
  var dims   = [64, 128, 256, 512];
  var colors = [2, 4, 8, 16, 32, 64, 128, 256];
  var w = dims[widthIdx];
  var h = dims[heightIdx];
  var c = colors[colorIdx];
  var bits = Math.ceil(Math.log2(c));
  var totalBits  = w * h * bits;
  var totalBytes = Math.ceil(totalBits / 8);
  var totalKB    = Math.ceil(totalBytes / 1024);
  return {
    question: 'Какой минимальный объём памяти (в Кбайт) нужно зарезервировать, чтобы можно было сохранить любое растровое изображение размером ' + w + '×' + h + ' пикселей при условии, что в изображении могут использоваться ' + c + ' различных цветов? Запишите только целое число.',
    answer: totalKB,
    hint: 'Бит на пиксель: $\\\\lceil\\\\log_2(' + c + ')\\\\rceil = ' + bits + '$. Объём: $' + w + ' \\\\times ' + h + ' \\\\times ' + bits + ' \\\\div 8 \\\\div 1024$.',
    explanation: '$' + c + '$ цветов $\\\\Rightarrow$ $' + bits + '$ бит/пиксель ($2^{' + bits + '} = ' + Math.pow(2, bits) + '$). Объём: $' + w + ' \\\\times ' + h + ' \\\\times ' + bits + ' = ' + totalBits + '$ бит $= ' + totalBytes + '$ байт $= ' + totalKB + '$ Кбайт.',
  };
}`,
    logName: 'Объём памяти для изображений',
  },

  {
    name: 'Поисковые запросы — найти объединение (|)',
    description: 'По числу страниц для двух отдельных запросов и их пересечения найти количество страниц для запроса с «|» (ИЛИ).',
    inputSchema: {
      topic1:       { type: 'string', values: ['Мороз', 'Лес', 'Горы', 'Дождь', 'Снег', 'Ветер', 'Туман', 'Гром'] },
      topic2:       { type: 'string', values: ['Зима', 'Лето', 'Осень', 'Весна', 'Море', 'Небо', 'Земля', 'Огонь'] },
      a:            { type: 'int', min: 800,  max: 5000 },
      b:            { type: 'int', min: 500,  max: 4000 },
      intersection: { type: 'int', min: 100,  max: 600  },
    },
    code: `({ topic1, topic2, a, b, intersection }) => {
  var cap = Math.min(a, b);
  var i   = Math.min(intersection, cap);
  var u   = a + b - i;
  return {
    question: 'В языке запросов поискового сервера символ «|» обозначает ИЛИ, а «&» — И.\\nРезультаты поиска (тыс. страниц):\\n• ' + topic1 + ' = ' + a + '\\n• ' + topic2 + ' = ' + b + '\\n• ' + topic1 + ' & ' + topic2 + ' = ' + i + '\\nСколько страниц (в тысячах) будет найдено по запросу «' + topic1 + ' | ' + topic2 + '»?',
    answer: u,
    hint: 'Формула включения-исключения: $|A \\\\cup B| = |A| + |B| - |A \\\\cap B|$.',
    explanation: '$|' + topic1 + ' \\\\cup ' + topic2 + '| = ' + a + ' + ' + b + ' - ' + i + ' = ' + u + '$ тыс. страниц.',
  };
}`,
    logName: 'Поисковые запросы — найти ИЛИ',
  },

  {
    name: 'Поисковые запросы — найти одно множество',
    description: 'По числу страниц для объединения, одного слова и пересечения найти число страниц для второго слова.',
    inputSchema: {
      topic1:       { type: 'string', values: ['Руда', 'Лёд', 'Гора', 'Волна', 'Пламя', 'Буря', 'Скала', 'Тайга'] },
      topic2:       { type: 'string', values: ['Уголь', 'Снег', 'Вода', 'Ветер', 'Земля', 'Небо', 'Огонь', 'Лес'] },
      a:            { type: 'int', min: 1000, max: 4000 },
      b:            { type: 'int', min: 500,  max: 3000 },
      intersection: { type: 'int', min: 100,  max: 500  },
    },
    code: `({ topic1, topic2, a, b, intersection }) => {
  var i = Math.min(intersection, Math.min(a, b));
  var u = a + b - i;
  return {
    question: 'В языке запросов: «|» — ИЛИ, «&» — И.\\nРезультаты поиска (тыс. страниц):\\n• ' + topic1 + ' | ' + topic2 + ' = ' + u + '\\n• ' + topic2 + ' = ' + b + '\\n• ' + topic1 + ' & ' + topic2 + ' = ' + i + '\\nСколько страниц (в тысячах) будет найдено по запросу «' + topic1 + '»?',
    answer: a,
    hint: 'Из формулы $|A \\\\cup B| = |A| + |B| - |A \\\\cap B|$ выразите $|A| = |A \\\\cup B| - |B| + |A \\\\cap B|$.',
    explanation: '$|' + topic1 + '| = ' + u + ' - ' + b + ' + ' + i + ' = ' + a + '$ тыс. страниц.',
  };
}`,
    logName: 'Поисковые запросы — найти один запрос',
  },

  {
    name: 'Двоичное кодирование алфавита',
    description: 'По размеру алфавита (количеству символов) определить необходимую разрядность двоичного кода.',
    inputSchema: {
      symbolsIdx: { type: 'int', min: 0, max: 9 },
    },
    code: `({ symbolsIdx }) => {
  var sizes = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  var s     = sizes[symbolsIdx];
  var bits  = Math.ceil(Math.log2(s));
  var cap   = Math.pow(2, bits);
  var prev  = Math.pow(2, bits - 1);
  return {
    question: 'Какую разрядность двоичного кода необходимо использовать, если алфавит содержит ' + s + ' символов?',
    answer: bits,
    hint: 'Найдите минимальное $n$, при котором $2^n \\\\geq ' + s + '$.',
    explanation: 'При $' + (bits - 1) + '$ битах: $2^{' + (bits-1) + '} = ' + prev + ' < ' + s + '$. При $' + bits + '$ битах: $2^{' + bits + '} = ' + cap + ' \\\\geq ' + s + '$. Ответ: $' + bits + '$ бит.',
  };
}`,
    logName: 'Разрядность двоичного кода',
  },

  {
    name: 'Скорость передачи данных — время в секундах',
    description: 'По скорости модема, числу страниц, строк и символов вычислить время передачи в секундах (1 символ = 1 байт).',
    inputSchema: {
      speedIdx:  { type: 'int', min: 0, max: 4 },
      pages:     { type: 'int', min: 10, max: 200 },
      lines:     { type: 'int', min: 20, max: 50  },
      charsLine: { type: 'int', min: 40, max: 80  },
    },
    code: `({ speedIdx, pages, lines, charsLine }) => {
  var speeds  = [14400, 28800, 57600, 115200, 230400];
  var speed   = speeds[speedIdx];
  var bytes   = pages * lines * charsLine;
  var bits    = bytes * 8;
  var seconds = Math.round(bits / speed);
  return {
    question: 'Сколько секунд потребуется модему, передающему сообщения со скоростью ' + speed + ' бит/с, чтобы передать ' + pages + ' страниц текста в ' + lines + ' строк по ' + charsLine + ' символов каждая, при условии, что каждый символ кодируется 1 байтом? Запишите только целое число.',
    answer: seconds,
    hint: 'Объём: $' + pages + ' \\\\times ' + lines + ' \\\\times ' + charsLine + ' \\\\times 8$ бит. Время $= \\\\dfrac{\\\\text{объём}}{\\\\text{скорость}}$.',
    explanation: 'Объём: $' + pages + ' \\\\times ' + lines + ' \\\\times ' + charsLine + ' \\\\times 8 = ' + bits + '$ бит. Время: $\\\\dfrac{' + bits + '}{' + speed + '} = ' + seconds + '$ сек.',
  };
}`,
    logName: 'Время передачи данных',
  },

  {
    name: 'Чертёжник — команда возврата (без цикла)',
    description: 'Даны три последовательных команды смещения. Найти единственную команду, чтобы вернуть Чертёжника в исходную точку.',
    inputSchema: {
      x0:  { type: 'int', min: -5, max: 5 },
      y0:  { type: 'int', min: -5, max: 5 },
      dx1: { type: 'int', min: -5, max: 5 },
      dy1: { type: 'int', min: -5, max: 5 },
      dx2: { type: 'int', min: -5, max: 5 },
      dy2: { type: 'int', min: -5, max: 5 },
      dx3: { type: 'int', min: -5, max: 5 },
      dy3: { type: 'int', min: -5, max: 5 },
    },
    code: `({ x0, y0, dx1, dy1, dx2, dy2, dx3, dy3 }) => {
  var endX = x0 + dx1 + dx2 + dx3;
  var endY = y0 + dy1 + dy2 + dy3;
  var retX = x0 - endX;
  var retY = y0 - endY;
  return {
    question: 'Чертёжник находится в точке (' + x0 + ', ' + y0 + '). Последовательно выполняются команды:\\n1. Сместиться на (' + dx1 + ', ' + dy1 + ')\\n2. Сместиться на (' + dx2 + ', ' + dy2 + ')\\n3. Сместиться на (' + dx3 + ', ' + dy3 + ')\\nКакой единственной командой нужно вернуть Чертёжника в исходную точку? Введите смещение в формате (x, y).',
    answer: '(' + retX + ', ' + retY + ')',
    hint: 'Итоговое смещение $= (\\\\Delta x_1 + \\\\Delta x_2 + \\\\Delta x_3,\\\\ \\\\Delta y_1 + \\\\Delta y_2 + \\\\Delta y_3)$. Команда возврата — противоположное смещение.',
    explanation: 'После трёх команд: $(' + endX + ', ' + endY + ')$. Возврат в $(' + x0 + ', ' + y0 + ')$: смещение $(' + retX + ', ' + retY + ')$.',
  };
}`,
    logName: 'Чертёжник — возврат (без цикла)',
  },

  {
    name: 'Чертёжник — команда возврата (цикл «Повтори N раз»)',
    description: 'Дан цикл с двумя командами смещения. Найти команду, возвращающую Чертёжника в исходную точку после цикла.',
    inputSchema: {
      x0:    { type: 'int', min: -5, max: 5 },
      y0:    { type: 'int', min: -5, max: 5 },
      loops: { type: 'int', min: 2,  max: 5 },
      dx1:   { type: 'int', min: -5, max: 5 },
      dy1:   { type: 'int', min: -5, max: 5 },
      dx2:   { type: 'int', min: -5, max: 5 },
      dy2:   { type: 'int', min: -5, max: 5 },
    },
    code: `({ x0, y0, loops, dx1, dy1, dx2, dy2 }) => {
  var totalDX = loops * (dx1 + dx2);
  var totalDY = loops * (dy1 + dy2);
  var retX = -totalDX;
  var retY = -totalDY;
  return {
    question: 'Чертёжник начинает в точке (' + x0 + ', ' + y0 + '). Алгоритм:\\nПовтори ' + loops + ' раз\\n  Сместиться на (' + dx1 + ', ' + dy1 + ')\\n  Сместиться на (' + dx2 + ', ' + dy2 + ')\\nКонец\\nКакой единственной командой вернуть Чертёжника в исходную точку? Введите смещение в формате (x, y).',
    answer: '(' + retX + ', ' + retY + ')',
    hint: 'Суммарное смещение: $' + loops + ' \\\\times (\\\\Delta x_1 + \\\\Delta x_2)$ по $x$ и $' + loops + ' \\\\times (\\\\Delta y_1 + \\\\Delta y_2)$ по $y$.',
    explanation: 'За $' + loops + '$ итераций: $\\\\Delta x = ' + loops + ' \\\\times (' + dx1 + ' + ' + dx2 + ') = ' + totalDX + '$, $\\\\Delta y = ' + loops + ' \\\\times (' + dy1 + ' + ' + dy2 + ') = ' + totalDY + '$. Возврат: $(' + retX + ', ' + retY + ')$.',
  };
}`,
    logName: 'Чертёжник — возврат (с циклом)',
  },

  {
    name: 'Чертёжник — найти пропущенную команду в цикле',
    description: 'Алгоритм содержит цикл с неизвестной Командой1 и известными смещениями. После выполнения Чертёжник вернулся в исходную точку. Найти Команду1.',
    inputSchema: {
      loops: { type: 'int', min: 2, max: 4 },
      cmdX:  { type: 'int', min: -5, max: 5 },
      cmdY:  { type: 'int', min: -5, max: 5 },
      dx2:   { type: 'int', min: -5, max: 5 },
      dy2:   { type: 'int', min: -5, max: 5 },
      dx3:   { type: 'int', min: -5, max: 5 },
      dy3:   { type: 'int', min: -5, max: 5 },
    },
    code: `({ loops, cmdX, cmdY, dx2, dy2, dx3, dy3 }) => {
  var finalX = -(loops * (cmdX + dx2 + dx3));
  var finalY = -(loops * (cmdY + dy2 + dy3));
  return {
    question: 'Чертёжник начинает в некоторой точке. Алгоритм:\\nПовтори ' + loops + ' раз\\n  Команда1\\n  Сместиться на (' + dx2 + ', ' + dy2 + ')\\n  Сместиться на (' + dx3 + ', ' + dy3 + ')\\nКонец\\nСместиться на (' + finalX + ', ' + finalY + ')\\nПосле выполнения алгоритма Чертёжник вернулся в исходную точку. Чем является Команда1? Введите смещение в формате (x, y).',
    answer: '(' + cmdX + ', ' + cmdY + ')',
    hint: 'Суммарное смещение всего алгоритма $= (0, 0)$. По $x$: $' + loops + ' \\\\cdot (x_1 + ' + dx2 + ' + ' + dx3 + ') + ' + finalX + ' = 0$.',
    explanation: 'По $x$: $' + loops + ' \\\\cdot (x_1 + ' + dx2 + ' + ' + dx3 + ') = ' + (-finalX) + ' \\\\Rightarrow x_1 = ' + cmdX + '$. По $y$ аналогично: $y_1 = ' + cmdY + '$. Команда1: $(' + cmdX + ', ' + cmdY + ')$.',
  };
}`,
    logName: 'Чертёжник — пропущенная команда в цикле',
  },

  {
    name: 'Трассировка алгоритма — остаток от деления (X mod Y)',
    description: 'Дан алгоритм: пока X ≥ Y, выполнять X := X − Y, K := K + 1; вывести X. Определить результат для заданных X и Y.',
    inputSchema: {
      x: { type: 'int', min: 10, max: 99 },
      y: { type: 'int', min: 2,  max: 12 },
    },
    code: `({ x, y }) => {
  var X = x, K = 0;
  while (X >= y) { X -= y; K++; }
  return {
    question: 'Дан алгоритм:\\n  Начальные значения: X = ' + x + ', Y = ' + y + ', K = 0\\n  Пока X ≥ Y:\\n    X := X − Y\\n    K := K + 1\\n  Вывод: X\\nКаков результат (выводимое значение X)?',
    answer: X,
    hint: 'Последовательно вычитайте $' + y + '$ из $' + x + '$ до тех пор, пока $X < ' + y + '$.',
    explanation: 'Алгоритм вычисляет $' + x + ' \\\\bmod ' + y + ' = ' + X + '$. Количество итераций: $K = ' + K + '$.',
  };
}`,
    logName: 'Алгоритм вычитания — остаток от деления',
  },

  {
    name: 'Трассировка алгоритма — минимум трёх чисел',
    description: 'Дан алгоритм-блок-схема нахождения минимума из a, b, c. Выполнить для заданных значений.',
    inputSchema: {
      a: { type: 'int', min: 1, max: 20 },
      b: { type: 'int', min: 1, max: 20 },
      c: { type: 'int', min: 1, max: 20 },
    },
    code: `({ a, b, c }) => {
  var result = a < b ? (a < c ? a : c) : (b < c ? b : c);
  var step1  = a < b ? 'Да' : 'Нет';
  var branch = a < b
    ? ('a < c? ' + (a < c ? 'Да → вывод a = ' + a : 'Нет → вывод c = ' + c))
    : ('b < c? ' + (b < c ? 'Да → вывод b = ' + b : 'Нет → вывод c = ' + c));
  return {
    question: 'Алгоритм нахождения минимума трёх чисел (блок-схема):\\n  Если a < b:\\n    Если a < c: вывести a, иначе вывести c\\n  Иначе:\\n    Если b < c: вывести b, иначе вывести c\\nВыполните алгоритм для $a = ' + a + '$, $b = ' + b + '$, $c = ' + c + '$. Каков результат?',
    answer: result,
    hint: 'Сначала сравните $a$ и $b$. Затем сравните меньшее из них с $c$.',
    explanation: '$a < b$? ' + step1 + '. ' + branch + '. Результат: $' + result + '$.',
  };
}`,
    logName: 'Алгоритм — минимум трёх чисел',
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const updateOnly = process.argv.includes('--update');

  console.log('Logging in…');
  const { token } = await api('/auth/login', 'POST', CREDS);
  console.log('OK\n');

  if (updateOnly) {
    console.log('-- UPDATE MODE: patching existing templates by name --\n');
    const existing = await api('/templates', 'GET', null, token);
    const byName = Object.fromEntries(existing.map(t => [t.name, t.id]));

    for (const tpl of TEMPLATES) {
      const id = byName[tpl.name];
      if (!id) {
        console.warn(`  NOT FOUND: «${tpl.name}» — skipping`);
        continue;
      }
      try {
        await api(`/templates/${id}`, 'PATCH', {
          description: tpl.description,
          code:        tpl.code,
          inputSchema: tpl.inputSchema,
        }, token);
        console.log(`  Updated: «${tpl.name}»`);
      } catch (e) {
        console.error(`  FAILED «${tpl.name}»: ${e.message}`);
      }
    }
    console.log('\nDone.');
    return;
  }

  for (const tpl of TEMPLATES) {
    // 1. Create template
    console.log(`Creating template: «${tpl.name}»`);
    let tmplId;
    try {
      const tmpl = await api('/templates', 'POST', {
        name:        tpl.name,
        description: tpl.description,
        code:        tpl.code,
        inputSchema: tpl.inputSchema,
        isGlobal:    true,
      }, token);
      tmplId = tmpl.id;
      console.log(`  Template ID: ${tmplId}`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      continue;
    }

    // 2. Create log linked to template
    console.log(`Creating log: «${tpl.logName}»`);
    let logId;
    try {
      const log = await api('/logs', 'POST', {
        name:        tpl.logName,
        description: tpl.description,
        templateId:  tmplId,
        isGlobal:    true,
      }, token);
      logId = log.id;
      console.log(`  Log ID: ${logId}`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      continue;
    }

    // 3. Generate cards
    console.log(`Generating ${CARDS_PER_LOG} cards…`);
    try {
      const result = await api(`/logs/${logId}/generate`, 'POST', { count: CARDS_PER_LOG }, token);
      console.log(`  Generated ${result.length ?? '?'} cards\n`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}\n`);
    }
  }

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
