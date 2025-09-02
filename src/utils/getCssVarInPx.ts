export function getCssVarInPx(el: HTMLElement, varName: string): number {
  const style = getComputedStyle(el);
  const value = style.getPropertyValue(varName).trim();
  
  if (!value) return 0;

  if (value.endsWith("px")) {
    return parseFloat(value);
  }

  if (value.endsWith("vmin")) {
    const vmin = parseFloat(value);
    return (Math.min(window.innerWidth, window.innerHeight) * vmin) / 100;
  }

  const temp = document.createElement("div");
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  temp.style.width = value;
  document.body.appendChild(temp);
  const pixels = temp.getBoundingClientRect().width;
  document.body.removeChild(temp);

  return pixels;
}
