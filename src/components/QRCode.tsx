import QRCode from "react-qr-code";

type Props = {
  url: string | null;
};

export function QRCodeCard({ url }: Props) {
  if (!url) return null;

  return (
    <div
      className="qr-code-card"
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '10px',
        background: 'white',
        borderRadius: '3px',
        boxShadow: '0 0 8px rgba(0,0,0,0.2)',
      }}
    >
      <QRCode value={url} size={128} level="L" />
    </div>
  );
}
