export function loadTcgImg(img: string, lowQuality = false) {
  if (!img) return "";
  if (!img.includes("assets.tcgdex")) return img;
  if (img.endsWith(".webp") || img.endsWith(".png") || img.endsWith(".jpg") || img.endsWith(".jpeg")) {
    return img;
  }
  if (img.includes("logo")) return `${img}.webp`;
  if (lowQuality) {
    return `${img}/low.webp`;
  }
  return `${img}/high.webp`;
}

