const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export async function searchMeals(query = "") {
    const res = await fetch(
        `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
        throw new Error("Error al conectar con TheMealDB.");
    }

    const data = await res.json();
    return data.meals || [];
}