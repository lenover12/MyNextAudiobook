export function useShareNavigator() {
  const share = async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        console.error("Sharing failed:", err);
      }
    }
  };

  return { share };
}
