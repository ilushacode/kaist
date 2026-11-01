# Реклама КАИСТ — техническая документация

Документ для агентов/разработчиков: как устроена реклама, где что менять, какие
инварианты нельзя ломать.

## 1. Общая схема

```
index.html (loader context.js, один раз, только на боевом хосте)
        │  window.yaContextCb
        ▼
AdBanner (React)  ── pickAdUnit(units, context) ──►  AdfoxUnit
        │                                            (ownerId, params p1/p2)
        ├─ создаёт div-контейнер (adfox_<placement>_<n>)
        ├─ Ya.adfoxCode.create({ ownerId, containerId, params,
        │                        onRender, onError, onStub })
        └─ разворачивает слот 0px → height по onRender
           (MutationObserver + ResizeObserver — страховка),
           показывает крестик
```

Таргетинг **сейчас отключён**: на каждом месте одно объявление, `pickAdUnit`
возвращает его без условий, AdFox сам выбирает баннер. Логика контекста
(`keywords/buildings/groupDigits`) сохранена в коде на будущее.

## 2. Файлы

| Файл | Роль |
|---|---|
| `index.html` | загрузчик `context.js` + `window.yaContextCb` (ставить один раз); грузится только на боевом хосте |
| `src/config.ts` | `AdfoxUnit`, `AdfoxTargeting`, `AD_PLACEMENTS`, `AdPlacement` |
| `src/utils/adTargeting.ts` | `keywordMatches`, `targetingMatches`, `pickAdUnit`, `AdContext` |
| `src/utils/adfox.ts` | `isAdsEnabled`, `isAdfoxReady`, `getAdfoxQueue`, `whenAdfoxReady`, `renderAdfoxBlock`, `createContainerId` |
| `src/utils/building.ts` | `parseBuilding`, `getDayBuilding` |
| `src/components/AdBanner.tsx` | виджет: выбор объявления, рендер, анимация, крестик |
| `src/styles/AdBanner.css` | пропорция, выравнивание, анимация, крестик |
| `src/components/ScheduleComponent.tsx` | `schedule-top` + здание дня |
| `src/components/StudentsComponent.tsx` | `students-top`, скрытие в поиске |
| `src/components/TeachersComponent.tsx` | `teachers-top`, скрытие в поиске |
| `src/modals/LessonModal.tsx` | `lesson-bottom` (контекст передаётся, таргет выключен) |
| `src/types/yandex-ads.d.ts` | типы `window.Ya.adfoxCode` |

## 3. Модель данных

```ts
interface AdfoxTargeting {
  keywords?: string[];   // совпадение по теме/предмету
  buildings?: number[];  // 1..8, одно или несколько
  groups?: string[];     // точные номера групп
  groupDigits?: Array<number[] | null>; // по позициям 1..4; null/[] = любая цифра
}

interface AdfoxUnit {
  name: string;                            // уникальное имя в пределах места
  ownerId: number;                         // 330181
  params: Record<string, string>;          // p1 (место), p2 (площадка)
  targeting?: AdfoxTargeting;              // нет = общее объявление
  priority?: number;                       // больше = важнее
}

type AdPlacement =
  | 'schedule-top' | 'students-top' | 'teachers-top' | 'lesson-bottom';

const AD_PLACEMENTS: Record<AdPlacement, AdfoxUnit[]>;
```

Контекст:

```ts
interface AdContext {
  keywords?: string[];      // например, [lesson.subject]
  building?: number | null; // здание дня или здание пары
  group?: string | null;    // selectedGroup
}
```

Текущий конфиг: по одному объявлению на каждое из четырёх мест, без `targeting`:
`p1` — `dsoze` (расписание), `dsozf` (студенты), `dsozg` (преподаватели),
`dsozh` (модалка пары). Все с `p2: 'jwhj'`, `ownerId: 330181`.

## 4. Выбор объявления (`pickAdUnit`)

Сейчас таргетинг **отключён**: в `AD_PLACEMENTS` у всех объявлений нет
`targeting`, поэтому `pickAdUnit` возвращает единственное объявление места.
Логика ниже сохранена на будущее.

1. Отбрасываются объявления, чей `targeting` не подходит:
   - `buildings` — нужен `ctx.building` из списка;
   - `groups` — нужен `ctx.group` из списка;
   - `groupDigits` — поразрядный фильтр: на каждой позиции номера группы
     (0..3) цифра должна входить в свой список; `null`/`[]` — любая.
     Проверка — `groupMatchesDigits`; группа обязана быть 4 цифры.
   - `keywords` — хотя бы одно совпадение с `ctx.keywords`.
     Сравнение: normalize (lowercase, `ё→е`, не-буквы → пробел), затем
     `includes` или совпадение основ слов (первые 5 символов) — терпит падежи:
     «физика» ↔ «физике», «Физика (лек.)».
