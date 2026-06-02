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

  // Состояния для виджета ВКонтакте
  const [vkGroupId, setVkGroupId] = useState('vk');
  const [vkData, setVkData] = useState(null);
  const [vkLoading, setVkLoading] = useState(false);
  const [vkError, setVkError] = useState('');

  const [todos, setTodos] = useState(() => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      return JSON.parse(storedTasks);
    }
    return [];
  });

  function getPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  useEffect(() => {
    async function fetchAllData() {
      try {
        const currencyResponse = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        if (currencyResponse) {
          const USDrate = currencyResponse.data.Valute.USD.Value.toFixed(4).replace('.', ',');
          const EURrate = currencyResponse.data.Valute.EUR.Value.toFixed(4).replace('.', ',');
          setRates({ USDrate, EURrate });
        }

        try {
          const position = await getPosition();
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const weatherResponse = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          );
          setWeatherData(weatherResponse.data.current_weather);
        } catch (geoError) {
          const fallbackWeather = await axios.get(
            'https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.61&current_weather=true'
          );
          setWeatherData(fallbackWeather.data.current_weather);
        }
      } catch (err) {
        setError('Ошибка загрузки базовых данных.');
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const fetchVkStats = (e) => {
    e.preventDefault();
    if (!vkGroupId.trim()) return;

    setVkLoading(true);
    setVkError('');
    
    const SERVICE_TOKEN = 'a863e4f9a863e4f9a863e4f923ab228a0eaa863a863e4f9c27d4ec7f1d16f063a6e87f7'; 
    const isMockMode = false;

    let formattedGroupId = vkGroupId.trim();
    if (formattedGroupId.includes('vk.com/')) {
      formattedGroupId = formattedGroupId.split('vk.com/')[1].replace('/', '');
    }

    if (isMockMode) {
      setTimeout(() => {
        setVkData({
          name: `Тестовое сообщество (${formattedGroupId})`,
          members_count: Math.floor(Math.random() * 500000) + 10000,
          photo_50: "https://vk.com/images/community_50.png"
        });
        setVkLoading(false);
      }, 800);
      return;
    }

    const script = document.createElement('script');
    const callbackName = 'vkCallback_' + Math.round(100000 * Math.random());
    
    const timeoutId = setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName];
        document.body.removeChild(script);
        setVkError('Превышено время ожидания ответа от ВК');
        setVkLoading(false);
      }
    }, 5000);

    window[callbackName] = function(data) {
      clearTimeout(timeoutId);
      delete window[callbackName];
      document.body.removeChild(script);
      setVkLoading(false);
      
      if (data.error) {
        setVkError(data.error.error_msg || 'Ошибка при запросе к ВК');
      } else if (data.response && data.response.length > 0) {
        setVkData(data.response[0]);
      } else {
        setVkError('Сообщество не найдено');
      }
    };

    script.src = `https://api.vk.com/method/groups.getById?group_ids=${formattedGroupId}&fields=members_count&v=5.131&access_token=${SERVICE_TOKEN}&callback=${callbackName}`;
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      setVkError('Ошибка сети или блокировщик рекламы');
      setVkLoading(false);
    };
    
    document.body.appendChild(script);
  };

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
        task.id === id ? { ...task, complete: !task.complete } : task
      )
    );
  };

  return (
    <div className="App">
      {loading && <p>Загрузка...</p>}
      
      {!loading && error && <p style={{ color: '#ffaaaa' }}>{error}</p>}

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

          {/* Виджет статистики ВКонтакте */}
          <div className="vk-info">
            <div style={{ marginBottom: '10px' }}>🔵 Статистика VK</div>
            <form className="vk-form" onSubmit={fetchVkStats}>
              <input 
                type="text" 
                placeholder="ID или короткое имя"
                value={vkGroupId}
                onChange={(e) => setVkGroupId(e.target.value)}
              />
              <button type="submit" disabled={vkLoading}>
                {vkLoading ? '...' : 'Поиск'}
              </button>
            </form>

            {vkError && <p style={{ color: '#ffaaaa', marginTop: '10px', fontSize: '14px' }}>{vkError}</p>}
            
            {vkData && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'left', fontSize: '14px' }}>
                {vkData.photo_50 && <img src={vkData.photo_50} alt="logo" style={{ borderRadius: '50%' }} />}
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{vkData.name}</div>
                  <div>Подписчиков: <strong>{vkData.members_count?.toLocaleString('ru-RU') || 'Скрыто'}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header>
        <h1 className="list-header">Список задач: {todos.length}</h1>
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