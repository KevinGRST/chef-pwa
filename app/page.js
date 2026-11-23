"use client";
import { useState, useEffect } from "react";
import { searchMeals } from "@/lib/meals";
import InstallPrompt from "./components/InstallPrompt";

export default function Home() {
    const [query, setQuery] = useState("");
    const [meals, setMeals] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isOnline, setIsOnline] = useState(true);

    // Estados para el Toast y la Alerta de confirmación
    const [toast, setToast] = useState(null);
    const [mealToRemove, setMealToRemove] = useState(null);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        const savedFavs = localStorage.getItem("favorite_meals");
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        const cachedMeals = localStorage.getItem("last_meals");
        if (cachedMeals) setMeals(JSON.parse(cachedMeals));

        fetchMeals("");

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Ocultar el toast automáticamente después de 2.8 segundos
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(timer);
    }, [toast]);

    const fetchMeals = async (searchTerm) => {
        setLoading(true);
        setError("");
        setShowFavorites(false);

        try {
            const results = await searchMeals(searchTerm);
            const formatted = searchTerm.trim() ? results : results.slice(0, 6);
            setMeals(formatted);
            localStorage.setItem("last_meals", JSON.stringify(formatted));
        } catch (err) {
            const savedFavs = JSON.parse(
                localStorage.getItem("favorite_meals") || "[]"
            );
            const cachedMeals = JSON.parse(
                localStorage.getItem("last_meals") || "[]"
            );

            if (cachedMeals.length > 0) {
                setMeals(cachedMeals);
                setError("Sin conexión — Mostrando recetas guardadas.");
            } else if (savedFavs.length > 0) {
                setShowFavorites(true);
                setError("Sin conexión — Mostrando tus favoritos.");
            } else {
                setError(err.message || "No se pudieron cargar las recetas.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMeals(query);
    };

    const isFavorite = (idMeal) =>
        favorites.some((item) => item.idMeal === idMeal);

    // Maneja el clic en ✓: si ya es favorita pide confirmación; si no, la agrega y lanza el toast
    const handleFavoriteClick = (e, meal) => {
        e.stopPropagation();

        if (isFavorite(meal.idMeal)) {
            setMealToRemove(meal);
        } else {
            const updated = [...favorites, meal];
            setFavorites(updated);
            localStorage.setItem("favorite_meals", JSON.stringify(updated));
            setToast({
                message: `"${meal.strMeal}" agregada a favoritos`,
                type: "added",
            });
        }
    };

    // Ejecuta la eliminación tras confirmar en la alerta
    const confirmRemoveFavorite = () => {
        if (!mealToRemove) return;

        const updated = favorites.filter(
            (item) => item.idMeal !== mealToRemove.idMeal
        );
        setFavorites(updated);
        localStorage.setItem("favorite_meals", JSON.stringify(updated));

        setToast({
            message: `"${mealToRemove.strMeal}" eliminada de favoritos`,
            type: "removed",
        });
        setMealToRemove(null);
    };

    const getIngredientsList = (meal) => {
        const list = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                list.push(
                    `${ingredient.trim()}${measure?.trim() ? ` · ${measure.trim()}` : ""}`
                );
            }
        }
        return list;
    };

    const displayedMeals = showFavorites ? favorites : meals;

    return (
        <main className="min-h-screen bg-stone-950 text-stone-100 selection:bg-orange-500/30 selection:text-orange-200">
            <div className="max-w-5xl mx-auto px-5 py-8 sm:py-12">
                {/* Header minimalista */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <h1 className="text-xl font-semibold tracking-tight text-stone-100">
                            ChefPWA
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isOnline && (
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Offline
                            </span>
                        )}
                        <InstallPrompt />
                    </div>
                </header>

                {/* Barra superior: Input + Buscar + Favoritos */}
                <section className="flex flex-col sm:flex-row gap-3 mb-10">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <input
                            type="text"
                            placeholder="Buscar receta (ej. Chicken, Pasta, Cake)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 h-11 px-4 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-stone-950 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Buscar
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={() => setShowFavorites(!showFavorites)}
                        className={`h-11 px-5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${showFavorites
                                ? "bg-emerald-500 border-emerald-500 text-stone-950 font-semibold"
                                : "bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700"
                            }`}
                    >
                        Favoritos
                        <span
                            className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${showFavorites
                                    ? "bg-emerald-600/40 text-stone-950"
                                    : "bg-stone-800 text-stone-400"
                                }`}
                        >
                            {favorites.length}
                        </span>
                    </button>
                </section>

                {/* Encabezado de sección */}
                <div className="flex items-baseline justify-between mb-5">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                        {showFavorites
                            ? "Guardadas en favoritos"
                            : query.trim()
                                ? `Resultados para "${query}"`
                                : "Sugerencias"}
                    </h2>
                    {showFavorites && (
                        <button
                            onClick={() => setShowFavorites(false)}
                            className="text-xs font-medium text-orange-400 hover:text-orange-300 cursor-pointer"
                        >
                            Ver todas
                        </button>
                    )}
                </div>

                {/* Alerta discreta */}
                {error && (
                    <p className="mb-6 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 px-4 py-2.5 rounded-xl">
                        {error}
                    </p>
                )}

                {/* Estado de carga / Vacío / Cuadrícula 3x2 */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, idx) => (
                            <div
                                key={idx}
                                className="aspect-[4/3] rounded-2xl bg-stone-900 animate-pulse"
                            />
                        ))}
                    </div>
                ) : displayedMeals.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl bg-stone-900/60 border border-stone-800/80">
                        <p className="text-sm text-stone-400">
                            {showFavorites
                                ? "Aún no tienes recetas marcadas con ✓ en Favoritos."
                                : "No se encontraron recetas con ese nombre."}
                        </p>
                    </div>
                ) : (
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedMeals.map((meal) => {
                            const checked = isFavorite(meal.idMeal);
                            return (
                                <article
                                    key={meal.idMeal}
                                    onClick={() => setSelectedMeal(meal)}
                                    className="group relative bg-stone-900 rounded-2xl overflow-hidden border border-stone-800/80 hover:border-stone-700 transition-all duration-300 cursor-pointer"
                                >
                                    {/* Casilla de verificación (✓) */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleFavoriteClick(e, meal)}
                                        title={
                                            checked ? "Quitar de favoritos" : "Guardar en favoritos"
                                        }
                                        aria-label="Marcar favorita"
                                        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${checked
                                                ? "bg-emerald-500 text-stone-950 shadow-md"
                                                : "bg-stone-950/70 backdrop-blur-md text-stone-400 hover:text-stone-100 border border-stone-700/70"
                                            }`}
                                    >
                                        ✓
                                    </button>

                                    <div className="aspect-[4/3] overflow-hidden bg-stone-800">
                                        <img
                                            src={meal.strMealThumb}
                                            alt={meal.strMeal}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-base text-stone-100 line-clamp-1">
                                            {meal.strMeal}
                                        </h3>
                                        <p className="text-xs text-stone-400 mt-1">
                                            {meal.strCategory} · {meal.strArea}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>

            {/* Modal limpio de detalle de receta */}
            {selectedMeal && (
                <div
                    onClick={() => setSelectedMeal(null)}
                    className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6"
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <span className="text-xs font-medium text-orange-400">
                                    {selectedMeal.strCategory} · {selectedMeal.strArea}
                                </span>
                                <h2 className="text-2xl font-semibold text-stone-100 mt-1">
                                    {selectedMeal.strMeal}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedMeal(null)}
                                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm flex items-center justify-center transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <img
                            src={selectedMeal.strMealThumb}
                            alt={selectedMeal.strMeal}
                            className="w-full h-64 object-cover rounded-2xl"
                        />

                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                                Ingredientes
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-300">
                                {getIngredientsList(selectedMeal).map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center gap-2 bg-stone-950/60 border border-stone-800/60 px-3 py-1.5 rounded-lg"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                                Preparación
                            </h3>
                            <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-line">
                                {selectedMeal.strInstructions}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerta Modal de Confirmación para quitar de Favoritos */}
            {mealToRemove && (
                <div
                    onClick={() => setMealToRemove(null)}
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5"
                    >
                        <div className="flex items-center gap-3.5">
                            <img
                                src={mealToRemove.strMealThumb}
                                alt={mealToRemove.strMeal}
                                className="w-14 h-14 rounded-xl object-cover border border-stone-800 shrink-0"
                            />
                            <div>
                                <h3 className="text-base font-semibold text-stone-100">
                                    ¿Quitar de favoritos?
                                </h3>
                                <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                                    Se eliminará{" "}
                                    <span className="text-stone-200 font-medium">
                                        {mealToRemove.strMeal}
                                    </span>{" "}
                                    de tu lista guardada.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setMealToRemove(null)}
                                className="px-4 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmRemoveFavorite}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            >
                                Sí, quitar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast de confirmación flotante */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-stone-900 border border-stone-700/90 text-stone-100 px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium"
                >
                    <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 ${toast.type === "added"
                                ? "bg-emerald-500 text-stone-950"
                                : "bg-stone-700 text-stone-200"
                            }`}
                    >
                        {toast.type === "added" ? "✓" : "−"}
                    </span>
                    <span>{toast.message}</span>
                </div>
            )}
        </main>
    );
}