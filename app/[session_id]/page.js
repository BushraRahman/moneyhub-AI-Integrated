'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Box, Typography, Pagination } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import styles from './page.module.css';  // Import your CSS module
import Image from 'next/image'


export default function QuizPage({ params }) {
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizType, setQuizType] = useState('pre');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');  // State to store student ID
  const [currentQuestion, setCurrentQuestion] = useState(0);  // Current question index (0 for name)
  const [submitted, setSubmitted] = useState(false);  // Track if the post-quiz is submitted
  const [topicName, setTopicName] = useState('');
  const [iconUrl, setIconUrl] = useState('');


  useEffect(() => {
    const fetchQuiz = async () => {
      const response = await axios.get(`/api/quiz/${params.session_id}?quizType=${quizType}`);
      setQuiz(response.data.quiz);
      setTopicName(response.data.topic_info.name)
      setIconUrl(response.data.topic_info.icon)
    };
    fetchQuiz();
  }, [params.session_id, quizType]);

  const handleAnswerChange = (question_id, selected_option_id) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [question_id]: selected_option_id,
    }));
  
    // Automatically move to the next question
    if (currentQuestion < quiz.length) {
      setCurrentQuestion((prevQuestion) => prevQuestion + 1);
    }
  };

  const submitQuiz = async () => {
    if (!studentName && quizType === 'pre') {
      alert('Please enter your name');
      return;
    }
  
    const payload = {
      studentName,
      answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({
        question_id,
        selected_option_id,
      })),
      quizType,
      student_id: studentId,  // Include the student ID for post-quiz
    };
  
    console.log("Submitting quiz with payload:", payload);
  
    try {
      const response = await axios.post(`/api/quiz/${params.session_id}`, payload);
      console.log("Response from server:", response.data);
  
      if (quizType === 'pre') {
        setStudentId(response.data.student_id);  // Store the student ID
        setQuizType('post');  // Move to post-quiz after submission
        setCurrentQuestion(0);  // Reset to the first step for post-quiz
      } else {
        setSubmitted(true);  // Mark the post-quiz as submitted
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };
  

  const handlePageChange = (value) => {
    setCurrentQuestion(value - 1);  // Update the current question index
  };

  if (quiz.length === 0 && quizType === 'pre' && !submitted) return <Typography>Loading...</Typography>;

  // After submission, display a check mark
  if (submitted) {
    return (
      <div className={styles.centeredPage}>
        <CheckCircleOutlineIcon style={{ fontSize: '100px', color: 'lightblue' }} />
        <Typography variant="h4" className={styles.centeredText}>
          Quiz Submitted!
        </Typography>
      </div>
    );
  }

  const isNameStep = currentQuestion === 0;
  const isLastStep = currentQuestion === quiz.length;
  const isAnswerSelected = currentQuestion === 0 ? studentName.trim() !== '' : answers[quiz[currentQuestion - 1]?.question_id];

  return (
    <div className={styles.centeredPage}>
            <Image src={'/moneyhub_logo.png'} width={100} height={0} style={{zIndex: '1', height: 'auto', position: 'absolute', top: '30px', left: '20px'}}/>

      <Image
    src={iconUrl}
    width={50}
    height={0} // Set height to 0 for now
    style={{ height: 'auto' }} 
    alt={{topicName}}
      ></Image>
      <h1 className={styles.topicHeader}>{topicName}</h1>
      <p className={styles.title}>
        {quizType === 'pre' ? 'Pre-Quiz' : 'Post-Quiz'}
      </p>

      {/* Name input for pre-quiz as the first step */}
      {isNameStep && quizType === 'pre' && (
        <Box mb={3} className={styles.centeredBox}>
          <label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name"
              className={styles.input}  // Styled input
            />
          </label>
        </Box>
      )}

      {/* Display student's name in post-quiz */}
      {isNameStep && quizType === 'post' && (
        <Typography variant="h6" mb={3} className={styles.centeredText}>
          {studentName}
        </Typography>
      )}

      {/* Quiz question (steps 2-5) */}
      {!isNameStep && (
        <Box mb={3} className={styles.centeredBox}>
          <Typography className={styles.topicHeader} variant="h5" gutterBottom>
            {quiz[currentQuestion - 1]?.text}
          </Typography>

          <div className={styles.buttonGrid}>
            {quiz[currentQuestion - 1]?.options.map((option) => (
              <Button
                key={option.option_id}
                variant="contained"
                onClick={() => handleAnswerChange(quiz[currentQuestion - 1]?.question_id, option.option_id)}
                className={`${styles.quizButton} ${
                  answers[quiz[currentQuestion - 1]?.question_id] === option.option_id ? styles.selectedButton : ''
                }`}
                style={{ 
                    backgroundColor: answers[quiz[currentQuestion - 1]?.question_id] === option.option_id ? '#eff5ff' : 'white',
                    color: answers[quiz[currentQuestion - 1]?.question_id] === option.option_id ? '#0080BA' : 'black',
                    border: answers[quiz[currentQuestion - 1]?.question_id] === option.option_id ? '1px solid #0080BA' : '1px solid lightgray',
                    borderRadius: '8px',
                    textAlign: 'center',
                    padding: '12px',
                    fontSize: '16px',
                    width: '100%',
                    textTransform: 'none'
                }}  
                disableElevation={true}
              >
                {option.text}
              </Button>
            ))}
          </div>
        </Box>
      )}

      {/* Pagination to navigate between steps (including name input) */}
      <Pagination
        count={quiz.length + 1}  // 1 additional step for name input
        page={currentQuestion + 1}
        onChange={(event, value) => handlePageChange(value)}
        color="primary"
        style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}
        disabled={!isAnswerSelected}  // Disable pagination until name/answer is provided
      />

      {/* Submit Button on the last step */}
      {isLastStep && (
        <Button
          onClick={submitQuiz}
          variant="contained"
          className={styles.submitButton}
          disabled={!isAnswerSelected}  // Disable submit until answer is provided
        >
          Submit {quizType === 'pre' ? 'Pre-Quiz' : 'Post-Quiz'}
        </Button>
      )}
    </div>
  );
}
