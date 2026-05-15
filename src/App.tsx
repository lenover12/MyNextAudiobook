import { useEffect, useState, useRef } from "react";
import { useAmbientCanvas } from "./hooks/useAmbientCanvas";
import { useColourFromImage } from "./hooks/useColourFromImage";
import { useTsPulseCanvas } from "./hooks/useTsPulseCanvas";
import { processTitle } from "./utils/getTitleElements";
import { usePreloadBooks } from "./hooks/usePreloadBooks";
import { useScrollNavigation } from "./hooks/useScrollNavigation";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";
import { useArrowNavigation } from "./hooks/useArrowNavigation"
import { useGeoAffiliateLink } from "./hooks/useGeoAffiliate";
import { BookTitle } from "./components/BookTitle";
import { useLoadingStates } from "./hooks/useLoadingStates";
import audibleBadge from "./assets/badge/audible.png";
import {
  createBmcPromoBook,
  bmcBadge,
  bmcQrImage,
  BMC_URL,
  PROMO_INTERVAL,
  PROMO_INTERVAL_FIRST_VISIT,
} from "./utils/bmcPromoBook";
import { BookImageWrapper } from "./components/BookImageWrapper";
import SwipeIndicator from "./components/SwipeIndicator";
import ClickIndicator from "./components/ClickIndicator";
import { QRCodeCard } from "./components/QRCode";
import { canUseNavigator } from "./utils/shareSocials";
import ShareNavigatorButton from "./components/ShareNavigatorButton";
import ShareDropdownButton from "./components/ShareDropdownButton";
import { useQueryParams } from "./hooks/useQueryParams";
import { fetchBookByIds } from "./utils/audiobookAPI";
import type { AudiobookDTO } from "./dto/audiobookDTO";
import type { BookDBEntry } from "./dto/bookDB";
import { dbEntryToAudiobookDTO, audiobookDTOToDbEntry } from "./dto/audiobookConverters";
import { useOptions } from "./hooks/useOptions";
import LibraryMenu from "./components/LibraryMenu";
import OptionsMenu from "./components/OptionsMenu";
import type { Genre } from "./dto/genres";
import { useHistory } from "./hooks/useHistory";
import FavouritesButton from './components/FavouritesButton';
import { GenreLabel } from "./components/GenreLabel";
import { trackEvent, toBookId } from "./utils/analytics";
import { usePlaybackAnalytics } from "./hooks/usePlaybackAnalytics";
import { bootstrapAnalytics } from "./utils/consent";
import CookieConsentModal from "./components/CookieConsentModal";
import type { LanguageCode } from "./dto/languages";
import { t } from "./utils/translations";
//todo
import { seedFallbackBooksIfEmpty } from "./utils/cacheStorage";

import { animated } from '@react-spring/web';
import { refreshCountryIfChanged } from "./utils/getGeo";

const BMC_RAIN_SCALES = (() => {
  const scales = Array(11).fill(1) as number[];
  const varied = new Set<number>();
  while (varied.size < 3) varied.add(Math.floor(Math.random() * 11));
  for (const i of varied) scales[i] = 0.5 + Math.random() * 3.0;
  return scales;
})();

