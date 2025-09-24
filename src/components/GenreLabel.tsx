type Props = {
  genre: string | null;
};

export function GenreLabel({ genre }: Props) {

  return (
    <div className="genre-title">
      <p>{genre}</p>
    </div>
  );
}
