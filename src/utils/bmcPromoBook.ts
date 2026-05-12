import img1 from '../assets/bmc_img/1.png';
import img2 from '../assets/bmc_img/2.png';
import img3 from '../assets/bmc_img/3.png';
import img4 from '../assets/bmc_img/4.png';
import img5 from '../assets/bmc_img/5.png';
import img6 from '../assets/bmc_img/6.png';
import type { AudiobookDTO } from '../dto/audiobookDTO';

export { default as bmcBadge } from '../assets/badge/bmc.png';
export { default as bmcQrImage } from '../assets/bmc_img/bmc-qr.png';

const BMC_IMAGES = [img1, img2, img3, img4, img5, img6];
export const BMC_URL = 'https://www.buymeacoffee.com/leo12';

// First promo triggers at this many real books for a returning user.
export const PROMO_INTERVAL = 50;
// First promo triggers earlier on a user's first visit.
export const PROMO_INTERVAL_FIRST_VISIT = 30;

export function createBmcPromoBook(): AudiobookDTO {
  const image = BMC_IMAGES[Math.floor(Math.random() * BMC_IMAGES.length)];
  const id = Math.random().toString(36).slice(2, 9);
  return {
    asin: `__pr_${id}`,
    isbn: null,
    itunesId: null,
    // Unique per instance so transition effects re-fire between consecutive promos.
    // The fragment is ignored by the browser when opening the link.
    title: `__pr_${id}`,
    subtitle: null,
    censored_title: null,
    authors: null,
    narrators: null,
    publisher: null,
    audiblePageUrl: `${BMC_URL}#${id}`,
    itunesPageUrl: null,
    audioPreviewUrl: null,
    itunesImageUrl: image,
    audibleImageUrl: null,
    description: null,
    summary: null,
    genre: null,
    genres: null,
    seriesList: null,
    releaseDate: null,
    rating: null,
    lengthMinutes: null,
    durationMinutes: null,
    bookFormat: null,
    language: null,
    explicit: null,
    region: null,
    regions: null,
    _fallback: false,
    __isPr: true,
  };
}
