const apiKey = "dd7fb77e8f8964a1b93a706972f721a3";

const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const cityInput = document.getElementById('city');
const loadingDiv = document.getElementById('loading');
const weatherIcon = document.getElementById('weather-icon');
const tempDivInfo = document.getElementById('temp-div');
const weatherInfoDiv = document.getElementById('weather-info');
const dailyForecastDiv = document.getElementById('daily-forecast');

let currentForecastData = null;

// Show loading spinner and disable buttons
function setLoading(isLoading) {
    if (isLoading) {
        loadingDiv.style.display = 'block';
        searchBtn.disabled = true;
        clearBtn.disabled = true;
    } else {
        loadingDiv.style.display = 'none';
        searchBtn.disabled = false;
        clearBtn.disabled = false;
    }
}

// Clear weather display and input
function clearWeather() {
    cityInput.value = '';
    weatherIcon.style.display = 'none';
    tempDivInfo.innerHTML = '';
    weatherInfoDiv.innerHTML = '';
    dailyForecastDiv.innerHTML = '';
    currentForecastData = null;
}

// Fetch weather data asynchronously
async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        weatherInfoDiv.innerHTML = '<p>Please enter a city name.</p>';
        return;
    }

    setLoading(true);

    try {
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        if (!currentRes.ok) {
            const errorData = await currentRes.json();
            throw new Error(errorData.message || 'Error fetching current weather data');
        }
        if (!forecastRes.ok) {
            const errorData = await forecastRes.json();
            throw new Error(errorData.message || 'Error fetching forecast data');
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        displayWeather(currentData);
        currentForecastData = forecastData.list;
        displayDailyForecast(forecastData.list);
    } catch (error) {
        weatherInfoDiv.innerHTML = `<p>${error.message}</p>`;
        weatherIcon.style.display = 'none';
        tempDivInfo.innerHTML = '';
        dailyForecastDiv.innerHTML = '';
    } finally {
        setLoading(false);
    }
}

// Display current weather data
function displayWeather(data) {
    weatherInfoDiv.innerHTML = '';
    dailyForecastDiv.innerHTML = '';
    tempDivInfo.innerHTML = '';

    if (data.cod === '404') {
        weatherInfoDiv.innerHTML = `<p>${data.message}</p>`;
        weatherIcon.style.display = 'none';
        return;
    }

    const cityName = data.name;
    const temperature = Math.round(data.main.temp - 273.15);
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    tempDivInfo.innerHTML = `<p>${temperature}°C</p>`;
    weatherInfoDiv.innerHTML = `<p>${cityName}</p><p>${description}</p>`;
    weatherIcon.src = iconUrl;
    weatherIcon.alt = description;
    weatherIcon.style.display = 'block';
}

// Display 7-day forecast
function displayDailyForecast(forecastData) {
    dailyForecastDiv.innerHTML = '';

    const fullForecastData = {};
    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!fullForecastData[day]) fullForecastData[day] = [];
        fullForecastData[day].push(item);
    });

    const dailyForecast = {};
    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (!dailyForecast[day]) {
            dailyForecast[day] = {
                minTemp: Math.round(item.main.temp_min - 273.15),
                maxTemp: Math.round(item.main.temp_max - 273.15),
                icon: item.weather[0].icon,
                description: item.weather[0].main,
                fullData: fullForecastData[day]
            };
        } else {
            dailyForecast[day].minTemp = Math.min(dailyForecast[day].minTemp, Math.round(item.main.temp_min - 273.15));
            dailyForecast[day].maxTemp = Math.max(dailyForecast[day].maxTemp, Math.round(item.main.temp_max - 273.15));
        }
    });

    window.dailyForecastData = dailyForecast;

    Object.entries(dailyForecast).slice(0, 7).forEach(([day, data]) => {
        const iconUrl = `https://openweathermap.org/img/wn/${data.icon}.png`;

        const dailyItemHtml = `
            <div class="daily-item" onclick="showHourlyForecast('${day}')">
                <span>${day}</span>
                <img src="${iconUrl}" alt="${data.description}">
                <span>${data.minTemp}°C / ${data.maxTemp}°C</span>
            </div>
        `;

        dailyForecastDiv.innerHTML += dailyItemHtml;
    });
}