2. Среди подходящих считается score:
   ```
   score = priority
         + 100 × (число совпавших ключевых слов)
         + 50  (если задан buildings)
         + 30  (если задан groupDigits)
         + 25  (если задан groups)
   ```
3. Побеждает максимальный score (при равенстве — первое в массиве).

Объявление без `targeting` участвует всегда и проигрывает тематическому.

## 5. Здание дня

`getDayBuilding(lessons)`:
- здание = первое число 1–8 из `lesson.building` (`parseBuilding`);
- считает количество пар по корпусам;
- побеждает корпус с максимумом; при равенстве — меньший номер;
- пустой день → `null`.

`ScheduleComponent` передаёт здание дня в `schedule-top`; `LessonModal` —
здание самой пары и `[lesson.subject]` как ключевые слова (сейчас контекст
передаётся, но таргет не используется).

## 6. Жизненный цикл виджета

1. `useMemo` считает `picks` (какое объявление на каждое место).
2. `useEffect` (первым делом выходит, если реклама на хосте выключена —
   `isAdsEnabled()`, см. §7):
   - создаёт контейнер `div.ad-banner__host` с `id = adfox_<placement>_<uid>`
     (один раз на объявление; **не удаляет** старые — защита от
     `CONTAINER_NOT_FOUND` в StrictMode/при смене таргета);
   - `whenAdfoxReady(() => renderAdfoxBlock(unit, id, handlers))` — если SDK уже
     загружен, вызов сразу, иначе через `yaContextCb`;
   - `handlers.onRender` — основной сигнал: ставит `data-adfox-rendered="true"`
     и разворачивает слот; `onError` — ошибка в консоль (в dev) и в хэндлер;
     `onStub` — заглушку AdFox не показываем (слот остаётся схлопнутым);
   - `MutationObserver` + `ResizeObserver` на host — страховка: если появился
     `a/iframe/img` или изменилась высота, слот разворачивается тем же кодом
     (`data-ready="true"`, `max-height` = реальная высота host, CSS transition
     0 → px).
3. Крестик: `setDismissed[key]`, эффект ставит `max-height: 0`, `opacity: 0`;
   контейнер остаётся в DOM. Ключ — `placement:unitName` (после смены
   контекста/объявления крестик снова доступен).
4. Скрытие в поиске: класс `.ad-banner--hidden` (`display:none`), **не**
   размонтирование — чтобы не ловить гонку инициализации AdFox.

Важно: не размонтировать и не удалять host в cleanup эффекта — AdFox
асинхронен и упадёт с `CONTAINER_NOT_FOUND`.

## 7. AdFox: контракт

- Загрузчик: `https://yandex.ru/ads/system/context.js`, очередь
  `window.yaContextCb`.
- **Где грузится.** Инлайновый скрипт в `index.html` подключает загрузчик
  только на боевом хосте: `localhost`, `127.*`/`10.*`/`192.168.*`/`172.16–31.*`,
  `*.local`, `*.localhost`, `*.test`, `*.invalid` и `file:` — выключены
  (`window.__adsEnabled` не выставляется). Принудительно включить локально:
  `?ads=1`. `AdBanner` при выключенной рекламе не создаёт контейнеры и не
  копит колбэки — в AdFox с dev-хостов не уходит ни один запрос.
- Вызов: `Ya.adfoxCode.create({ ownerId, containerId, params })`; в options
  также передаются `onRender` / `onError` / `onStub`. Исключения из `create`
  не пробрасываются: `renderAdfoxBlock` ловит их и отдаёт в `onError` (иначе
  падает инициализация остальных блоков на странице).
- **Service Worker.** Сторонние скрипты не кэшируются: правило
  `static-assets` в `vite.config.ts` ограничено `sameOrigin`. Иначе
  `context.js` попадал в `StaleWhileRevalidate` на 30 дней и AdFox «ломался»
  после обновлений загрузчика.
- `params`: `p1` — конкретное место (уникален), `p2` — площадка сайта.
  Значения берутся из AdFox: площадка → «Код вставки».
- Площадка должна быть типа **Основной** (веб), не App Mobile Banner.
- Креатив шаблона `Banner Image [context]` рендерится как `<a>` с
  `background-image` и инлайновой высотой; CSS перебивает высоту
  (`height:100% !important`) и задаёт `aspect-ratio` хоста.
- Пропорция: `--ad-banner-aspect` в `AdBanner.css` (`5 / 1` = высота 1/5 ширины;
  `4 / 1`, `3 / 1` — крупнее).

