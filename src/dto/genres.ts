export const genreOptions = [
  { label: "Arts & Entertainment" },
  { label: "Biographies & Memoirs" },
  { label: "Business & Personal Finance" },
  { label: "Children & Teens" },
  { label: "Classics" },
  { label: "Comedy" },
  { label: "Drama & Poetry" },
  { label: "Fiction" },
  { label: "History" },
  { label: "Languages" },
  { label: "Mysteries & Thrillers" },
  { label: "Nonfiction" },
  { label: "Religion & Spirituality" },
  { label: "Romance" },
  { label: "Sci-Fi & Fantasy" },
  { label: "Science & Nature" },
  { label: "Self-Development" },
  { label: "Sports & Outdoors" },
  { label: "Technology" },
  { label: "Travel & Adventure" },
] as const;

export type Genre = (typeof genreOptions)[number]["label"];