// Show hourly forecast for a selected day
function showHourlyForecast(day) {
    const hourlyData = window.dailyForecastData[day]?.fullData;

    if (!hourlyData || hourlyData.length === 0) {
        dailyForecastDiv.innerHTML = `<p>No hourly data available for ${day}</p>`;
        return;
    }

    dailyForecastDiv.classList.add('hourly-view');

    dailyForecastDiv.innerHTML = `
        <button class="back-button" onclick="restoreDailyForecast()">← Back to 7-day forecast</button>
        <h4>Hourly Forecast for ${day}</h4>
        <div class="hourly-container">
    `;

    hourlyData.forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(item.main.temp - 273.15);
        const feelsLike = Math.round(item.main.feels_like - 273.15);
        const humidity = item.main.humidity;
        const windSpeed = (item.wind.speed * 3.6).toFixed(1);
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;

        const hourlyItemHtml = `
            <div class="hourly-item">
                <span class="hourly-time">${time}</span>
                <img src="${iconUrl}" alt="${item.weather[0].description}">
                <span class="hourly-temp">${temp}°C</span>
                <div class="hourly-details">
                    <span>Feels like: ${feelsLike}°C</span>
                    <span>Humidity: ${humidity}%</span>
                    <span>Wind: ${windSpeed} km/h</span>
                </div>
            </div>
        `;

        dailyForecastDiv.innerHTML += hourlyItemHtml;
    });

    dailyForecastDiv.innerHTML += `</div>`;
}

// Restore 7-day forecast view
function restoreDailyForecast() {
    dailyForecastDiv.classList.remove('hourly-view');
    if (currentForecastData) {
        displayDailyForecast(currentForecastData);
    } else {
        getWeather();
    }
}

/**
 * Get weather by geographic coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function getWeatherByCoords(lat, lon) {
    setLoading(true);
    try {
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        if (!currentRes.ok) {
            const errorData = await currentRes.json();
            throw new Error(errorData.message || 'Error fetching current weather data');
        }
        if (!forecastRes.ok) {
            const errorData = await forecastRes.json();
            throw new Error(errorData.message || 'Error fetching forecast data');
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        displayWeather(currentData);
        currentForecastData = forecastData.list;
        displayDailyForecast(forecastData.list);
    } catch (error) {
        weatherInfoDiv.innerHTML = `<p>${error.message}</p>`;
        weatherIcon.style.display = 'none';
        tempDivInfo.innerHTML = '';
        dailyForecastDiv.innerHTML = '';
    } finally {
        setLoading(false);
    }
}

/**
 * Get user's current location and fetch weather
 */
function getLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoords(latitude, longitude);
        },
        (error) => {
            setLoading(false);
            weatherInfoDiv.innerHTML = `<p>Unable to retrieve your location: ${error.message}</p>`;
        }
    );
}

const citySuggestions = [
    "New York", "London", "Paris", "Tokyo", "Delhi", "Sydney", "Moscow", "Beijing", "Rio de Janeiro", "Cape Town"
];

const suggestionsContainer = document.createElement('div');
suggestionsContainer.id = 'suggestions-container';
suggestionsContainer.style.position = 'absolute';
suggestionsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
suggestionsContainer.style.color = '#000';
suggestionsContainer.style.borderRadius = '5px';
suggestionsContainer.style.width = cityInput.offsetWidth + 'px';
suggestionsContainer.style.maxHeight = '150px';
suggestionsContainer.style.overflowY = 'auto';
suggestionsContainer.style.zIndex = '1000';
suggestionsContainer.style.display = 'none';

cityInput.parentNode.style.position = 'relative';
cityInput.parentNode.appendChild(suggestionsContainer);

cityInput.addEventListener('input', () => {
    const input = cityInput.value.toLowerCase();
    suggestionsContainer.innerHTML = '';
    if (!input) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    const filtered = citySuggestions.filter(city => city.toLowerCase().startsWith(input));
    filtered.forEach(city => {
        const div = document.createElement('div');
        div.textContent = city;
        div.style.padding = '5px';
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            cityInput.value = city;
            suggestionsContainer.style.display = 'none';
        });
        suggestionsContainer.appendChild(div);
    });
    suggestionsContainer.style.display = filtered.length ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
    if (e.target !== cityInput) {
        suggestionsContainer.style.display = 'none';
    }
});

// Event listeners for buttons
searchBtn.addEventListener('click', getWeather);
clearBtn.addEventListener('click', clearWeather);
document.getElementById('location-btn').addEventListener('click', getLocation);
