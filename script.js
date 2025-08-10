const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
const CATEGORIES_API = `${API_BASE}/categories.php`;
const SEARCH_API = `${API_BASE}/search.php?s=`;
const FILTER_BY_CATEGORY_API = `${API_BASE}/filter.php?c=`;
const MEAL_DETAILS_API = `${API_BASE}/lookup.php?i=`;

// Data
let categories = [];
let recipes = [];
let allMeals = [];

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const categoriesSection = document.getElementById('categoriesSection');
const recipesGrid = document.getElementById('recipesGrid');
const categoriesGrid = document.getElementById('categoriesGrid');
const menuCategories = document.getElementById('menuCategories');
const resultsTitle = document.getElementById('resultsTitle');
const categoryDescription = document.getElementById('categoryDescription');
const categoryTitle = document.getElementById('categoryTitle');
const categoryDescriptionText = document.getElementById('categoryDescriptionText');
const heroSection = document.getElementById('heroSection');
const breadcrumbNav = document.getElementById('breadcrumbNav');
const breadcrumbText = document.getElementById('breadcrumbText');
const mealDetailsSection = document.getElementById('mealDetailsSection');

// State
let isMenuOpen = false;
let currentSearchResults = [];
let selectedCategory = '';
let currentCategoryData = null;
let currentView = 'home';

