export async function fetchRandom() {
  const term = ["fantasy", "mystery"][Math.floor(Math.random() * 2)];
  const url = `https://itunes.apple.com/search?term=${term}&media=audiobook&limit=25`
  const response = await fetch(url);
  const data = await response.json();
  const results = data.results.filter((item: any) => item.previewUrl);
  return results[Math.floor(Math.random() * results.length)];
}