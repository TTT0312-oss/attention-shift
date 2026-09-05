import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./combo-effects.css";

export const metadata:Metadata={title:"Attention Shift",description:"次々届く依頼を見極めて処理する、1分間のブラウザゲーム。"};
export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,viewportFit:"cover",themeColor:"#10130f"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ja"><body>{children}</body></html>}