Таргетинг сейчас не используется: каждое место отдаёт то объявление, которое
пришло от AdFox. На будущее возможен серверный вариант — передавать здание и
цифры группы в `params` как `puidN` (дополнительные таргетинги AdFox) и настраивать
условия в кампаниях; предмет пары — через `pk`/`pke`. Тогда новые клиенты
настраиваются только в AdFox, без правок кода. До включения модуля pauid
подбор делает `pickAdUnit` на клиенте.

## 8. Выравнивание и внешний вид

Баннер шире/уже контента не бывает: ширина = ширина контента страницы.

| Место | Класс | Правило |
|---|---|---|
| schedule-top | `ad-banner--page` | `padding: 0 1rem` |
| students-top | — | внутри `.students` (padding 16px) |
| teachers-top | — | `.teachers .ad-banner { margin-inline: -8px }`, т.к. карточки выходят на 8px за padding |
| lesson-bottom | `ad-banner--modal` | `margin-top: 1.5rem` внутри `.lesson_modal` (padding 24px) |

- `--ad-banner-aspect` — пропорция.
- `.ad-banner__slot` — `max-height: 0`, `opacity: 0`, transition; `data-ready`
  включает фон/рамку и крестик.
- `.ad-banner--hidden` — скрытие при поиске.
- `.ad-banner__close` — абсолютный крестик (`right: 2rem`, чтобы не перекрывать
  метку AdFox).

## 9. Тесты

- `src/utils/__tests__/adTargeting.test.ts` — ключевые слова, здание/группа,
  поразрядный `groupDigits`, приоритеты, здание дня.
- `src/utils/__tests__/adfox.test.ts` — флаг `isAdsEnabled`, очередь SDK,
  `create` с хэндлерами, ловля исключений, id контейнеров.
- `src/components/__tests__/AdBanner.test.tsx` — слоты, несколько мест,
  ожидание SDK, `onRender`/`onStub`, крестик, выключенная реклама,
  независимость показа от контекста, неизвестное место.

Запуск: `npm test`, типы: `npm run typecheck`, линт: `npm run lint`.
Текущий статус: 24 файла, 247 тестов — все проходят; typecheck без ошибок;
oxlint — 0 ошибок (8 старых предупреждений).

## 10. Как расширять

**Новая точка показа**
1. Добавить ключ в `AdPlacement` и `AD_PLACEMENTS` (можно скопировать соседний).
2. Вставить `<AdBanner placement="новый-ключ" context={{...}} />`.
3. Создать площадку/баннер в AdFox, взять `p1/p2`.

**Новое объявление в существующем месте**
1. В AdFox создать кампанию и баннер (`Основной`, шаблон `Banner Image [context]`).
2. В `Размещении` баннера отметить нужные из четырёх существующих площадок.
3. Сохранить и запустить. **Код приложения не меняется.**

**Сменить креатив**
- Только в AdFox (баннер → Изображение/URL), код не меняется.

**Изменить таргет**
- Таргетинг сейчас отключён: у объявлений в `AD_PLACEMENTS` нет `targeting`.
- Если включать: поля `keywords/buildings/groups/groupDigits` у unit'а; логику
  сравнения — в `adTargeting.ts`.
- Пример: `targeting: { buildings: [3, 5], groupDigits: [[3], [4], null, null] }`
  — 3-й и 5-й корпуса, группы 34xx.
- AdFox-переменные для этого не нужны: выбор делает клиент. Если позже понадобится
  серверный таргет — можно передавать те же данные в `params` (InPage-параметры)
  и настраивать условия в кампании, но выбор креатива между площадками всё равно
  останется на приложении.

## 11. Диагностика

- `Ya.adfoxCode.getErrorsLog()` в консоли — ошибки AdFox по `containerId`.
- Network: `https://yandex.ru/adfox/<ownerId>/getBulk/v2?...`; пустой `data` и
  `errors[{status:"404"}]` = нет активного креатива/не привязано место;
  `status:"204"` — баннер есть, но не отдаётся (например, период баннера вне
  периода кампании).
- `ERR_BLOCKED_BY_CLIENT` на `context.js` — блокировщик, рекламы не будет.
- `CONTAINER_NOT_FOUND` — кто-то удалил host до инициализации SDK (нельзя
  удалять контейнеры в cleanup). Ловится в `onError` и пишется в консоль
  в dev-сборке, страница при этом не падает.
- Пустые слоты схлопнуты (`max-height: 0`), поэтому сломанная реклама не ломает
  вёрстку.
- Реклама «не появляется» локально — так и задумано: на dev-хостах загрузчик не
  подключается. Включить: `http://localhost:5173/?ads=1`.
- `lesson-bottom` живёт в модалке пары; её содержимое теперь прокручивается
  (`.modal-sheet__body`), так что баннер не обрезается на низких экранах.