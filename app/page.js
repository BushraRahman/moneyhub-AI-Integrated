'use client'
import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import Image from 'next/image';
import styles from './page.module.css'; // Import your CSS module


const steps = ['Select Topic', 'Create Session', 'Results'];

export default function HorizontalLinearStepper() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [topics, setTopics] = React.useState([]);
  const [selectedTopic, setSelectedTopic] = React.useState('4');
  const [sessionData, setSessionData] = React.useState(null);
  const [insights, setInsights] = React.useState([]);
  const [loading, setLoading] = React.useState(false); // Loading state

  React.useEffect(() => {
    const fetchTopics = async () => {
      const response = await axios.get('/api/topics');
      setTopics(response.data);
    };
    fetchTopics();
  }, []);

  const isStepSkipped = (step) => skipped.has(step);

  const handleNext = async () => {
    console.log('Handling Next. Current Step: ', activeStep);

    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    if (activeStep === 0 && !sessionData) {
      try {
        console.log('Creating session for topic: ', selectedTopic);
        setLoading(true); // Set loading to true while session is being created
        const response = await axios.post('/api/session', { topic_id: selectedTopic });
        setSessionData(response.data);
        console.log('Session data successfully set: ', response.data);
      } catch (error) {
        console.error('Error creating session: ', error);
      } finally {
        setLoading(false); // Hide loading once session data is fetched
      }
    }

    if (activeStep === 1 && sessionData) {
      // Display loading GIF while fetching insights
      setLoading(true);
      try {
        console.log('Sending data to complete the quiz', sessionData, selectedTopic);
        const response = await axios.post(`/api/quiz/${sessionData.session_id}/complete`, {
          session: sessionData,
          topic_id: selectedTopic,
        });

        console.log('Insights received: ', response.data.insights);
        setInsights(response.data.insights);
      } catch (error) {
        console.error('Error fetching insights: ', error);
      } finally {
        setLoading(false); // Hide loading after insights are received
      }
    }

    // Proceed to the next step
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedTopic('');
    setSessionData(null);
  };

  const handleTopicClick = (topic_id) => {
    setSelectedTopic(topic_id);
  };

  const getBackgroundColor = (quant) => {
    const percentage = parseFloat(quant); // Convert "30%" to 30
    console.log(quant);

    if (percentage <= 25) {
      return '#FFEEEE'; // Red for 25% or below
    } else if (percentage <= 70) {
      return '#FEFFE9'; // Yellow for 26% to 70%
    } else {
      return '#E3F9EB'; // Green for above 70%
    }
  };

  const getMainColor = (quant) => {
    const percentage = parseFloat(quant); // Convert "30%" to 30
    console.log(quant);

    if (percentage <= 25) {
      return '#831B1B'; // Red for 25% or below
    } else if (percentage <= 70) {
      return '#836D1B'; // Yellow for 26% to 70%
    } else {
      return '#1B8343'; // Green for above 70%
    }
  };

  const getBorder = (quant) => {
    const percentage = parseFloat(quant); // Convert "30%" to 30
    console.log(quant);

    if (percentage <= 25) {
      return '1px solid #831B1B'; // Red for 25% or below
    } else if (percentage <= 70) {
      return '1px solid #836D1B'; // Yellow for 26% to 70%
    } else {
      return '1px solid #1B8343'; // Green for above 70%
    }
  };

  return (
    <div className={styles.main}>
      <Box
        sx={{
          height: '70%',
          width: '85%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Stepper activeStep={activeStep} sx={{ width: '50%' }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }}>All steps completed - you&apos;re finished</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleReset}>Reset</Button>
            </Box>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box>
              {loading && (
                <div>
                  <img style={{width: '100px'}}src="/load.gif" alt="Loading..." />
                </div>
              )}

              {!loading && activeStep === 0 && (
                <div className={styles.mainHolder}>
                  <Grid container spacing={4} className={styles.mainGrid}>
                    {topics.map((topic) => (
                      <Grid key={topic._id} item xs={12} sm={6} md={6} lg={6}>
                        <div
                          className={`${styles.topicCard} ${selectedTopic === topic.topic_id ? styles.selected : ''}`}
                          onClick={() => handleTopicClick(topic.topic_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Image src={topic.icon_url} width={50} height={0} style={{ height: 'auto' }} alt={topic.icon_url}/>
                          <h2 className={styles.topicHeader}>{topic.name}</h2>
                          <p className={styles.subTopics}>{topic.sub_topics.join(' | ')}</p>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              )}

              {!loading && activeStep === 1 && sessionData && (
                <div className={styles.mainHolder}>
                  <div className={styles.sessionContainer}>
                    <h2 className={styles.topicHeader}> Please Join! </h2>
                    <div className={styles.qrWrapper}>
                    <Image src={sessionData.session_qr} width={100} height={0} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: '8px', 'marginBottom': '10px' }} alt="Session QR Code" />
                    </div>
                    <div className={styles.urlHolder}>
                      <SearchIcon className={styles.searchIcon} />
                      <p className={styles.sessionLink}>
                        <a href={sessionData.session_url}>{sessionData.session_url}</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!loading && activeStep === 2 && (
                <div className={styles.mainHolder}>
                  <div className={styles.insightsHolder}>
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className={styles.insight}
                        style={{
                          backgroundColor: getBackgroundColor(insight.quantitative),
                          color: getMainColor(insight.quantitative),
                          border: getBorder(insight.quantitative),
                          borderRadius: '12px',
                          padding: '30px',
                        }}
                      >
                        <h3 className={styles.quant}>{insight.quantitative}%</h3>
                        <p className={styles.qual}>{insight.qualitative}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, borderWidth: '10px', borderColor: 'pink' }}>
              <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleNext} disabled={activeStep === 0 && !selectedTopic}>
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </React.Fragment>
        )}
      </Box>
    </div>
  );
}
