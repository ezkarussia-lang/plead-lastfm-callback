export const metadata = { title: "Contoured" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box}
          body{background:#111;color:#fff;
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
            display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
          .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;
            padding:48px 40px;max-width:440px;width:100%;text-align:center}
          .icon{font-size:56px;margin-bottom:20px;display:block}
          .heading-success{font-size:24px;font-weight:700;margin-bottom:10px;color:#b90000}
          .heading-error{font-size:24px;font-weight:700;margin-bottom:10px;color:#666}
          p{color:#aaa;font-size:15px;line-height:1.6;margin-bottom:6px}
          .tag{display:inline-flex;align-items:center;gap:6px;color:#fff;
            padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-top:20px}
          .footer{color:#888;font-size:13px;margin-top:16px}
          strong{color:#fff}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
