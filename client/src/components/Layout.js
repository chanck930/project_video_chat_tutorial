import React from 'react';
import { makeStyles } from '@material-ui/core';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { useNavigate, useLocation } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import AppsIcon from '@mui/icons-material/Apps';

const drawerWidth = 240;

const useStyles = makeStyles({
  page: {
    background: '#28343F',
    width: '100%',
    padding: 20,
    height: '80%',
  },
  root: {
    display: 'flex',
  },
  drawer: {
    width: drawerWidth,
  },
  drawerPaper: {
    width: drawerWidth,
    background: '#FfFfFF',
  },
  active: {
    background: '#F8FBFF',
    color: 'black',
  },
  title: {
    padding: '20px',
    color: 'black',
  },
  AppBar: {
    width: 'calc(100% - 240px)',
    background: '#303f9f',
  },
  toolbar: {
    height: '80px',
  },
  list: {
    color: 'black',
  },
});

export default function Layout({ children }) {
  const classes = useStyles();
  const nav = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Watch',
      icon: <AppsIcon style={{ color: '#303f9f' }} />,
      path: '/',
    },
    {
      text: 'Start Broadcast',
      icon: <VideoCameraFrontIcon style={{ color: '#303f9f' }} />,
      path: '/Client',
    },
  ];

  return (
    <div className={classes.root}>
      {/* app bar */}
      <AppBar className={classes.AppBar}>
        <Toolbar>
          <Typography variant="h4" align="center">WebRTC</Typography>
        </Toolbar>
      </AppBar>
      {/* side drawer */}
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{ paper: classes.drawerPaper }}
        anchor="left"
      >
        <div>
          <Typography variant="h5" className={classes.title}>
            EIE4428
          </Typography>
        </div>

        {/* links/list section */}
        <List className={classes.list}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => nav(item.path)}
              className={location.pathname === item.path ? classes.active : null}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* main content */}
      <div className={classes.page}>
        <div className={classes.toolbar} />
        { children }
      </div>
    </div>
  );
}
