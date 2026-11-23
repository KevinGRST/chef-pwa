import "./globals.css";

export const metadata = {
    title: "ChefPWA - Recetas",
    description: "Aplicación Web Progresiva de recetas con TheMealDB",
    manifest: "/manifest.json",
};

export const viewport = {
    themeColor: "#0C0A09",
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}