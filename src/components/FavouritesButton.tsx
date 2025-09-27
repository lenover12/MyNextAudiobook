import React, { useState, useEffect, useRef } from "react";
import { useFavourites } from "../hooks/useFavourites";
import type { BookDBEntry } from "../dto/bookDB";
import { getBookDBId } from "../utils/getBookDBId";

type FavouriteButtonProps = {
    book: BookDBEntry;
};

export default function FavouriteButton({ book }: FavouriteButtonProps) {
    if (!book) return null;

    const { favourites, addEntry, removeEntry } = useFavourites();
    const [isFavourite, setIsFavourite] = useState(false);
    const [spin, setSpin] = useState(false);
    const [gradientId] = useState(() => `goldGradient-${Math.random().toString(36).slice(2)}`);

    const id = getBookDBId(book);
    const iconRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!id) return;
        const fav = favourites.some((f) => getBookDBId(f) === id);
        setIsFavourite(fav);
    }, [favourites, id]);

    const toggleFavourite = async () => {
        if (!id) return;

        if (isFavourite) {
            await removeEntry(id);
        } else {
            await addEntry(book);
            setSpin(true);
        }
    };

    useEffect(() => {
        const wrapper = iconRef.current;
        if (!wrapper) return;

        const handleAnimationEnd = () => {
            setSpin(false);
        };

        wrapper.addEventListener("animationend", handleAnimationEnd);
        return () => {
            wrapper.removeEventListener("animationend", handleAnimationEnd);
        };
    }, []);

    return (
        <button
            className="favourite-button"
            onClick={toggleFavourite}
            aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
            <span
                ref={iconRef}
                className={`icon-wrapper ${spin ? "spin" : ""}`}
            >
                <svg
                    className={`star-icon ${isFavourite ? "favourited" : "unfavourited"}`}
                    viewBox="0 0 576 512"
                    width="1em"
                    height="1em"
                >
                    <defs>
                        <linearGradient id={`${gradientId}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFD700" />
                            <stop offset="100%" stopColor="#FFA500" />
                        </linearGradient>
                        <linearGradient id={`${gradientId}-grey`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#DDD" />
                            <stop offset="100%" stopColor="#AAA" />
                        </linearGradient>
                    </defs>
                    <path
                        className={`star-path ${isFavourite ? "favourited" : "unfavourited"}`}
                        d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36-17.7 54.6l105.7 103-25 145.5c-4.5
            26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 
            105.7-103c19-18.6 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"
                        style={{ fill: `url(#${isFavourite ? `${gradientId}-gold` : `${gradientId}-grey`})` }}
                    />
                </svg>
            </span>
        </button>
    );
}
