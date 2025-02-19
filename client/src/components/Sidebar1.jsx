import React, { useState, useContext } from 'react';
import { Button, TextField, Grid, Typography, Container, Paper } from '@material-ui/core';
import { PhoneDisabled } from '@material-ui/icons';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { makeStyles } from '@material-ui/core/styles';

import { SocketContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  gridContainer: {
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  container: {
    width: '600px',
    margin: '35px 0',
    padding: 0,
    [theme.breakpoints.down('xs')]: {
      width: '80%',
    },
  },
  margin: {
    marginTop: 20,
  },
  padding: {
    padding: 20,
  },
  paper: {
    padding: '10px 20px',
    border: '2px solid black',
  },
}));

const Sidebar1 = ({ children }) => {
  const { callAccepted, callEnded, leaveCall, callUser } = useContext(SocketContext);
  const [idToCall, setIdToCall] = useState('');
  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <Paper elevation={10} className={classes.paper}>
        <form className={classes.root} noValidate autoComplete="off">
          <Grid container className={classes.gridContainer}>
            <Typography gutterBottom variant="h6">Input the streaming code to start streaming</Typography>
            <TextField label="ID to call" value={idToCall} onChange={(e) => setIdToCall(e.target.value)} fullWidth />
            {callAccepted && !callEnded ? (
              <Button variant="contained" color="secondary" startIcon={<PhoneDisabled fontSize="large" />} fullWidth onClick={leaveCall} className={classes.margin}>
                Hang Up
              </Button>
            ) : (
              <Button variant="contained" color="primary" startIcon={<PlayCircleFilledIcon fontSize="large" />} fullWidth onClick={() => callUser(idToCall)} className={classes.margin}>
                Call
              </Button>
            )}
          </Grid>
        </form>
        {children}
      </Paper>
    </Container>
  );
};

export default Sidebar1;
