import { useEffect, useRef, type RefObject } from "react";
import { trackEvent } from "../utils/analytics";

type Ids = { id?: string | null };

export function usePlaybackAnalytics(
  audioRef: RefObject<HTMLAudioElement | null>,
  ids: Ids
) {
  const fired30 = useRef(false);
  const fired120 = useRef(false);
  const fired300 = useRef(false);

  useEffect(() => {
    fired30.current = false;
    fired120.current = false;
    fired300.current = false;
  }, [ids.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !ids.id) return;

    const book_id = ids.id;

    const onTime = () => {
      const t = el.currentTime || 0;
      if (t >= 30 && !fired30.current) {
        fired30.current = true;
        trackEvent("sample_play_30s", { book_id });
      }
      if (t >= 120 && !fired120.current) {
        fired120.current = true;
        trackEvent("sample_play_2min", { book_id });
      }
      if (t >= 300 && !fired300.current) {
        fired300.current = true;
        trackEvent("sample_finished", { book_id });
      }
    };

    const onPause = () => {
      trackEvent("sample_paused", { book_id, position: el.currentTime || 0 });
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("pause", onPause);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("pause", onPause);
    };
  }, [audioRef, ids.id]);
}
