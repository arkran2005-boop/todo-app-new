import React, { useState, useEffect } from 'react';
import './App.css';
import ToDoForm from "./AddTask";
import ToDo from "./Task";
import axios from 'axios';

const TASKS_STORAGE_KEY = 'tasks-list-project-web';

function App() {
  const [rates, setRates] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [todos, setTodos] = useState(() => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

    if (storedTasks) {
      return JSON.parse(storedTasks);
    }

    return [];
  });

  // Функция получения геолокации через Promise
  function getPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  useEffect(() => {
    async function fetchAllData() {
      try {
        // ===== КУРСЫ ВАЛЮТ =====
        const currencyResponse = await axios.get(
          'https://www.cbr-xml-daily.ru/daily_json.js'
        );

        const USDrate = currencyResponse.data.Valute.USD.Value
          .toFixed(4)
          .replace('.', ',');

        const EURrate = currencyResponse.data.Valute.EUR.Value
          .toFixed(4)
          .replace('.', ',');

        setRates({ USDrate, EURrate });

        // ===== ПОГОДА =====
        try {
          // Получаем координаты пользователя
          const position = await getPosition();

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Open-Meteo API
          const weatherResponse = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          );

          setWeatherData(weatherResponse.data.current_weather);

        } catch (geoError) {
          console.error('Ошибка геолокации:', geoError);

          // fallback — Москва
          const fallbackWeather = await axios.get(
            'https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.61&current_weather=true'
          );

          setWeatherData(fallbackWeather.data.current_weather);
        }

      } catch (err) {
        console.error(err);
        setError('Ошибка загрузки данных.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTask = (userInput) => {
    if (userInput.trim()) {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        task: userInput,
        complete: false
      };

      setTodos([...todos, newItem]);
    }
  };

  const removeTask = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleToggle = (id) => {
    setTodos(
      todos.map((task) =>
        task.id === id
          ? { ...task, complete: !task.complete }
          : task
      )
    );
  };

  return (
    <div className="App">

      {loading && <p>Загрузка...</p>}

      {!loading && error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      {!loading && !error && (
        <div className="info">

          <div className="money">
            <div>Доллар США $ — {rates.USDrate} руб.</div>
            <div>Евро € — {rates.EURrate} руб.</div>
          </div>

          {weatherData && (
            <div className="weather-info">
              <div>
                Погода сегодня: <br />

                🌡️ {weatherData.temperature}°C&nbsp;

                💨 {weatherData.windspeed} м/с
              </div>
            </div>
          )}

        </div>
      )}

      <header>
        <h1 className="list-header">
          Список задач: {todos.length}
        </h1>
      </header>

      <ToDoForm addTask={addTask} />

      {todos.map((todo) => (
        <ToDo
          todo={todo}
          key={todo.id}
          toggleTask={handleToggle}
          removeTask={removeTask}
        />
      ))}

    </div>
  );
}

export default App;