function App() {
  const { options, setOptions } = useOptions();
  const { addEntry: addHistory } = useHistory();

  const analyticsId = "G-Q45Y5F2WB0"
  bootstrapAnalytics(analyticsId);

  //localisation
  const lang: LanguageCode = options.languageCode ?? "en";

  //tutorial
  const SHOW_TUTORIAL_DELAY = 12_000; //40 seconds
  const [allowSwipeHint, setAllowSwipeHint] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [allowClickHint, setAllowClickHint] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);
  const hasClickedBookCover = options.hasClickedBookCover ?? false;
  const hasScrolledBook = options.hasScrolledBook ?? false;
  useEffect(() => {
    if (hasScrolledBook) return;

    const t = setTimeout(() => {
      setAllowSwipeHint(true);
      requestAnimationFrame(() => {
        setShowSwipeHint(true);
      });
    }, (SHOW_TUTORIAL_DELAY));

    return () => clearTimeout(t);
  }, [hasScrolledBook]);

  useEffect(() => {
    if (hasClickedBookCover) return;

    const t = setTimeout(() => {
      setAllowClickHint(true);
      requestAnimationFrame(() => {
        setShowClickHint(true);
      });
    }, SHOW_TUTORIAL_DELAY * 1.5);

    return () => clearTimeout(t);
  }, [hasClickedBookCover]);

  //load page with a book itunesId &| asin in the domain then it will be the first book
  const query = useQueryParams();
  const sharedItunesId = query.get("i");
  const sharedAsin = query.get("a");
  
  // The seed/shared book
  const [seedBook, setSeedBook] = useState<AudiobookDTO | null>(null);
  // Fetch the shared book ONCE on page load
  useEffect(() => {
    if (sharedItunesId || sharedAsin) {
      fetchBookByIds({ itunesId: sharedItunesId, asin: sharedAsin })
      .then((book) => {
        if (book) setSeedBook(book);
      })
      .catch(() => setSeedBook(null));
    }
  }, [sharedItunesId, sharedAsin]);
  
  const {
    books,
    currentBook: book,
    currentIndex,
    previous,
    insertNext,
    jumpTo,
    smartNext,
    queueNext,
  } = usePreloadBooks({
    genres: options.enabledGenres as Genre[],
    allowExplicit: options.allowExplicit,
    allowFallback: options.allowFallback,
    mustHaveAudible: options.mustHaveAudible,
    preloadAhead: options.preloadAhead,
    seed: seedBook ?? null,
  });

  //Update the URL whenever the current book changes
  useEffect(() => {
    if (!book) return;

    if (book.__isPr || book.__isPlaceholder) {
      if (window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }

    if (options.bookIdsInDomain) {
      const params = new URLSearchParams();
      if (book.itunesId) params.set("i", book.itunesId.toString());
      if (book.asin) params.set("a", book.asin);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    } else {
      if (window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [book, options.bookIdsInDomain]);

  //book placement for scrolling
  const getBookByOffset = (offset: number) => {
    const idx = currentIndex + offset;
    return books[idx] ?? null;
  };
  const bookTriplet = [
    { book: getBookByOffset(-1), className: "book-previous", offset: "-100vh" },
    { book: getBookByOffset(0), className: "book-current", offset: "0vh" },
    { book: getBookByOffset(1), className: "book-next", offset: "+100vh" },
  ];

  const { loadingStates, initLoadingState, markFadeIn, markLoaded } = useLoadingStates();
  
  //add fetched book to history
  useEffect(() => {
    if (!book) return;
    if (book.__isPlaceholder) return;
    if (book.__isPr) return;
    addHistory(audiobookDTOToDbEntry(book));
  }, [book, addHistory]);

  //insert a promotional card every PROMO_INTERVAL real books.
  //first-visit users see the first promo sooner (PROMO_INTERVAL_FIRST_VISIT)
  const realBooksViewedRef = useRef(0);
  const nextPromoAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!book || book.__isPlaceholder || book.__isPr) return;
    realBooksViewedRef.current++;
    const firstThreshold = hasScrolledBook ? PROMO_INTERVAL : PROMO_INTERVAL_FIRST_VISIT;
    if (nextPromoAtRef.current === null) nextPromoAtRef.current = firstThreshold;
    if (realBooksViewedRef.current >= nextPromoAtRef.current) {
      nextPromoAtRef.current += PROMO_INTERVAL;
      queueNext(createBmcPromoBook());
    }
  }, [book, hasScrolledBook, queueNext]);


  //canvas background effect
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bookTitleRef = useRef<HTMLDivElement>(null);
  const bookInfoRowRef = useRef<HTMLDivElement>(null);
  const [maxTitleHeight, setMaxTitleHeight] = useState(0);
  const [maxTitleWidth, setMaxTitleWidth] = useState(0);

  //image color
  const imageColour = useColourFromImage(book?.itunesImageUrl ?? null);

  //canvas pulse effect
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);
  const bookImageWrapperRef = useRef<HTMLDivElement>(null);
  const [tsPulseEnabled] = useState(false);
  // const [tsPulseEnabled, setTsPulseEnabled] = useState(false);
  const { pulseOnce } = useTsPulseCanvas(pulseCanvasRef, tsPulseEnabled, bookImageWrapperRef, imageColour);

  //css pulse effect
  const [cssPulseVisible, setCssPulseVisible] = useState(false);

  //audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPausedRef = useRef(false);
  const FADE_OUT_DURATION = 600;

  //track audio playback
  usePlaybackAnalytics(audioRef, { id: (book?.asin ?? book?.itunesId)?.toString() });

  //scroll
  // const [scrolled, setScrolled] = useState(false);

  //title fade
  const [titleVisible, setTitleVisible] = useState(true);
  const [titleText, setTitleText] = useState(book?.title ?? '');

  //title shifting
  const [titleShifted, setTitleShifted] = useState(false);

  //badge fade
  const [badgeVisible, setBadgeVisible] = useState(true);

  // QR code fade
  const [qrVisible, setQRVisible] = useState(false);

  //tracks which badge/title/QR variant to display and switch during the invisible window
  //so React never swaps elements at full opacity
  const [isPromoDisplay, setIsPromoDisplay] = useState(false);

  //BMC promo alt image state (hover = desktop, click = mobile persistent until scroll past)
  const [bmcHovered, setBmcHovered] = useState(false);
  const [bmcClicked, setBmcClicked] = useState(false);

  useEffect(() => {
    if (!isPromoDisplay) {
      setBmcHovered(false);
      setBmcClicked(false);
    }
  }, [isPromoDisplay]);

  //supliment -webkit-user-drag: none; browser compatability
  useEffect(() => {
    const handler = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragstart", handler);
    return () => document.removeEventListener("dragstart", handler);
  }, []);

  //update country on page load
  useEffect(() => { refreshCountryIfChanged(); }, []);

  //seed cached books on page load
  useEffect(() => { seedFallbackBooksIfEmpty(); }, []);

  const [lastBookId, setLastBookId] = useState<string | null>(null);

  //active menu's to ignore scroll/swipe events
  const [consentActive, setConsentActive] = useState(false);
  const [libraryActive, setLibraryActive] = useState(false);
  const [optionsActive, setOptionsActive] = useState(false);

  const menuActive = consentActive || libraryActive || optionsActive;

  useEffect(() => {
    document.body.style.overflow = menuActive ? "hidden" : "";
  }, [menuActive]);

  const onScrollNext = () => {
    if (menuActive) return;
    if (book?.itunesId) setLastBookId(book.itunesId.toString());
    isPausedRef.current = audioRef.current?.paused ?? true;
    smartNext();

    //update options
    if (!options.hasScrolledBook) {
      setOptions(prev => ({
        ...prev,
        hasScrolledBook: true
      }));
    }
  };
  
  const onScrollPrevious = () => {
    if (menuActive) return;
    if (book?.itunesId) setLastBookId(book.itunesId.toString());
    previous();
  };

  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const isTouchDevice = /Mobi|Android|iPhone|iPad|iPod|Tablet|Touch/i.test(navigator.userAgent);

  if (!isTouchDevice) {
    useScrollNavigation({
      onNext: onScrollNext,
      onPrevious: onScrollPrevious,
      canGoNext: !!book,
      canGoPrevious: currentIndex > 0,
      disabled: menuActive,
    });

    useArrowNavigation({
      onNext: onScrollNext,
      onPrevious: onScrollPrevious,
      canGoNext: !!book,
      canGoPrevious: currentIndex > 0,
      disabled: menuActive,
    });
  }

  const { y } = useSwipeNavigation({
    swipeContainerRef,
    onNext: onScrollNext,
    onPrevious: onScrollPrevious,
    canGoNext: !!book,
    canGoPrevious: currentIndex > 0,
    disabled: menuActive,
  });

  //affiliate links
  const audibleLink = useGeoAffiliateLink(book?.__isPr ? "" : (book?.asin ?? ""));

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const pulseEl = bookImageWrapperRef.current?.querySelector(".css-pulse") as HTMLElement | null;
  
    if (audio.paused) {
      isPausedRef.current = false;

      pulseOnce();
      
      audio.play().then(() => {
        // setTsPulseEnabled(true);
        setCssPulseVisible(true);
        pulseEl?.classList.remove("fade-out-glow");
      }).catch(console.warn);
    } else {
      isPausedRef.current = true;

      // setTsPulseEnabled(false);

      audio.pause();
    
      pulseEl?.classList.remove("fade-out-glow");
      if (pulseEl) void pulseEl.offsetWidth;
    
      pulseEl?.classList.add("fade-out-glow");
    
      setTimeout(() => {
        if (isPausedRef.current) {
          setCssPulseVisible(false);
          pulseEl?.classList.remove("fade-out-glow");
        }
      }, FADE_OUT_DURATION);
    }

    //update options
    if (!options.hasClickedBookCover) {
      setOptions(prev => ({
        ...prev,
        hasClickedBookCover: true
      }));
    }
  };

  //loading image state per book
  useEffect(() => {
    //__initial_placeholder__ used for first book only
    const id = (currentIndex === 0 && !book?.__isPlaceholder)
      ? "__initial_placeholder__" //first book retains placeholdder
      : book?.__isPlaceholder 
        ? "__initial_placeholder__" 
        : book?.itunesId?.toString() ?? null;
    
    console.log('Init loading state for:', id, 'isPlaceholder:', book?.__isPlaceholder, 'currentIndex:', currentIndex);
    
    if (id && !loadingStates[id]) {
      console.log('Initializing loading state fuse or:', id);
      initLoadingState(id);
    }
  }, [book, loadingStates, initLoadingState, currentIndex]);

  //autoplay new audio on change if already playing
  useEffect(() => {
  const audio = audioRef.current;

    if (audio && !isPausedRef.current) {
      const playNext = async () => {
        try {
          await audio.play();
          setCssPulseVisible(true);
        } catch (err) {
          console.warn("Audio play failed:", err);
        }
      };

      playNext();
    }
  }, [book]);

  //pause audio when the tab/app is hidden (e.g. minimise on mobile)
  useEffect(() => {
    if (!options.pauseOnHide) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      audio.pause();
      isPausedRef.current = true;

      const pulseEl = bookImageWrapperRef.current?.querySelector(".css-pulse") as HTMLElement | null;
      pulseEl?.classList.remove("fade-out-glow");
      if (pulseEl) void pulseEl.offsetWidth;
      pulseEl?.classList.add("fade-out-glow");
      setTimeout(() => {
        setCssPulseVisible(false);
        pulseEl?.classList.remove("fade-out-glow");
      }, FADE_OUT_DURATION);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [options.pauseOnHide]);

  //ambient canvas to use promo image colour on portrait for mobile (black for everything else)
  const portraitMobileQuery = "(orientation: portrait) and (hover: none) and (pointer: coarse)";
  const [isPortraitMobile, setIsPortraitMobile] = useState(
    () => window.matchMedia(portraitMobileQuery).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(portraitMobileQuery);
    const handler = (e: MediaQueryListEvent) => setIsPortraitMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  //canvas image
  const currentId = book?.__isPlaceholder
    ? "__initial_placeholder__"
    : book?.itunesId?.toString() ?? book?.asin;

  const currentState = currentId ? loadingStates[currentId] : undefined;

  const rawCanvasImage =
    currentState?.isLoaded && book?.itunesImageUrl
      ? book.itunesImageUrl
      : currentState?.fadeIn && currentState.loadingImg
        ? currentState.loadingImg
        : '';

  //keep the last valid image so the ambient canvas never drops to black
  //during the one-render gap before the new book's loading state is initialised
  const lastCanvasImageRef = useRef<string>('');
  if (rawCanvasImage) lastCanvasImageRef.current = rawCanvasImage;
  const canvasImage = rawCanvasImage || lastCanvasImageRef.current;

  //dark ambiant canvas for non-portrait-mobile for promotional "book" images
  //becomes current before canvasImage can draw the promo colours and cause a flash
  const useDarkCanvas = (book?.__isPr ?? false) && !isPortraitMobile;
  useAmbientCanvas(canvasRef, useDarkCanvas ? null : canvasImage, !useDarkCanvas && !!canvasImage);

  useEffect(() => {
    if (useDarkCanvas) {
      document.documentElement.style.setProperty("--pulse-colour", "rgb(68, 68, 68)");
    } else if (imageColour) {
      document.documentElement.style.setProperty("--pulse-colour", `rgb(${imageColour})`);
    }
  }, [imageColour, useDarkCanvas]);
  
  //book title height
  useEffect(() => {
    if (!bookTitleRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setMaxTitleHeight(entry.contentRect.height);
    });

    observer.observe(bookTitleRef.current);
    return () => observer.disconnect();
  }, [book]);

  //book title width
  useEffect(() => {
    if (!bookInfoRowRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setMaxTitleWidth(entry.contentRect.width);
    });

    observer.observe(bookInfoRowRef.current);
    return () => observer.disconnect();
  }, [book]);

  //book title inner book-change fade effect for scroll
  useEffect(() => {
    if (book?.__isPr) {
      //don't update titleText with the promo ID, just hide it so no text shows while the
      //promo is on screen and there's no flash when the next real book arrives
      setTitleVisible(false);
      return;
    }
    const newTitle = book?.title ?? '';
    if (newTitle === titleText) {
      //when title text didn't change, but visibility may have been suppressed, restore it
      setTitleVisible(true);
      return;
    }

    setTitleVisible(false);

    const timeout = setTimeout(() => {
      setTitleText(newTitle);
      setTitleVisible(true);
    }, 600);

    return () => clearTimeout(timeout);
  }, [book?.title, book?.__isPr]);
  //book title outer drag-based fade effect for swipe
  const titleOpacity = y.to((val) => {
    const abs = Math.abs(val);
    return abs < 60 ? 1 : abs > 120 ? 0 : 1 - (abs - 60) / 60;
  });

  // History and Favourites
  const handleLibrarySelect = (selectedBook: BookDBEntry, source: "favourites" | "history") => {
    const dto = dbEntryToAudiobookDTO(selectedBook);
    
    const idx = books.findIndex(b => b.itunesId === selectedBook.itunesId);

    if (idx !== -1) {
      const distance = idx - currentIndex;

      //close or in history buffer then scroll to book
      if (Math.abs(distance) <= 2 || source === "history") {
        jumpTo(idx);
      //make it the next book
      } else {
        insertNext(dto);
      }
    } else {
      insertNext(dto);
    }
  };

  // Transition effects for book information
  useEffect(() => {
    if (book?.audiblePageUrl) {
      setTitleShifted(false);
      setBadgeVisible(false);
      setQRVisible(false);

      //switch promo/normal content at ~600ms while badge is still invisible
      //this lets BookTitle mount early so the title fades in before the badge,
      //matching the first-load sequence (title > badge > QR).
      const promoSwitchTimeout = setTimeout(() => {
        setIsPromoDisplay(book.__isPr ?? false);
      }, 600);

      const titleShiftTimeout = setTimeout(() => {
        setTitleShifted(true);
      }, 1500);

      const badgeTimeout = setTimeout(() => {
        setBadgeVisible(true);
      }, 1600);

      const qrTimeout = setTimeout(() => {
        setQRVisible(true);
      }, 2400);

      return () => {
        clearTimeout(promoSwitchTimeout);
        clearTimeout(titleShiftTimeout);
        clearTimeout(badgeTimeout);
        clearTimeout(qrTimeout);
      };
    } else {
      setTitleShifted(false);
      setBadgeVisible(false);
      setQRVisible(false);
      setIsPromoDisplay(false);
    }
  }, [book?.audiblePageUrl]);

  //Clean Title
  const { jsx: cleanedTitleElements, cleaned: cleanedTitleText } = processTitle(titleText, 4, true);

  //Temporary Options
  //QR code
  const showQR = options.useQRCode && qrVisible;

  //Navigator Share
  const isNavigatorShare = canUseNavigator() && options.allowNavigatorShare;
  //Share Url
  const domain = window.location.origin;
  const urlParams = new URLSearchParams();
  if (book?.itunesId) urlParams.set("i", book.itunesId.toString());
  if (book?.asin) urlParams.set("a", book.asin);
  const shareUrl = `${domain}/?${urlParams.toString()}`;

  return (
    <div className="app" ref={swipeContainerRef}>
      <OptionsMenu 
        active={optionsActive} 
        setActive={setOptionsActive}
        analyticsId={analyticsId}
      />
      <LibraryMenu 
        active={libraryActive} 
        setActive={setLibraryActive} 
        onSelectBook={handleLibrarySelect}/>
        {allowSwipeHint && (
          <SwipeIndicator visible={showSwipeHint && !hasScrolledBook} />
        )}
        {allowClickHint && (
          <ClickIndicator visible={showClickHint && !hasClickedBookCover} />
        )}
      <animated.div
        className="book-swipe-layer"
        style={{
          transform: y.to((val) => `translateY(${val}px)`),
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        {bookTriplet.map(({ book, className, offset }, i) => {
          const isCurrent = className === "book-current";
          
          //check currentIndex is 0 and this is the current book, then use __initial_placeholder__ as ID
          const isInitialBook = isCurrent && currentIndex === 0;
          
          const bookId = isInitialBook
            ? "__initial_placeholder__"
            : book?.__isPlaceholder
              ? "__initial_placeholder__"
              : book?.itunesId?.toString() ?? book?.asin ?? null;
              
          const loadingState = bookId ? loadingStates[bookId] : null;

          // console.log('Rendering book:', book?.title, 'bookId:', bookId, 'currentIndex:', currentIndex, 'isInitialBook:', isInitialBook);


          return (
            <BookImageWrapper
              key={bookId ?? `placeholder-${i}`}
              book={book}
              bookId={bookId}
              className={className}
              offset={offset}
              y={y}
              isCurrent={isCurrent}
              lastBookId={lastBookId}
              cssPulseVisible={cssPulseVisible}
              loadingState={loadingState}
              initLoadingState={initLoadingState}
              markFadeIn={markFadeIn}
              markLoaded={markLoaded}
              togglePlayPause={togglePlayPause}
              bookImageWrapperRef={isCurrent ? bookImageWrapperRef as React.RefObject<HTMLDivElement> : undefined}
              altImageUrl={book?.__prAltImageUrl}
              showAlt={isCurrent && (bmcHovered || bmcClicked)}
            >
              <div className="genre-title-container">
                {book && !book.__isPr && (
                  <GenreLabel
                    genre={book.genre ?? null}
                  />
                )}
              </div>
              <div className="favourite-container">
                {book && !book.__isPr && (
                  <FavouritesButton
                    book={{
                      asin: book.asin ?? null,
                      itunesId: book.itunesId ?? null,
                      title: book.title,
                      authors: book.authors ?? [],
                      audiblePageUrl: book.audiblePageUrl ?? null,
                      audioPreviewUrl: book.audioPreviewUrl ?? null,
                      itunesImageUrl: book.itunesImageUrl ?? null,
                      genre: book.genre ?? null,
                      timestamp: Date.now(),
                      lastUsedAt: null,
                    }}
                  />
                )}
              </div>
              <div className="share-container">
                {book && !book.__isPr && (audibleLink ?? book.audiblePageUrl) && (
                  isNavigatorShare ? (
                    <ShareNavigatorButton
                      // title={book.title}
                      title={cleanedTitleText}
                      // url={audibleLink ?? book.audiblePageUrl!}
                      url={shareUrl}
                      text={`Listening to "${book.title}"`}
                    />
                  ) : (
                    <ShareDropdownButton
                      // title={book.title}
                      title={cleanedTitleText}
                      // url={audibleLink ?? book.audiblePageUrl!}
                      url={shareUrl}
                      author={book.authors?.[0]}
                      socialsOptions={options.socialsOptions}
                      bookRef={bookImageWrapperRef}
                      bookImage={book.itunesImageUrl ?? undefined}
                    />
                  )
                )}
              </div>
            </BookImageWrapper>
          );
        })}


      </animated.div>
      <div className={`bmc-rain${book?.__isPr ? ' active' : ''}`}>
        <animated.div style={{ opacity: titleOpacity, width: '100%', height: '100%' }}>
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} className="bmc-raindrop">
              <div className="bmc-svg" style={{ transform: `scale(${BMC_RAIN_SCALES[i]})` }} />
            </div>
          ))}
        </animated.div>
      </div>
      <div className="book-static-layer">
        <canvas
          ref={canvasRef}
          className={`canvas-background visible`}
          style={{ width: "100%", height: "auto" }}
        />

        <canvas
          ref={pulseCanvasRef}
          className="canvas-pulse"
          width={600}
          height={600}
        />

        {book && (
          <>
            <div className={"book-info-column"}>
              <div className="book-info-row" ref={bookInfoRowRef}>
                <div
                  className="redirect-badge-container"
                  style={{
                    transition: badgeVisible
                    ? 'opacity 0.6s ease'
                    : 'opacity 0.1s ease-out',
                    opacity: badgeVisible ? 1 : 0,
                    visibility: badgeVisible ? 'visible' : 'hidden',
                    willChange: 'opacity',
                  }}
                >
                  {isPromoDisplay ? (
                    <animated.div style={{ opacity: titleOpacity }}>
                      <a
                        href={BMC_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setBmcHovered(true)}
                        onMouseLeave={() => setBmcHovered(false)}
                        onClick={() => setBmcClicked(true)}
                      >
                        <img src={bmcBadge} alt="Buy me a coffee" className="redirect-badge pr-badge" />
                      </a>
                    </animated.div>
                  ) : (book.audiblePageUrl && audibleLink && (
                    <animated.div style={{ opacity: titleOpacity }}>
                      <a
                        href={audibleLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => { if (book) trackEvent("amazon_clicked", { book_id: toBookId(book) }); }}
                      >
                        <img src={audibleBadge} alt="Find on Audible" className="redirect-badge" />
                      </a>
                    </animated.div>
                  ))}
                </div>
                {!isPromoDisplay && (
                  <p
                    className="affiliate-disclaimer"
                    style={{
                      transition: qrVisible
                      ? 'opacity 0.6s ease'
                      : 'opacity 0.1s ease-out',
                      opacity: qrVisible ? 1 : 0,
                      visibility: qrVisible ? 'visible' : 'hidden',
                      willChange: 'opacity',
                    }}
                  >
                    {t(lang, "affiliate.disclaimer")}
                  </p>
                )}
                <animated.div
                  className={`book-title ${titleShifted ? "shifted" : ""}`}
                  ref={bookTitleRef}
                  style={{ opacity: titleOpacity }}
                >
                  {isPromoDisplay ? (
                    <span className="bmc-title-text"></span>
                  ) : (
                    <BookTitle
                      title={cleanedTitleElements}
                      titleText={titleText}
                      maxHeight={maxTitleHeight}
                      maxWidth={maxTitleWidth}
                      visible={titleVisible}
                    />
                  )}
                </animated.div>
              </div>
              <div
                className="qr-code-container"
                style={{
                  transition: showQR
                    ? "opacity 0.6s ease, flex-basis 0.6s ease"
                    : "opacity 0.1s ease-out, flex-basis 0.1s ease-out",
                  opacity: showQR ? 1 : 0,
                  visibility: showQR ? "visible" : "hidden",
                  willChange: "opacity, flex-basis",
                  flexBasis: showQR ? "var(--qr-basis)" : 0,
                }}
              >
                {(isPromoDisplay || audibleLink) && (
                  <animated.div style={{ opacity: titleOpacity, width: "100%", height: "100%" }}>
                    {isPromoDisplay ? (
                      <img
                        src={bmcQrImage}
                        alt="Buy me a coffee QR code"
                        className="bmc-qr-image"
                        style={{
                          transition: showQR ? "padding 0.6s ease" : "padding 0.1s ease-out",
                          padding: showQR ? "calc(var(--redirect-badge-size) / 8)" : "0",
                        }}
                      />
                    ) : (
                      <QRCodeCard
                        url={audibleLink}
                        style={{
                          transition: showQR ? "padding 0.6s ease" : "padding 0.1s ease-out",
                          padding: showQR ? "calc(var(--redirect-badge-size) / 8)" : "0",
                        }}
                      />
                    )}
                  </animated.div>
                )}
              </div>
            </div>
            {book.audioPreviewUrl && (
              <audio ref={audioRef} src={book.audioPreviewUrl}></audio>
            )}
            <CookieConsentModal
              analyticsId={analyticsId}
              onActiveChange={setConsentActive}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default App
