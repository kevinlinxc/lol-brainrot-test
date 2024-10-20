import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import SocialMediaCard from '../components/SocialMediaCard';

const resolutions = ['3x3', '4x4', '5x5', '8x8', '12x12', 'full'];
const baseScore = 10;

function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z]/g, '');
}

function getCharacterImage(character, resolution) {
  const characterFileName =
    resolution === resolutions.length - 1 ? current.name : btoa(character.name);
  return `/pixel-brush/${resolutions[resolution]}-portraits/${characterFileName}.webp`;
}

const WrongAlert = ({ message }) => (
  <div
    className="alert"
    style={{
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      color: '#721c24',
    }}
  >
    <strong>Result:</strong> {message}
  </div>
);

const CorrectAlert = ({ message }) => (
  <div
    className="alert"
    style={{
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      color: '#155724',
    }}
  >
    <strong>Result:</strong> {message}
  </div>
);

const ResolutionChart = ({ correctGuessData, orientation }) =>
  orientation === 'horizontal' ? (
    <ResponsiveContainer width="100%" height={300}>
      <text x={500 / 2} y={20} fill="black" textAnchor="middle" dominantBaseline="central">
        <tspan fontSize="14">Guess Statistics</tspan>
      </text>
      <BarChart
        data={correctGuessData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="correctGuesses" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <ResponsiveContainer width="50%" height={300}>
      <BarChart
        data={correctGuessData}
        layout="vertical"
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" />
        <Tooltip />
        <Bar dataKey="correctGuesses" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );

const ResolutionCarousel = ({ currentResolution }) => {
  return (
    <div
      style={{
        width: '30%',
        background: '#f0f0f0',
        padding: '10px',
        margin: '0px 0px 10px 0px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {resolutions.map((res, index) => (
          <div
            key={res}
            style={{
              width: '30px',
              textAlign: 'center',
              fontSize: '12px',
              color:
                index < currentResolution
                  ? '#FF6347'
                  : index === currentResolution
                    ? '#32CD32'
                    : '#333333',
              fontWeight: index === currentResolution ? 'bold' : 'normal',
            }}
          >
            {res}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CharacterGuessingGame({ characters, totalCharacters, props }) {
  const [remainingCharacters, setRemainingCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [currentResolution, setCurrentResolution] = useState(0);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const totalTime = 10 * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [timerRunning, setTimerRunning] = useState(true);
  const [correctGuessData, setCorrectGuessData] = useState(
    resolutions.map((res) => ({ name: res, correctGuesses: 0 })),
  );
  const [bestGuesses, setBestGuesses] = useState([]); // tuples of (character, resolution)

  // define some character name mappings for colloquial to actual names
  // don't need to do this for characters with spsaces or symbols, those are handled by normalizeString
  const nameMappings = {
    nunu: 'nunuwillump',
    renata: 'renataglasc',
    aurelion: 'aurelionsol',
    mundo: 'drmundo',
    jarvan: 'jarvaniv',
    j4: 'jarvaniv',
    lee: 'leesin',
    yi: 'masteryi',
    mf: 'missfortune',
    tahm: 'tahmkench',
    tk: 'tahmkench',
    tf: 'twistedfate',
    xin: 'xinzhao',
  };

  useEffect(() => {
    if (characters.length > 0 && remainingCharacters.length === 0) {
      setRemainingCharacters(characters);
      startNewRound(characters);
    }
  }, [characters, remainingCharacters]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft > 0) {
          if (timerRunning) {
            return prevTimeLeft - 1;
          } else {
            return prevTimeLeft;
          }
        } else {
          setGameOver(true);
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`; // Add leading zero to seconds if less than 10
  };

  const startNewRound = (chars) => {
    const randomIndex = Math.floor(Math.random() * chars.length);
    setCurrentCharacter(chars[randomIndex]);
    setCurrentResolution(0);
    setGuess('');
    setMessage('');
  };

  const handleGuess = (e) => {
    e.preventDefault();

    if (
      normalizeString(guess) === normalizeString(currentCharacter.name) ||
      nameMappings[normalizeString(guess)] === normalizeString(currentCharacter.name)
    ) {
      const roundScore = calculateScore();
      setScore((prevScore) => prevScore + roundScore);
      setTimerRunning(false);
      setMessage(`Correct! You scored ${roundScore} points.`);

      // Update correct guess count for the current resolution
      setCorrectGuessData((prevData) =>
        prevData.map((item, index) =>
          index === currentResolution ? { ...item, correctGuesses: item.correctGuesses + 1 } : item,
        ),
      );

      const updatedCharacters = remainingCharacters.filter(
        (char) => char.name !== currentCharacter.name,
      );
      setRemainingCharacters(updatedCharacters);
      if (updatedCharacters.length > 0) {
        setTimeout(() => {
          setGuess('');
          setCurrentCharacter(null);
          startNewRound(updatedCharacters);
          setTimerRunning(true);
        }, 1000);
      } else {
        setGameOver(true);
      }
    } else {
      if (currentResolution < resolutions.length - 1) {
        setCurrentResolution((prevRes) => prevRes + 1);
        setMessage('Wrong! You guessed: ' + guess);
        setGuess('');
      } else {
        setMessage(`Incorrect. The correct answer was ${currentCharacter.name}.`);
        setTimerRunning(false);
        setTimeout(() => {
          setGuess('');
          setCurrentCharacter(null);
          startNewRound(remainingCharacters);
          setTimerRunning(true);
        }, 1500);
      }
    }
  };

  const calculateScore = () => {
    const resolutionPenalty = currentResolution * 2;
    return Math.max(baseScore - resolutionPenalty, 1);
  };

  if (!currentCharacter) return <div>Loading...</div>;

  return (
    <div
      style={{
        padding: '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontStyle: 'normal',
        }}
      >
        LoL Champion Recognition Test
      </h1>
      {!gameOver ? (
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
          <div
            className="itemcenter"
            style={{
              display: 'flex',
              width: '50%',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                fontFamily: 'Inter',
                fontWeight: 500,
                fontStyle: 'normal',
              }}
            >
              Time Remaining: {formatTime(timeLeft)}
            </h2>
            <img
              src={getCharacterImage(currentCharacter, currentResolution)}
              alt="Guess the character"
              style={{
                width: '35%',
                height: 'auto',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
            <ResolutionCarousel currentResolution={currentResolution} />
            <form
              onSubmit={handleGuess}
              style={{
                marginBottom: '1rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter champion name (case & symbols ignored)"
                style={{
                  width: '160%',
                  padding: '1rem',
                  border: '1px solid #ccc',
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontStyle: 'normal',
                }}
                list="character-names"
              />
              <datalist id="character-names">
                {remainingCharacters.map((char) => (
                  <option key={char.name} value={char.name.replaceAll('_', ' ')} />
                ))}
              </datalist>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-purple-500 text-white"
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  padding: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                  fontFamily: 'Inter',
                  padding: '1rem',
                }}
              >
                Submit (Enter)
              </button>
            </form>
            {message &&
              (message.includes('Correct') ? (
                <CorrectAlert message={message} />
              ) : (
                <WrongAlert message={message} />
              ))}
            <p>
              Current Score: {score}/{(totalCharacters - remainingCharacters.length) * baseScore}
            </p>
            <p>Remaining characters: {remainingCharacters.length}</p>
          </div>
          <div className="itemright" style={{ width: '45%' }}>
            <h3>Correct Guesses by Resolution</h3>
            <ResolutionChart correctGuessData={correctGuessData} orientation="vertical" />
          </div>
        </div>
      ) : (
        // game over
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Final Score:
          </h1>
          <h2 className="text-5xl font-black">
            {score}/{totalCharacters * baseScore}
          </h2>
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="w-full p-4" style={{ margin: '0 auto' }}>
              <ResolutionChart correctGuessData={correctGuessData} orientation="horizontal" />
            </div>
            <SocialMediaCard />
          </div>
        </div>
      )}
    </div>
  );
}
