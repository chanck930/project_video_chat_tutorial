import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import VideoPlayer from '../components/VideoPlayer';
import Sidebar1 from '../components/Sidebar1';
import Notifications from '../components/Notifications';

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
});

const Home = () => {
  const classes = useStyles();

  return (
    <div className={classes.wrapper}>
      <VideoPlayer />
      <Sidebar1>
        <Notifications />
      </Sidebar1>
    </div>
  );
};

export default Home;
