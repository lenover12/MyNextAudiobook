import { useOptions } from "../hooks/useOptions";
import { t } from "../utils/translations";

type Props = {
  genre: string | null;
};

export function GenreLabel({ genre }: Props) {
  const { options } = useOptions();
  const lang = options.languageCode ?? "en";

  return (
    <div className="genre-title">
      <p>{genre ? t(lang, "genre." + genre) : ""}</p>
    </div>
  );
}
