let bookSize = 0;

export function getBookSize() {
  return bookSize;
}

export function updateBookSize() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const value = style.getPropertyValue("--book-size").trim();

  if (!value) return;

  if (value.endsWith("px")) {
    bookSize = parseFloat(value);
  } else if (value.endsWith("vmin")) {
    const vmin = parseFloat(value);
    bookSize = (Math.min(window.innerWidth, window.innerHeight) * vmin) / 100;
  } else {
    bookSize = 0;
  }
}
