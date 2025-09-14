# CSS & HTML Refresher Notes

## 1. `<ul>` Defaults
- `<ul>` is **vertical by default** (its `<li>` children stack vertically).
- No need for `flex-direction: column;` on `<ul>` unless you are using `display: flex;`.

---

## 2. `flex-direction: column;`
```css
.sidebar {
  display: flex;
  flex-direction: column;
}
```
- Applied to `.sidebar` to make its **direct children** (logo and nav) stack vertically.
- Without it, flex items are placed in a row by default.

---

## 3. CSS Units
- **px** → absolute pixels.
- **em** → relative to parent element's font size.
- **rem** → relative to root (`<html>`) font size.  
  - If root font size = `16px`, then `1rem = 16px`.
- **%** → relative to parent’s dimension (width, height, etc.).
- **vh / vw** → relative to viewport height/width.

---

## 4. Class Selectors: Space vs No Space

### `.sidebar ul`
- Descendant selector: selects `<ul>` inside `.sidebar` (any depth).

### `.sidebar.active`
- Compound selector: selects elements that have **both** `sidebar` and `active` classes.

### `div.sidebar`
- Selects only `<div>` elements with class `sidebar`.  
- More specific than `.sidebar` alone.

---

## 5. CSS Specificity (Priority)

| Selector Example       | Specificity Points |
|----------------------|-------------------|
| `ul`                | 1 |
| `.sidebar`          | 10 |
| `.sidebar ul`       | 11 |
| `.sidebar.active`   | 20 |
| `div.sidebar.active`| 21 |
| `#main-content`     | 100 |

- **More specific selectors override less specific ones.**
- If specificity is the same, the **later rule in the CSS file** wins.

---

## 6. Inline Styles & `!important`

| Style Type                  | Winner? |
|---------------------------|---------|
| External CSS              | Normal |
| Inline Style (`style=""`) | Stronger |
| External with `!important`| Beats normal inline |
| Inline with `!important`  | **Ultimate winner** |

**Rule of thumb:**
- Avoid inline styles for maintainability.
- Use `!important` sparingly — only when absolutely necessary.
- Prefer toggling **classes** in JS to apply state-based styles.

---

## Key Takeaways
- Keep selectors simple and use classes for styling.
- Use `rem` for scalable spacing.
- Understand specificity to avoid fighting your own CSS.
- Reserve `!important` for rare overrides.
