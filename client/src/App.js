import React from 'react';
import { View, Dimensions, ActivityIndicator, Text } from 'react-native';
import evmLib from './evmLib';
import Home from './game/Home';
import {
  MemoryRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'busy',
      landscape: false,
      w: Dimensions.get('window').width
    };
  }

  componentDidMount() {
  }

  componentWillMount() {
  }

  render() {
    let ww = Dimensions.get('window').width;
    let wh = Dimensions.get('window').height;
    let w = ww - 20;
    let h = wh;

    return (
      <>
        <style type="text/css">{`
          @font-face {
            font-family: 'MaterialIcons';
            src: url(${require('react-native-vector-icons/Fonts/MaterialIcons.ttf')}) format('truetype');
          }

          @font-face {
            font-family: 'FontAwesome';
            src: url(${require('react-native-vector-icons/Fonts/FontAwesome.ttf')}) format('truetype');
          }
        `}</style>

        <View style={{ minWidth: w, height: h }}>
          <Router>
            <Switch>
              <Route path="/" component={Home} />
            </Switch>
          </Router>
        </View>
      </>
    );
  }

}

export default App;
