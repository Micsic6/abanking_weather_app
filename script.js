document.addEventListener('DOMContentLoaded', () => {
    const WEATHER_CODES = {
        0: '☀️ Ясно',
        1: '🌤️ Переменная облачность',
        2: '⛅ Облачно с прояснениями',
        3: '☁️ Пасмурно',
        45: '🌫️ Туман',
        48: '🌫️ Густой туман',
        51: '🌧️ Легкая морось',
        53: '🌧️ Умеренная морось',
        55: '🌧️ Сильная морось',
        61: '🌧️ Небольшой дождь',
        63: '🌧️ Умеренный дождь',
        65: '🌧️ Сильный дождь',
        71: '🌨️ Легкий снег',
        73: '🌨️ Умеренный снег',
        75: '🌨️ Сильный снег',
        77: '🌨️ Снежная крупа',
        80: '🌧️ Небольшие ливни',
        81: '🌧️ Умеренные ливни',
        82: '🌧️ Сильные ливни',
        95: '⚡ Гроза',
        96: '⚡ Гроза с градом',
        99: '⚡ Гроза с сильным градом'
    };
    const getWeatherBtn = document.getElementById('get-weather');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const weatherResult = document.getElementById('weather-result');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    latInput.value = '55.75';
    lonInput.value = '37.62';
    latInput.focus();

    getWeatherBtn.addEventListener('click', async () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);


        if (isNaN(lat) || isNaN(lon)) {
            showError('Введите числовые значения координат');
            return;
        }
        
        if (lat < -90 || lat > 90) {
            showError('Широта должна быть от -90 до 90');
            return;
        }
        
        if (lon < -180 || lon > 180) {
            showError('Долгота должна быть от -180 до 180');
            return;
        }

        weatherResult.style.display = 'none';
        errorEl.style.display = 'none';
        loadingEl.style.display = 'block'; 
        getWeatherBtn.disabled = true;

        try {

            const url = `https://api.open-meteo.com/v1/forecast?` + new URLSearchParams({
                latitude: lat,
                longitude: lon,
                current: 'temperature_2m,weather_code,wind_speed_10m',
                timezone: 'auto',
                forecast_days: 1
            });

            const response = await fetch(url);
            
            if (!response.ok) {
                let errorText = '';
                try {
                    const errorData = await response.json();
                    errorText = errorData.reason || errorData.error || response.statusText;
                } catch (e) {
                    errorText = await response.text() || response.statusText;
                }
                throw new Error(`Ошибка API: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.reason || 'Неизвестная ошибка API');
            }

            if (!data.current || typeof data.current.temperature_2m === 'undefined') {
                throw new Error('Нет данных о текущей погоде в ответе');
            }

            const currentTemp = data.current.temperature_2m;
            const weatherCode = data.current.weather_code;
            const windSpeed = data.current.wind_speed_10m;
            const utcOffset = data.utc_offset_seconds || 0;
            
            const currentTime = new Date(Date.now() + utcOffset * 1000);
            const formattedTime = currentTime.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: data.timezone || 'UTC'
            });

            document.getElementById('coords-display').textContent = 
                `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            
            document.getElementById('temperature').textContent = 
                `${currentTemp.toFixed(1)}°C`;
            
            document.getElementById('weather-desc').textContent = 
                WEATHER_CODES[weatherCode] || `Погода (код ${weatherCode})`;
            
            document.getElementById('wind-speed').textContent = 
                windSpeed.toFixed(1);
            
            document.getElementById('local-time').textContent = 
                `Местное время: ${formattedTime}`;

            weatherResult.style.display = 'block'; 
            
        } catch (error) {
            console.error('Ошибка при получении погоды:', error);
            showError(`Ошибка: ${error.message}`);
        } finally {
            loadingEl.style.display = 'none';
            getWeatherBtn.disabled = false;
        }
    });

    function showError(message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        setTimeout(() => {
            if (errorEl.textContent === message) {
                errorEl.style.display = 'none';
            }
        }, 5000);
    }

    latInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') lonInput.focus();
    });
    
    lonInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') getWeatherBtn.click();
    });
});