// API Functions
async function fetchCategories() {
    try {
        const response = await fetch(CATEGORIES_API);
        const data = await response.json();
        categories = data.categories.map(cat => ({
            id: cat.strCategory.toLowerCase(),
            name: cat.strCategory,
            image: cat.strCategoryThumb,
            description: cat.strCategoryDescription
        }));
        renderCategories();
        renderMenuCategories();
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function searchMeals(query) {
    try {
        const response = await fetch(SEARCH_API + encodeURIComponent(query));
        const data = await response.json();
        if (data.meals) {
            return data.meals.map(meal => ({
                id: meal.idMeal,
                title: meal.strMeal,
                category: meal.strCategory.toLowerCase(),
                image: meal.strMealThumb,
                area: meal.strArea,
                instructions: meal.strInstructions
            }));
        }
        return [];
    } catch (error) {
        console.error('Error searching meals:', error);
        return [];
    }
}

async function fetchMealsByCategory(category) {
    try {
        const response = await fetch(FILTER_BY_CATEGORY_API + encodeURIComponent(category));
        const data = await response.json();
        if (data.meals) {
            return data.meals.map(meal => ({
                id: meal.idMeal,
                title: meal.strMeal,
                category: category.toLowerCase(),
                image: meal.strMealThumb
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching meals by category:', error);
        return [];
    }
}

async function fetchMealDetails(mealId) {
    try {
        const response = await fetch(MEAL_DETAILS_API + mealId);
        const data = await response.json();
        return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error('Error fetching meal details:', error);
        return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    fetchCategories();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    menuToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
    searchInput.addEventListener('input', handleSearch);
    searchButton.addEventListener('click', () => handleSearch({ target: { value: searchInput.value } }));
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
}

// Navigation Functions
function goHome() {
    searchInput.value = '';
    currentView = 'home';
    updateViewDisplay();
    currentSearchResults = [];
    selectedCategory = '';
    currentCategoryData = null;
}

function updateViewDisplay() {
    // Hide all sections first
    heroSection.style.display = 'none';
    searchResults.style.display = 'none';
    categoriesSection.style.display = 'none';
    categoryDescription.style.display = 'none';
    mealDetailsSection.style.display = 'none';
    breadcrumbNav.style.display = 'none';

    switch (currentView) {
        case 'home':
            heroSection.style.display = 'flex';
            categoriesSection.style.display = 'block';
            break;
        case 'search':
            // Show search results
            heroSection.style.display = 'flex'; // keep top hero visible
            searchResults.style.display = 'block';
            categoriesSection.style.display = 'block'; // also keep categories
            breadcrumbNav.style.display = 'flex';
            breadcrumbText.textContent = 'SEARCH RESULTS';
            break;
        case 'category':
            searchResults.style.display = 'block';
            categoryDescription.style.display = 'block';
            categoriesSection.style.display = 'block'; // keep categories after category results
            breadcrumbNav.style.display = 'flex';
            breadcrumbText.textContent = selectedCategory.toUpperCase();
            break;
        case 'details':
            mealDetailsSection.style.display = 'block';
            breadcrumbNav.style.display = 'flex';
            categoriesSection.style.display = 'block';
            break;
    }
}

// Menu Functions
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    updateMenuState();
}

function closeMenu() {
    isMenuOpen = false;
    updateMenuState();
}

function updateMenuState() {
    if (isMenuOpen) {
        sideMenu.classList.add('open');
        overlay.classList.add('active');
        menuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Search Functions
async function handleSearch(e) {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm) {
        resultsTitle.textContent = 'SEARCHING...';
        currentView = 'search';
        updateViewDisplay();
        
        const searchedMeals = await searchMeals(searchTerm);
        currentSearchResults = searchedMeals;
        selectedCategory = '';
        currentCategoryData = null;
        resultsTitle.textContent = 'SEARCH RESULTS';
        renderRecipes();
    } else if (currentView === 'search') {
        goHome();
    }
}

async function handleCategorySelect(categoryId) {
    selectedCategory = categoryId;
    currentCategoryData = categories.find(cat => cat.id === categoryId);
    searchInput.value = '';
    resultsTitle.textContent = 'LOADING...';
    currentView = 'category';
    updateViewDisplay();
    
    if (currentCategoryData) {
        categoryTitle.textContent = currentCategoryData.name;
        categoryDescriptionText.textContent = currentCategoryData.description;
    }
    
    const categoryMeals = await fetchMealsByCategory(categoryId);
    currentSearchResults = categoryMeals;
    resultsTitle.textContent = `${categoryId.toUpperCase()} MEALS`;
    renderRecipes();
    closeMenu();
}

// Meal Details Functions
async function showMealDetails(mealId) {
    const meal = await fetchMealDetails(mealId);
    if (meal) {
        displayMealDetails(meal);
        currentView = 'details';
        breadcrumbText.textContent = meal.strMeal.toUpperCase();
        updateViewDisplay();
        
        mealDetailsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function displayMealDetails(meal) {
    // Set basic info
    document.getElementById('mealDetailTitle').textContent = meal.strMeal;
    document.getElementById('mealDetailImage').src = meal.strMealThumb;
    document.getElementById('mealCategory').textContent = meal.strCategory.toUpperCase();
    
    // Set source
    if (meal.strSource) {
        document.getElementById('mealSource').href = meal.strSource;
        document.getElementById('mealSource').textContent = meal.strSource;
    } else {
        document.getElementById('mealSource').textContent = 'N/A';
        document.getElementById('mealSource').removeAttribute('href');
    }
    
    // Set tags
    document.getElementById('mealTags').textContent = meal.strTags || 'N/A';
    
    // Set ingredients
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = '';
    let gridIngredientCounter = 1;
    
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        if (ingredient && ingredient.trim()) {
            const ingredientItem = document.createElement('div');
            ingredientItem.className = 'ingredient-item';
            ingredientItem.innerHTML = `
                <span class="grid-ingredient-number">${gridIngredientCounter}</span>
                <span class="grid-ingredient-text">${ingredient}</span>
            `;
            ingredientsList.appendChild(ingredientItem);
            gridIngredientCounter++;
        }
    }
    
    // Set measures
    const measuresList = document.getElementById('measuresList');
    measuresList.innerHTML = '';
    
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim() && measure && measure.trim()) {
            const measureItem = document.createElement('div');
            measureItem.className = 'measure-item';
            measureItem.innerHTML = `
                <i class="fas fa-utensils measure-icon"></i>
                <span><strong>${measure}</strong> ${ingredient}</span>
            `;
            measuresList.appendChild(measureItem);
        }
    }
    
    // Set instructions
    const instructionsList = document.getElementById('instructionsList');
    instructionsList.innerHTML = '';
    
    if (meal.strInstructions) {
        const instructions = meal.strInstructions.split(/[\.\n]/).filter(instruction => instruction.trim().length > 10);
        instructions.forEach((instruction, index) => {
            if (instruction.trim()) {
                const instructionStep = document.createElement('div');
                instructionStep.className = 'instruction-step';
                instructionStep.innerHTML = `
                    <div class="step-number">${index + 1}</div>
                    <div class="step-text">${instruction.trim()}</div>
                `;
                instructionsList.appendChild(instructionStep);
            }
        });
    }
}

// Render Functions
function renderCategories() {
    categoriesGrid.innerHTML = '';
    categories.forEach(category => {
        const categoryCard = createCategoryCard(category);
        categoriesGrid.appendChild(categoryCard);
    });
}

function renderMenuCategories() {
    menuCategories.innerHTML = '';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase();
        button.addEventListener('click', () => handleCategorySelect(category.id));
        menuCategories.appendChild(button);
    });
}

function renderRecipes() {
    recipesGrid.innerHTML = '';
    currentSearchResults.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipesGrid.appendChild(recipeCard);
    });
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.addEventListener('click', () => handleCategorySelect(category.id));
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${category.image}" alt="${category.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA3NSA3MCA3NSA3MEM3NSA3MCA3NSA3NSA3NSA3NUw3NSAxMjVDNzUgMTI1IDc1IDEzMCA3NSAxMzBDNzUgMTMwIDEwOC4yODQgMTMwIDEwMCAxMzBDOTEuNzE1NyAxMzAgMTI1IDEzMCAxMjUgMTMwQzEyNSAxMzAgMTI1IDEyNSAxMjUgMTI1TDEyNSA3NUMxMjUgNzUgMTI1IDcwIDEyNSA3MEMxMjUgNzAgOTEuNzE1NyA3MCAxMDAgNzBaIiBmaWxsPSIjOUIxMDBGIi8+Cjwvc3ZnPgo='">
            <span class="category-name">${category.name.toUpperCase()}</span>
        </div>
    `;
    
    return card;
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.addEventListener('click', () => showMealDetails(recipe.id));
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA3NSA3MCA3NSA3MEM3NSA3MCA3NSA3NSA3NSA3NUw3NSAxMjVDNzUgMTI1IDc1IDEzMCA3NSAxMzBDNzUgMTMwIDEwOC4yODQgMTMwIDEwMCAxMzBDOTEuNzE1NyAxMzAgMTI1IDEzMCAxMjUgMTMwQzEyNSAxMzAgMTI1IDEyNSAxMjUgMTI1TDEyNSA3NUMxMjUgNzUgMTI1IDcwIDEyNSA3MEMxMjUgNzAgOTEuNzE1NyA3MCAxMDAgNzBaIiBmaWxsPSIjOUIxMDBGIi8+Cjwvc3ZnPgo='">
            <div class="category-badge">${recipe.category.toUpperCase()}</div>
        </div>
        <div class="card-content">
            <h4 class="card-title">${recipe.title}</h4>
            ${recipe.area ? `<p class="card-time">${recipe.area}</p>` : ''}
        </div>
    `;
    
    return card;
}
